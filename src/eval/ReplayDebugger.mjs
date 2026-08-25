// src/eval/ReplayDebugger.mjs
import fs from 'fs/promises';
import path from 'path';

const replayDir = path.resolve(process.cwd(), 'memory/replays');

export class ReplayDebugger {
    static async recordTrace(correlationId, traceData) {
        if (!correlationId) return;
        await fs.mkdir(replayDir, { recursive: true });
        const filePath = path.join(replayDir, `${correlationId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        await fs.writeFile(filePath, JSON.stringify({
            correlationId,
            timestamp: Date.now(),
            ...traceData
        }, null, 2), 'utf8');
    }

    static async getTrace(correlationId) {
        const filePath = path.join(replayDir, `${correlationId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }
}
