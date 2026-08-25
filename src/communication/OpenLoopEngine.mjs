// src/communication/OpenLoopEngine.mjs
// Open Loop Memory Engine for Tracking Unresolved Events

import fs from 'fs/promises';
import path from 'path';

const loopDir = path.resolve(process.cwd(), 'memory/open_loops');

export class OpenLoopEngine {
    static async getLoops(chatId) {
        await fs.mkdir(loopDir, { recursive: true });
        const filePath = path.join(loopDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    static async registerLoop(chatId, loopData) {
        const loops = await this.getLoops(chatId);
        loops.push({
            id: Date.now(),
            topic: loopData.topic || 'general',
            statement: loopData.statement,
            status: 'pending',
            createdAt: Date.now(),
            importance: loopData.importance || 0.8
        });
        if (loops.length > 5) loops.shift();

        await fs.mkdir(loopDir, { recursive: true });
        const filePath = path.join(loopDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        await fs.writeFile(filePath, JSON.stringify(loops, null, 2), 'utf8');
    }

    static getMaturedLoops(loops) {
        const now = Date.now();
        // Matured if created > 20 seconds ago and status is pending
        return loops.filter(l => l.status === 'pending' && (now - l.createdAt > 20000));
    }
}
