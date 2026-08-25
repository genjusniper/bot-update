// src/subsystems/life/LifeBrain.mjs
// Life Brain: Open Loops, Hobby Tracker, Daily Context & Recommendation Engine

import fs from 'fs/promises';
import path from 'path';

export class LifeBrain {
    static getFilePath(chatId) {
        const cleanId = chatId.replace(/[^a-zA-Z0-9_-]/g, '_');
        return path.resolve(process.cwd(), 'memory', `${cleanId}_life.json`);
    }

    static async load(chatId) {
        const filePath = this.getFilePath(chatId);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch {
            return {
                openLoops: [],
                hobbies: ['PC & Tech', 'WhatsApp Bot', 'Coding'],
                dailyContext: {},
                lastUpdated: Date.now()
            };
        }
    }

    static async save(chatId, data) {
        const filePath = this.getFilePath(chatId);
        try {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (e) {
            console.error('[LifeBrain] ⚠️ Error saving life memory:', e.message);
        }
    }

    static async recordOpenLoop(chatId, message) {
        const text = (message || '').trim();
        // Detect promises/intentions: e.g. "nanti mau benerin PC", "besok mau servis motor", "lagi mikirin mau beli sepatu"
        const loopMatch = text.match(/(nanti|besok|minggu ini|lagi mau|pengen|mau|rencana)\s+(benerin|servis|beli|ganti|rakit|bikin|kerjain|ngurus)\s+([^\.\n\?]+)/i);
        if (loopMatch) {
            const data = await this.load(chatId);
            const topic = loopMatch[0].trim();
            if (!data.openLoops.some(l => l.text === topic && l.status === 'OPEN')) {
                data.openLoops.push({
                    id: `loop_${Date.now()}`,
                    text: topic,
                    status: 'OPEN',
                    createdAt: new Date().toISOString()
                });
                if (data.openLoops.length > 8) data.openLoops.shift();
                await this.save(chatId, data);
                console.log(`[LifeBrain] 🧠 Recorded Open Loop for ${chatId}: "${topic}"`);
            }
        }
    }

    static formatContext(data) {
        if (!data) return '';
        const activeLoops = (data.openLoops || []).filter(l => l.status === 'OPEN').map(l => l.text);
        const hobbies = (data.hobbies || []).join(', ');

        const lines = [];
        if (activeLoops.length > 0) lines.push(`- Open Loops / Rencana User: "${activeLoops.join('", "')}" (Bisa disinggung natural bila relevan)`);
        if (hobbies.length > 0) lines.push(`- Minat & Hobi User: ${hobbies}`);

        return lines.length > 0 ? `=== LIFE BRAIN CONTEXT ===\n${lines.join('\n')}\n==========================` : '';
    }
}
