// src/maintenance/StorageAutoPruner.mjs
// Automated 72h storage & log cleaner to prevent ENOSPC on Android Termux (97% disk full)

import fs from 'fs/promises';
import path from 'path';

export class StorageAutoPruner {
    static async pruneOldTraces(baseDir = process.cwd(), maxAgeHours = 48) {
        const now = Date.now();
        const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
        let deletedCount = 0;

        const targetDirs = [
            path.join(baseDir, 'memory', 'traces'),
            path.join(baseDir, 'memory', 'lifecycle'),
            path.join(baseDir, 'memory', 'transcripts'),
            path.join(baseDir, 'temp')
        ];

        for (const dir of targetDirs) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.isFile() && (entry.name.endsWith('.json') || entry.name.endsWith('.log') || entry.name.endsWith('.tmp'))) {
                        const filePath = path.join(dir, entry.name);
                        try {
                            const stat = await fs.stat(filePath);
                            if (now - stat.mtimeMs > maxAgeMs) {
                                await fs.unlink(filePath);
                                deletedCount++;
                            }
                        } catch {}
                    }
                }
            } catch {}
        }

        if (deletedCount > 0) {
            console.log(`[StorageAutoPruner] 🧹 Pruned ${deletedCount} stale trace/temp files (> ${maxAgeHours}h old).`);
        }
    }

    static startCron(intervalHours = 6) {
        // Run once at startup
        this.pruneOldTraces().catch(() => {});
        // Repeat periodically
        setInterval(() => {
            this.pruneOldTraces().catch(() => {});
        }, intervalHours * 60 * 60 * 1000);
        console.log(`[StorageAutoPruner] 🛡️ Active: Auto-pruning storage every ${intervalHours}h.`);
    }
}
