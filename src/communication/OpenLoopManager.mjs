// src/communication/OpenLoopManager.mjs
import fs from 'fs/promises';
import path from 'path';

const storageDir = path.resolve(process.cwd(), 'memory/open_loops');

export class OpenLoopManager {
    static async getLoops(chatId) {
        await fs.mkdir(storageDir, { recursive: true });
        const filePath = path.join(storageDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
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
            id: 'loop_' + Date.now(),
            topic: loopData.topic || 'general',
            statement: loopData.statement,
            followUpAfter: Date.now() + (loopData.delayMs || 3600000), // Default 1 hr
            importance: loopData.importance || 0.7,
            status: 'OPEN',
            createdAt: Date.now()
        });

        const updated = loops.slice(-15);
        const filePath = path.join(storageDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
        await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf8');
    }

    static async markResolved(chatId, loopId) {
        const loops = await this.getLoops(chatId);
        for (const l of loops) {
            if (l.id === loopId) l.status = 'RESOLVED';
        }
        const filePath = path.join(storageDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
        await fs.writeFile(filePath, JSON.stringify(loops, null, 2), 'utf8');
    }

    static getMaturedLoops(loops) {
        const now = Date.now();
        return loops.filter(l => l.status === 'OPEN' && now >= l.followUpAfter);
    }
}
