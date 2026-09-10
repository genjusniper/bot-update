// src/core/autonomy/AutonomousTaskExecutor.mjs
// Safe, autonomous background worker coordinating non-destructive tasks

export class AutonomousTaskExecutor {
    static #activeTasks = new Map();

    /**
     * Dispatches a safe background task
     * @param {string} taskId
     * @param {Function} taskFn
     * @returns {Promise<Object>}
     */
    static async executeSafe(taskId, taskFn) {
        if (this.#activeTasks.has(taskId)) {
            return { executed: false, reason: 'TASK_ALREADY_RUNNING' };
        }

        this.#activeTasks.set(taskId, Date.now());
        try {
            const result = await taskFn();
            return { executed: true, taskId, result };
        } catch (err) {
            return { executed: false, taskId, error: err.message };
        } finally {
            this.#activeTasks.delete(taskId);
        }
    }

    static getRunningTaskCount() {
        return this.#activeTasks.size;
    }
}
