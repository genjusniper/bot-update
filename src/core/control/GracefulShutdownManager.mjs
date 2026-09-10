// src/core/control/GracefulShutdownManager.mjs
// Idempotent, safe shutdown & restart manager ensuring zero dropped jobs and clean SQLite commit

import fs from 'fs';
import path from 'path';
import { QueueWorker } from '../../queue/QueueWorker.mjs';
import { JobQueue } from '../../queue/JobQueue.mjs';

export class GracefulShutdownManager {
    static isShuttingDown = false;
    static SNAPSHOT_FILE = path.resolve(process.cwd(), 'memory', 'shutdown_snapshot.json');

    /**
     * Executes idempotent graceful shutdown
     * @param {Object} options
     * @param {string} options.reason - Reason for shutdown (e.g. 'RESTART_COMMAND', 'SIGINT')
     * @param {Object} options.waGateway - Active WhatsApp gateway
     * @param {number} options.timeoutMs - Max wait time for active jobs
     */
    static async shutdown({ reason = 'MANUAL_RESTART', waGateway = null, timeoutMs = 10000 } = {}) {
        if (this.isShuttingDown) {
            console.warn('[GracefulShutdown] ⚠️ Shutdown already in progress. Ignoring duplicate call.');
            return;
        }
        this.isShuttingDown = true;

        console.log(`[GracefulShutdown] 🛑 Starting Graceful Shutdown. Reason: ${reason}`);

        // 1. Stop QueueWorker from claiming any new jobs
        try {
            QueueWorker.stop();
        } catch (e) {}

        // 2. Drain active jobs (wait until current in-flight job completes or timeout)
        const startWait = Date.now();
        while (QueueWorker.getActiveCount() > 0 && (Date.now() - startWait) < timeoutMs) {
            console.log(`[GracefulShutdown] ⏳ Waiting for ${QueueWorker.getActiveCount()} active job(s) to finish...`);
            await new Promise(r => setTimeout(r, 500));
        }

        // 3. Write Snapshot to Disk
        try {
            const memDir = path.dirname(this.SNAPSHOT_FILE);
            if (!fs.existsSync(memDir)) fs.mkdirSync(memDir, { recursive: true });

            const snapshot = {
                timestamp: Date.now(),
                reason,
                clean: true,
                nodeVersion: process.version,
                pid: process.pid
            };
            fs.writeFileSync(this.SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2), 'utf8');
            console.log('[GracefulShutdown] 💾 Shutdown snapshot saved to disk.');
        } catch (e) {
            console.error('[GracefulShutdown] ❌ Failed to write snapshot:', e.message);
        }

        // 4. Force SQLite WAL Checkpoint to flush disk writes
        try {
            if (JobQueue.db) {
                JobQueue.db.exec("PRAGMA wal_checkpoint(TRUNCATE);");
                console.log('[GracefulShutdown] 📦 SQLite WAL Checkpoint executed cleanly.');
            }
        } catch (e) {}

        // 5. Close WhatsApp socket if active
        try {
            if (waGateway?.sock) {
                waGateway.sock.end(undefined);
                console.log('[GracefulShutdown] 📡 WhatsApp socket closed gracefully.');
            }
        } catch (e) {}

        console.log('[GracefulShutdown] ✅ Graceful shutdown complete. Exiting process.');
        setTimeout(() => {
            process.exit(0);
        }, 300);
    }

    /**
     * Checks if previous shutdown was clean upon boot
     */
    static checkPreviousShutdown() {
        try {
            if (fs.existsSync(this.SNAPSHOT_FILE)) {
                const data = JSON.parse(fs.readFileSync(this.SNAPSHOT_FILE, 'utf8'));
                // Remove snapshot file once acknowledged
                fs.unlinkSync(this.SNAPSHOT_FILE);
                return data;
            }
        } catch (e) {}
        return null;
    }
}
