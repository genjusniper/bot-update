// src/humor/InsideJokeRegistry.mjs
import fs from 'fs/promises';
import path from 'path';

const storageDir = path.resolve(process.cwd(), 'memory/inside_jokes');

export class InsideJokeRegistry {
    static async getRegistry(chatId) {
        await fs.mkdir(storageDir, { recursive: true });
        const filePath = path.join(storageDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}_jokes.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return [
                {
                    id: 'joke_quota_32',
                    topic: 'kuota jebol 32 key',
                    confidence: 0.95,
                    timesReferenced: 1,
                    positiveReaction: 1,
                    triggerKeywords: ['kuota', 'limit', 'api', 'key', 'termux']
                }
            ];
        }
    }

    static async recordJokeReaction(chatId, jokeId, wasPositive = true) {
        const list = await this.getRegistry(chatId);
        const target = list.find(j => j.id === jokeId);
        if (target) {
            target.timesReferenced++;
            if (wasPositive) target.positiveReaction++;
            const filePath = path.join(storageDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}_jokes.json`);
            await fs.writeFile(filePath, JSON.stringify(list, null, 2), 'utf8');
        }
    }

    static findMatchingJoke(chatId, message, registry = []) {
        const text = (message || '').toLowerCase();
        for (const j of registry) {
            if (j.positiveReaction > 0 && j.triggerKeywords.some(k => text.includes(k))) {
                return j;
            }
        }
        return null;
    }
}
