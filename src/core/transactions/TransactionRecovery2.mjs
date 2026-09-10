// src/core/transactions/TransactionRecovery2.mjs
// Phase 37: Transaction & Recovery 2.0
// Distributed Saga Coordinator, Idempotency Guard, Compensation Stack (LIFO), and Crash Recovery.

export const SagaState = Object.freeze({
    INITIATED: 'INITIATED',
    EXECUTING: 'EXECUTING',
    COMMITTED: 'COMMITTED',
    COMPENSATING: 'COMPENSATING',
    COMPENSATED: 'COMPENSATED',
    FAILED_COMPENSATION: 'FAILED_COMPENSATION'
});

export class SagaStep {
    /**
     * @param {Object} params
     * @param {string} params.name
     * @param {Function} params.forward - async (context) => result
     * @param {Function} [params.compensate] - async (stepResult, context) => rollbackResult
     * @param {boolean} [params.isCompensable=true]
     */
    constructor({ name, forward, compensate = null, isCompensable = true }) {
        if (!name) throw new Error('SagaStep: name is required');
        if (!forward || typeof forward !== 'function') throw new Error('SagaStep: forward function is required');

        this.name = name;
        this.forward = forward;
        this.compensate = compensate;
        this.isCompensable = isCompensable && typeof compensate === 'function';
        this.executed = false;
        this.result = null;
        this.error = null;
        this.executedAt = null;
        this.compensatedAt = null;
    }
}

export class SagaTransaction {
    /**
     * @param {Object} params
     * @param {string} [params.sagaId]
     * @param {string} params.name
     * @param {string} [params.idempotencyKey=null]
     * @param {Object} [params.context={}]
     */
    constructor({ sagaId, name, idempotencyKey = null, context = {} }) {
        this.sagaId = sagaId || 'saga_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        this.name = name || 'ANONYMOUS_SAGA';
        this.idempotencyKey = idempotencyKey;
        this.context = { ...context };
        this.state = SagaState.INITIATED;
        this.steps = [];
        this.compensationStack = [];
        this.journal = [];
        this.stepResults = {};
        this.createdAt = Date.now();
        this.completedAt = null;

        this.logJournal('SAGA_INITIATED');
    }

    addStep(step) {
        const stepInstance = step instanceof SagaStep ? step : new SagaStep(step);
        this.steps.push(stepInstance);
        return this;
    }

    logJournal(event, details = {}) {
        this.journal.push({
            at: Date.now(),
            state: this.state,
            event,
            details
        });
    }

    toJSON() {
        return {
            sagaId: this.sagaId,
            name: this.name,
            idempotencyKey: this.idempotencyKey,
            state: this.state,
            stepsCount: this.steps.length,
            compensationStackCount: this.compensationStack.length,
            stepResults: this.stepResults,
            journalCount: this.journal.length,
            createdAt: this.createdAt,
            completedAt: this.completedAt
        };
    }
}

export class TransactionRecovery2 {
    static #idempotencyStore = new Map(); // key -> { result, state, timestamp }
    static #activeSagas = new Map(); // sagaId -> SagaTransaction
    static #maxIdempotencyEntries = 200;
    static #idempotencyTTLms = 24 * 60 * 60 * 1000; // 24 hours

    /**
     * Creates a new Saga transaction
     * @param {Object} params
     * @returns {SagaTransaction}
     */
    static createSaga(params) {
        const saga = new SagaTransaction(params);
        this.#activeSagas.set(saga.sagaId, saga);
        return saga;
    }

