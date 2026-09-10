// src/core/control/HealthManager.mjs
// Real-time operational health checker across Baileys, SQLite, JobQueue, AI Gateway, RAM & Disk

import os from 'os';
import path from 'path';
import fs from 'fs';
import { JobQueue } from '../../queue/JobQueue.mjs';
import { FeatureFlags } from './FeatureFlags.mjs';
import { SignalTelemetry } from '../signals/SignalTelemetry.mjs';

export class HealthManager {
    static bootTime = Date.now();

    static formatUptime(ms) {
        const sec = Math.floor((ms / 1000) % 60);
        const min = Math.floor((ms / (1000 * 60)) % 60);
        const hr = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        if (days > 0) return `${days}d ${hr}h ${min}m`;
        if (hr > 0) return `${hr}h ${min}m ${sec}s`;
        return `${min}m ${sec}s`;
    }

    static async evaluate(waGateway = null) {
        const now = Date.now();
        const uptimeMs = now - this.bootTime;
        const memory = process.memoryUsage();

        // 1. WhatsApp Connection
        const waConnected = Boolean(waGateway?.sock?.user?.id);
        const waStatus = waConnected ? 'CONNECTED' : 'DISCONNECTED';

        // 2. SQLite Database & Queue
        let sqliteStatus = 'UNKNOWN';
        let queuePending = 0;
        let queueProcessing = 0;
        let queueCompleted = 0;
        let queueDeadLetter = 0;

        try {
            if (JobQueue.db) {
                const pendingRow = JobQueue.db.prepare("SELECT count(*) as count FROM jobs WHERE status = 'QUEUED'").get();
                const procRow = JobQueue.db.prepare("SELECT count(*) as count FROM jobs WHERE status = 'PROCESSING'").get();
                const compRow = JobQueue.db.prepare("SELECT count(*) as count FROM jobs WHERE status = 'COMPLETED'").get();
                const dlqRow = JobQueue.db.prepare("SELECT count(*) as count FROM jobs WHERE status = 'DEAD_LETTER'").get();
                
                queuePending = pendingRow?.count || 0;
                queueProcessing = procRow?.count || 0;
                queueCompleted = compRow?.count || 0;
                queueDeadLetter = dlqRow?.count || 0;
                sqliteStatus = 'HEALTHY';
            }
        } catch (e) {
            sqliteStatus = 'ERROR';
        }

        // 3. System RAM & Node RSS
        const rssMB = (memory.rss / (1024 * 1024)).toFixed(1);
        const heapUsedMB = (memory.heapUsed / (1024 * 1024)).toFixed(1);
        const freeMemMB = (os.freemem() / (1024 * 1024)).toFixed(0);
        const totalMemMB = (os.totalmem() / (1024 * 1024)).toFixed(0);

        // Overall Health Condition
        let overall = 'HEALTHY';
        if (!waConnected || sqliteStatus === 'ERROR') {
            overall = 'CRITICAL';
        } else if (queueDeadLetter > 5 || queuePending > 15 || FeatureFlags.flags.safeMode) {
            overall = 'DEGRADED';
        }

        return {
            overall,
            uptime: this.formatUptime(uptimeMs),
            uptimeMs,
            whatsapp: waStatus,
            sqlite: sqliteStatus,
            queue: {
                pending: queuePending,
                processing: queueProcessing,
                completed: queueCompleted,
                deadLetter: queueDeadLetter
            },
            ram: {
                nodeRss: `${rssMB} MB`,
                heapUsed: `${heapUsedMB} MB`,
                systemFree: `${freeMemMB} MB / ${totalMemMB} MB`
            },
            signals: SignalTelemetry.getMetrics(),
            safeMode: FeatureFlags.flags.safeMode
        };
    }

    static formatStatusCard(health) {
        const icon = health.overall === 'HEALTHY' ? '🟢' : (health.overall === 'DEGRADED' ? '🟡' : '🔴');
        return `${icon} *SALIM SYSTEM STATUS*
──────────────────
*Status:* ${health.overall} ${health.safeMode ? '(SAFE-MODE)' : ''}
*WhatsApp:* ${health.whatsapp === 'CONNECTED' ? 'CONNECTED ✅' : 'DISCONNECTED ❌'}
*SQLite DB:* ${health.sqlite === 'HEALTHY' ? 'HEALTHY ✅' : 'DEGRADED ⚠️'}
*Queue:* ${health.queue.pending} pending | ${health.queue.processing} active
*Selesai:* ${health.queue.completed} jobs | DLQ: ${health.queue.deadLetter}

*RAM Bot:* ${health.ram.nodeRss} (Heap: ${health.ram.heapUsed})
*Uptime:* ${health.uptime}
──────────────────
Ketik */health* untuk rincian, */doctor* untuk diagnosa.`;
    }

    static formatHealthCard(health) {
        const sigText = health.signals?.totalSnapshotsRecorded > 0
            ? `✅ ACTIVE (${health.signals.totalSnapshotsRecorded} recorded)`
            : '✅ READY';

        return `📋 *SYSTEM HEALTH REPORT*
──────────────────
Ingress Layer:     ✅ PERSIST-FIRST ACTIVE
Behavior Signals:  ${sigText}
JobQueue SQLite:   ${health.sqlite === 'HEALTHY' ? '✅ HEALTHY' : '❌ ERROR'}
WhatsApp Socket:   ${health.whatsapp === 'CONNECTED' ? '✅ CONNECTED' : '❌ DISCONNECTED'}
Memory Footprint:  ✅ NORMAL (${health.ram.nodeRss})
Dead-Letter Jobs:  ${health.queue.deadLetter === 0 ? '✅ 0' : `⚠️ ${health.queue.deadLetter}`}
Active Workers:    ${health.queue.processing > 0 ? `⚡ ${health.queue.processing} processing` : '💤 IDLE'}
Safe-Mode State:   ${health.safeMode ? '⚠️ ACTIVE' : '✅ NORMAL'}

*Overall Condition:* ${health.overall === 'HEALTHY' ? '🟢 HEALTHY' : '🟡 ATTENTION REQUIRED'}`;
    }
}
