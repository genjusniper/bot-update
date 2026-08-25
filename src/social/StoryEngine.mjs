// src/social/StoryEngine.mjs
import fs from 'fs/promises';
import path from 'path';

const storageDir = path.resolve(process.cwd(), 'memory/stories');

export class StoryEngine {
    static async getStories(chatId) {
        await fs.mkdir(storageDir, { recursive: true });
        const filePath = path.join(storageDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}_stories.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    static async recordStory(chatId, snippet) {
        const stories = await this.getStories(chatId);
        stories.push({
            snippet: snippet.slice(0, 150),
            openLoop: true,
            timestamp: Date.now()
        });
        const updated = stories.slice(-10);
        const filePath = path.join(storageDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}_stories.json`);
        await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf8');
    }

    static getActiveStoryArcs(stories = []) {
        const active = stories.filter(s => s.openLoop);
        if (active.length === 0) return '';
        return active.map(s => `- Cerita belum selesai: "${s.snippet}"`).join('\n');
    }
}
