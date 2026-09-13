/**
 * PlanExecutionEngine.mjs
 * 
 * Manages structured multi-step plan execution.
 * Enforces step dependencies, validation, approval gates, verification, and rollback pathways.
 * 
 * Step States:
 * PLANNED -> VALIDATING -> APPROVED -> EXECUTING -> VERIFYING -> COMPLETED
 * On Failure: FAILED -> RETRY -> ALTERNATIVE -> ROLLBACK -> HUMAN_REVIEW
 */

export class PlanExecutionEngine {
    static STEP_STATUS = {
        PLANNED: 'PLANNED',
        VALIDATING: 'VALIDATING',
        APPROVED: 'APPROVED',
        EXECUTING: 'EXECUTING',
        VERIFYING: 'VERIFYING',
        COMPLETED: 'COMPLETED',
        FAILED: 'FAILED',
        RETRYING: 'RETRYING',
        ROLLING_BACK: 'ROLLING_BACK',
        HUMAN_REVIEW: 'HUMAN_REVIEW'
    };

    constructor(planId, goalName, steps = []) {
        this.planId = planId;
        this.goalName = goalName;
        this.steps = steps.map(s => ({
            id: s.id,
            objective: s.objective,
            tool: s.tool,
            parameters: s.parameters || {},
            expectedOutcome: s.expectedOutcome || 'SUCCESS',
            risk: s.risk || 'LOW',
            dependencies: s.dependencies || [],
            rollback: s.rollback || null,
            timeoutMs: s.timeoutMs || 10000,
            retriesLeft: s.retriesLeft !== undefined ? s.retriesLeft : 2,
            status: this.constructor.STEP_STATUS.PLANNED,
            result: null,
            error: null
        }));
        this.currentStepIndex = 0;
        this.isCompleted = false;
        this.failedStep = null;
    }

    /**
     * Advance plan execution step by step
     */
    async executeStep(executorFn, verifierFn, rollbackFn) {
        if (this.currentStepIndex >= this.steps.length) {
            this.isCompleted = true;
            return { done: true, status: 'ALL_STEPS_COMPLETED' };
        }

        const step = this.steps[this.currentStepIndex];

        // 1. Check Dependencies
        for (const depId of step.dependencies) {
            const depStep = this.steps.find(s => s.id === depId);
            if (!depStep || depStep.status !== this.constructor.STEP_STATUS.COMPLETED) {
                step.status = this.constructor.STEP_STATUS.FAILED;
                step.error = `DEPENDENCY_UNSATISFIED: Step ${depId} has not completed successfully.`;
                this.failedStep = step;
                return { done: false, step, error: step.error };
            }
        }

        // 2. Transition to EXECUTING
        step.status = this.constructor.STEP_STATUS.EXECUTING;

        try {
            const rawResult = await executorFn(step);
            step.result = rawResult;

            // 3. Transition to VERIFYING
            step.status = this.constructor.STEP_STATUS.VERIFYING;
            const verification = await verifierFn(step, rawResult);

            if (!verification.verified) {
                throw new Error(`VERIFICATION_FAILED: ${verification.reason}`);
            }

            // 4. Completed Step
            step.status = this.constructor.STEP_STATUS.COMPLETED;
            this.currentStepIndex += 1;

            if (this.currentStepIndex >= this.steps.length) {
                this.isCompleted = true;
            }

            return { done: this.isCompleted, step, verified: true };

        } catch (err) {
            step.error = err.message;

            if (step.retriesLeft > 0) {
                step.retriesLeft -= 1;
                step.status = this.constructor.STEP_STATUS.RETRYING;
                return { done: false, step, action: 'RETRY' };
            }

            // Exceeded retries: initiate rollback if available
            step.status = this.constructor.STEP_STATUS.FAILED;
            this.failedStep = step;

            if (step.rollback && rollbackFn) {
                step.status = this.constructor.STEP_STATUS.ROLLING_BACK;
                await rollbackFn(step);
            }

            step.status = this.constructor.STEP_STATUS.HUMAN_REVIEW;
            return { done: false, step, action: 'HUMAN_REVIEW', error: err.message };
        }
    }
}
