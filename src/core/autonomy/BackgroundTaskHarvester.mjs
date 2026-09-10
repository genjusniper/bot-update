// src/core/autonomy/BackgroundTaskHarvester.mjs
// Autonomous Background Task Harvester
// Proactive resource maintenance: pruning stale caches, checking open loops, memory monitoring, and WAL checkpoints

export class BackgroundTaskHarvester {
    constructor(options = {}) {
        this.intervalMs = options.intervalMs || 15 * 60 * 1000; // Default 15 minutes
        this.timer = null;
        this.isRunning = false;

        this.handlers = {
            onPruneCache: options.onPruneCache || null,
            onCheckOpenLoops: options.onCheckOpenLoops || null,
            onMemoryCheck: options.onMemoryCheck || null,
            onWalCheckpoint: options.onWalCheckpoint || null
        };

        this.stats = {
            totalCycles: 0,
            lastCycleTimestamp: null,
            lastCycleDurationMs: 0,
            history: []
        };
    }

    /**
     * Registers a maintenance task hook
     * @param {string} hookName 
     * @param {Function} callback 
     */
    registerHook(hookName, callback) {
        if (typeof callback === 'function') {
            this.handlers[hookName] = callback;
        }
    }

    /**
     * Executes a single unified maintenance harvest cycle
     * @returns {Promise<Object>} Cycle report
     */
    async runHarvestCycle() {
        const startTime = Date.now();
        const report = {
            cycleId: `harvest_${startTime}`,
            timestamp: startTime,
            tasksExecuted: [],
            errors: []
        };

        // 1. Cache Pruning
        if (typeof this.handlers.onPruneCache === 'function') {
            try {
                const pruned = await this.handlers.onPruneCache();
                report.tasksExecuted.push({ task: 'PRUNE_CACHE', details: pruned });
            } catch (err) {
                report.errors.push({ task: 'PRUNE_CACHE', error: err.message });
            }
        }

        // 2. Open Loops & Reminders Check
        if (typeof this.handlers.onCheckOpenLoops === 'function') {
            try {
                const loops = await this.handlers.onCheckOpenLoops();
                report.tasksExecuted.push({ task: 'CHECK_OPEN_LOOPS', details: loops });
            } catch (err) {
                report.errors.push({ task: 'CHECK_OPEN_LOOPS', error: err.message });
            }
        }

        // 3. Proactive Memory Health Check
        if (typeof this.handlers.onMemoryCheck === 'function') {
            try {
                const mem = await this.handlers.onMemoryCheck();
                report.tasksExecuted.push({ task: 'CHECK_MEMORY', details: mem });
            } catch (err) {
                report.errors.push({ task: 'CHECK_MEMORY', error: err.message });
            }
        }

        // 4. SQLite WAL Checkpoint
        if (typeof this.handlers.onWalCheckpoint === 'function') {
            try {
                const wal = await this.handlers.onWalCheckpoint();
                report.tasksExecuted.push({ task: 'WAL_CHECKPOINT', details: wal });
            } catch (err) {
                report.errors.push({ task: 'WAL_CHECKPOINT', error: err.message });
            }
        }

        report.durationMs = Date.now() - startTime;
        this.stats.totalCycles++;
        this.stats.lastCycleTimestamp = startTime;
        this.stats.lastCycleDurationMs = report.durationMs;

        this.stats.history.push(report);
        if (this.stats.history.length > 50) this.stats.history.shift();

        return report;
    }

    /**
     * Starts the periodic harvest loop
     */
    start(intervalMs) {
        if (this.isRunning) return;
        if (intervalMs) this.intervalMs = intervalMs;

        this.isRunning = true;
        this.timer = setInterval(() => {
            this.runHarvestCycle().catch(() => {});
        }, this.intervalMs);

        if (this.timer.unref) this.timer.unref(); // Prevent blocking process shutdown
    }

    /**
     * Stops the periodic harvest loop
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isRunning = false;
    }

    getStats() {
        return {
            isRunning: this.isRunning,
            ...this.stats
        };
    }
}

export const backgroundTaskHarvester = new BackgroundTaskHarvester();
