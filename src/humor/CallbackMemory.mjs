// src/humor/CallbackMemory.mjs
// Callback Memory for Inside Jokes & Anecdotes

import fs from 'fs/promises';
import path from 'path';

const memoryDir = path.resolve(process.cwd(), 'memory/inside_jokes');

export class CallbackMemory {
    static async getJokes(chatId) {
        await fs.mkdir(memoryDir, { recursive: true });
        const filePath = path.join(memoryDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    static async registerJoke(chatId, jokeData) {
        const jokes = await this.getJokes(chatId);
        jokes.push({
            id: Date.now(),
            keyword: jokeData.keyword,
            jokeText: jokeData.jokeText,
            context: jokeData.context || 'general',
            usedCount: 0,
            lastUsed: 0,
            createdAt: Date.now()
        });
        if (jokes.length > 10) jokes.shift();

        await fs.mkdir(memoryDir, { recursive: true });
        const filePath = path.join(memoryDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        await fs.writeFile(filePath, JSON.stringify(jokes, null, 2), 'utf8');
    }

    static findMatchingJoke(chatId, message, jokes) {
        const lower = message.toLowerCase();
        for (const joke of jokes) {
            if (lower.includes(joke.keyword.toLowerCase())) {
                return joke;
            }
        }
        return null;
    }
}
