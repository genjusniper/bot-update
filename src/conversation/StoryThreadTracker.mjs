// src/conversation/StoryThreadTracker.mjs
// Story Thread Tracker keeping narrative threads coherent across time

import fs from 'fs/promises';
import path from 'path';

const threadDir = path.resolve(process.cwd(), 'memory/story_threads');

export class StoryThreadTracker {
    static async getThreads(chatId) {
        await fs.mkdir(threadDir, { recursive: true });
        const filePath = path.join(threadDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    static async recordStory(chatId, snippet, mainTopic = 'general') {
        const threads = await this.getThreads(chatId);
        threads.push({
            id: `story_${Date.now()}`,
            topic: mainTopic,
            summary: snippet.slice(0, 120),
            createdAt: Date.now(),
            expiresAt: Date.now() + (2 * 3600 * 1000) // 2 hours context
        });
        if (threads.length > 5) threads.shift();

        await fs.mkdir(threadDir, { recursive: true });
        const filePath = path.join(threadDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        await fs.writeFile(filePath, JSON.stringify(threads, null, 2), 'utf8');
    }

    static getActiveThreads(threads) {
        const now = Date.now();
        return threads.filter(t => t.expiresAt > now);
    }
}
