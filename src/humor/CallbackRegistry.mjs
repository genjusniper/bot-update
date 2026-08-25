// src/humor/CallbackRegistry.mjs
// Context-Aware Callback Event Registry

import fs from 'fs/promises';
import path from 'path';

const cbDir = path.resolve(process.cwd(), 'memory/callback_registry');

export class CallbackRegistry {
    static async getEvents(chatId) {
        await fs.mkdir(cbDir, { recursive: true });
        const filePath = path.join(cbDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    static async registerFunnyEvent(chatId, eventData) {
        const events = await this.getEvents(chatId);
        events.push({
            id: `evt_${Date.now()}`,
            triggerKeyword: eventData.triggerKeyword, // e.g. 'diet', 'salah kirim', 'laptop'
            description: eventData.description,       // e.g. 'katanya diet tapi beli martabak'
            punchlineHint: eventData.punchlineHint || '',
            createdAt: Date.now(),
            useCount: 0
        });
        if (events.length > 8) events.shift();

        await fs.mkdir(cbDir, { recursive: true });
        const filePath = path.join(cbDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        await fs.writeFile(filePath, JSON.stringify(events, null, 2), 'utf8');
    }

    static findMatchingCallback(message, events = []) {
        const lower = (message || '').toLowerCase();
        for (const evt of events) {
            if (lower.includes(evt.triggerKeyword.toLowerCase())) {
                return evt;
            }
        }
        return null;
    }
}