    /**
     * Executes the Saga transaction with strict idempotency and LIFO rollback
     * @param {SagaTransaction} saga
     * @returns {Promise<Object>}
     */
    static async execute(saga) {
        this.#pruneExpiredIdempotency();

        // 1. Idempotency Check
        if (saga.idempotencyKey) {
            const cached = this.#idempotencyStore.get(saga.idempotencyKey);
            if (cached) {
                if (cached.state === SagaState.COMMITTED) {
                    saga.logJournal('IDEMPOTENT_HIT', { idempotencyKey: saga.idempotencyKey });
                    return {
                        success: true,
                        idempotentHit: true,
                        sagaId: saga.sagaId,
                        state: SagaState.COMMITTED,
                        result: cached.result,
                        message: 'Idempotent request served from cache.'
                    };
                }
                if (cached.state === SagaState.EXECUTING) {
                    return {
                        success: false,
                        concurrentExecutionDetected: true,
                        sagaId: saga.sagaId,
                        state: SagaState.EXECUTING,
                        error: 'IN_FLIGHT_IDEMPOTENT_TRANSACTION: Duplicate execution blocked.'
                    };
                }
            }

            // Register key as EXECUTING
            this.#idempotencyStore.set(saga.idempotencyKey, {
                state: SagaState.EXECUTING,
                timestamp: Date.now(),
                result: null
            });
        }

        saga.state = SagaState.EXECUTING;
        saga.logJournal('SAGA_EXECUTION_STARTED');

        let failedStep = null;
        let stepError = null;

        // 2. Forward Execution Loop
        for (const step of saga.steps) {
            saga.logJournal('STEP_START', { stepName: step.name });
            step.executedAt = Date.now();

            try {
                const output = await step.forward(saga.context);
                step.result = output;
                step.executed = true;
                saga.stepResults[step.name] = output;

                // Push to LIFO compensation stack if compensable
                if (step.isCompensable) {
                    saga.compensationStack.push(step);
                }

                saga.logJournal('STEP_SUCCESS', { stepName: step.name, output });
            } catch (err) {
                step.error = err.message;
                failedStep = step;
                stepError = err;
                saga.logJournal('STEP_FAILED', { stepName: step.name, error: err.message });
                break;
            }
        }

        // 3. Commit or Compensate
        if (!failedStep) {
            saga.state = SagaState.COMMITTED;
            saga.completedAt = Date.now();
            saga.logJournal('SAGA_COMMITTED');

            if (saga.idempotencyKey) {
                this.#cacheIdempotency(saga.idempotencyKey, saga.stepResults, SagaState.COMMITTED);
            }

            return {
                success: true,
                idempotentHit: false,
                sagaId: saga.sagaId,
                state: saga.state,
                results: saga.stepResults,
                journal: saga.journal
            };
        }

        // 4. Compensation Rollback Loop (LIFO)
        saga.state = SagaState.COMPENSATING;
        saga.logJournal('SAGA_COMPENSATION_STARTED', { failedAtStep: failedStep.name, error: stepError.message });

        const compensationErrors = [];

        while (saga.compensationStack.length > 0) {
            const compStep = saga.compensationStack.pop();
            saga.logJournal('COMPENSATING_STEP', { stepName: compStep.name });

            try {
                await compStep.compensate(compStep.result, saga.context);
                compStep.compensatedAt = Date.now();
                saga.logJournal('COMPENSATED_STEP_SUCCESS', { stepName: compStep.name });
            } catch (compErr) {
                compensationErrors.push({ stepName: compStep.name, error: compErr.message });
                saga.logJournal('COMPENSATED_STEP_ERROR', { stepName: compStep.name, error: compErr.message });
            }
        }

        if (compensationErrors.length > 0) {
            saga.state = SagaState.FAILED_COMPENSATION;
        } else {
            saga.state = SagaState.COMPENSATED;
        }

        saga.completedAt = Date.now();
        saga.logJournal('SAGA_ROLLBACK_COMPLETE', { state: saga.state, compensationErrors });

        if (saga.idempotencyKey) {
            this.#idempotencyStore.delete(saga.idempotencyKey);
        }

        return {
            success: false,
            idempotentHit: false,
            sagaId: saga.sagaId,
            state: saga.state,
            failedStep: failedStep.name,
            error: stepError.message,
            compensated: saga.state === SagaState.COMPENSATED,
            compensationErrors
        };
    }

    /**
     * Crash Consistency Recovery: scans and compensates any pending/in-flight transactions
     * @returns {Promise<Object>}
     */
    static async recoverPendingTransactions() {
        const uncommitted = Array.from(this.#activeSagas.values()).filter(
            s => s.state === SagaState.EXECUTING || s.state === SagaState.COMPENSATING
        );

        const recoveryReport = [];

        for (const saga of uncommitted) {
            console.warn('[TransactionRecovery] 🛡️ Recovering dangling uncommitted saga:', saga.sagaId);
            saga.state = SagaState.COMPENSATING;

            while (saga.compensationStack.length > 0) {
                const compStep = saga.compensationStack.pop();
                try {
                    await compStep.compensate(compStep.result, saga.context);
                } catch (err) {
                    console.error('[TransactionRecovery] ❌ Recovery compensation failed for step:', compStep.name, err.message);
                }
            }

            saga.state = SagaState.COMPENSATED;
            saga.completedAt = Date.now();
            recoveryReport.push({ sagaId: saga.sagaId, state: saga.state });
        }

        return {
            recoveredCount: recoveryReport.length,
            sagas: recoveryReport
        };
    }

    static #cacheIdempotency(key, result, state) {
        if (this.#idempotencyStore.size >= this.#maxIdempotencyEntries) {
            const oldestKey = this.#idempotencyStore.keys().next().value;
            this.#idempotencyStore.delete(oldestKey);
        }
        this.#idempotencyStore.set(key, {
            result,
            state,
            timestamp: Date.now()
        });
    }

    static #pruneExpiredIdempotency() {
        const now = Date.now();
        for (const [key, item] of this.#idempotencyStore.entries()) {
            if (now - item.timestamp > this.#idempotencyTTLms) {
                this.#idempotencyStore.delete(key);
            }
        }
    }

    static getIdempotencyEntry(key) {
        this.#pruneExpiredIdempotency();
        return this.#idempotencyStore.get(key) || null;
    }

    static clear() {
        this.#idempotencyStore.clear();
        this.#activeSagas.clear();
    }
}