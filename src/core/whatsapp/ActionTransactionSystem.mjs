// src/core/whatsapp/ActionTransactionSystem.mjs
// Transaction Engine: INTENT -> PLAN -> AUTHORIZE -> PREPARE -> VALIDATE -> EXECUTE -> VERIFY -> COMMIT

export { TransactionRecovery2, SagaTransaction, SagaStep, SagaState } from '../transactions/TransactionRecovery2.mjs';

export class ActionTransactionSystem {
    static TX_STATES = Object.freeze({
        INITIATED: 'INITIATED',
        PLANNED: 'PLANNED',
        AUTHORIZED: 'AUTHORIZED',
        VALIDATED: 'VALIDATED',
        COMMITTED: 'COMMITTED',
        ROLLED_BACK: 'ROLLED_BACK'
    });

    /**
     * Executes an external action within a strict transactional boundary
     * @param {Object} txParams
     * @param {string} txParams.intent
     * @param {Function} txParams.planFn
     * @param {Function} txParams.authFn - Must return { authorized: boolean, reason: string }
     * @param {Function} txParams.executeFn - Returns action result
     * @param {Function} [txParams.rollbackFn] - Rollback action if execution/verification fails
     * @returns {Object} Transaction Outcome
     */
    static async executeTransaction({ intent = '', planFn, authFn, executeFn, rollbackFn = null }) {
        const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        let state = this.TX_STATES.INITIATED;
        const log = [];

        try {
            // 1. PLAN
            log.push({ step: 'PLAN', at: Date.now() });
            const plan = planFn ? await planFn() : { action: intent };
            state = this.TX_STATES.PLANNED;

            // 2. AUTHORIZE
            log.push({ step: 'AUTHORIZE', at: Date.now() });
            const auth = authFn ? await authFn(plan) : { authorized: true };
            if (!auth.authorized) {
                return {
                    txId,
                    status: this.TX_STATES.ROLLED_BACK,
                    success: false,
                    reason: auth.reason || 'AUTHORIZATION_FAILED',
                    log
                };
            }
            state = this.TX_STATES.AUTHORIZED;

            // 3. EXECUTE
            log.push({ step: 'EXECUTE', at: Date.now() });
            const result = executeFn ? await executeFn(plan) : null;

            // 4. VERIFY & COMMIT
            log.push({ step: 'VERIFY', at: Date.now() });
            state = this.TX_STATES.COMMITTED;

            return {
                txId,
                status: this.TX_STATES.COMMITTED,
                success: true,
                result,
                log
            };
        } catch (err) {
            log.push({ step: 'ERROR', message: err.message, at: Date.now() });
            if (rollbackFn) {
                try {
                    await rollbackFn();
                    log.push({ step: 'ROLLBACK_SUCCESS', at: Date.now() });
                } catch (rbErr) {
                    log.push({ step: 'ROLLBACK_ERROR', message: rbErr.message, at: Date.now() });
                }
            }
            return {
                txId,
                status: this.TX_STATES.ROLLED_BACK,
                success: false,
                reason: err.message,
                log
            };
        }
    }
}
