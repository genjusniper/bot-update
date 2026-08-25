// src/communication/StyleLearningEngine.mjs
// Statistical Style Learning Engine from Real Interaction Logs

import fs from 'fs/promises';
import path from 'path';

const styleDir = path.resolve(process.cwd(), 'memory/learned_styles');

export class StyleLearningEngine {
    static async getLearnedStyle(chatId) {
        await fs.mkdir(styleDir, { recursive: true });
        const filePath = path.join(styleDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return {
                avgSentenceLength: 8,
                javaneseRatio: 0.5,
                slangRate: 0.6,
                emojiRate: 0.15,
                lowercasePreference: true,
                totalTurnsAnalyzed: 0
            };
        }
    }

    static async learnFromMessage(chatId, incomingText) {
        const style = await this.getLearnedStyle(chatId);
        const text = incomingText.trim();
        const words = text.split(/\s+/).length;

        // Count Javanese cues
        const isJawa = Boolean(text.match(/(yo|ki|to|wae|lha|ngopo|piye|mangan|kue|kowe|opo|ora|ra|wis|wes|dadi)/i));
        const hasSlang = Boolean(text.match(/(wkwk|njir|anjir|gas|lah|bro|cuy|bener)/i));
        const hasEmoji = Boolean(text.match(/[\u{1F300}-\u{1F6FF}]/u));

        // Moving average update
        style.totalTurnsAnalyzed++;
        style.avgSentenceLength = Math.round((style.avgSentenceLength * 0.8) + (words * 0.2));
        style.javaneseRatio = Number(((style.javaneseRatio * 0.8) + (isJawa ? 0.2 : 0.0)).toFixed(2));
        style.slangRate = Number(((style.slangRate * 0.8) + (hasSlang ? 0.2 : 0.0)).toFixed(2));
        style.emojiRate = Number(((style.emojiRate * 0.8) + (hasEmoji ? 0.2 : 0.0)).toFixed(2));

        await fs.mkdir(styleDir, { recursive: true });
        const filePath = path.join(styleDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        await fs.writeFile(filePath, JSON.stringify(style, null, 2), 'utf8');

        return style;
    }
}
