// src/communication/AntiRepetitionEngine.mjs
// Anti-Repetition & Controlled Variance Engine

import fs from 'fs/promises';
import path from 'path';

const historyDir = path.resolve(process.cwd(), 'memory/recent_responses');

export class AntiRepetitionEngine {
    static async getRecentResponses(chatId) {
        await fs.mkdir(historyDir, { recursive: true });
        const filePath = path.join(historyDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    static async recordResponse(chatId, responseText) {
        const history = await this.getRecentResponses(chatId);
        history.push({
            text: responseText.trim().toLowerCase(),
            opener: responseText.trim().split(/\s+/)[0]?.toLowerCase() || '',
            timestamp: Date.now()
        });
        if (history.length > 8) history.shift();

        await fs.mkdir(historyDir, { recursive: true });
        const filePath = path.join(historyDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        await fs.writeFile(filePath, JSON.stringify(history, null, 2), 'utf8');
    }

    static isRepetitive(newResponse, recentResponses = []) {
        const lower = (newResponse || '').trim().toLowerCase();
        if (recentResponses.length === 0) return false;

        // 1. Exact match with last 3 replies
        const last3 = recentResponses.slice(-3);
        if (last3.some(r => r.text === lower)) return true;

        // 2. Opener repetition (e.g. 3 consecutive "wkwk" or "lha")
        const newOpener = lower.split(/\s+/)[0];
        const sameOpenerCount = last3.filter(r => r.opener === newOpener).length;
        if (sameOpenerCount >= 3) return true;

        return false;
    }

    static applyControlledVariance(text) {
        // Subtle alternative variations if needed
        const variations = [
            [/\bwkwk iya sih\b/gi, 'bener juga sih wkwk'],
            [/\bwkwk parah\b/gi, 'asli parah banget 😂'],
            [/\baman bro\b/gi, 'tenang, aman kok 👍']
        ];

        let varied = text;
        for (const [pattern, replacement] of variations) {
            if (pattern.test(varied)) {
                varied = varied.replace(pattern, replacement);
                break;
            }
        }
        return varied;
    }
}
