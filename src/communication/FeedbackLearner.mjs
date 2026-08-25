// src/communication/FeedbackLearner.mjs
import fs from 'fs/promises';
import path from 'path';

const prefFile = path.resolve(process.cwd(), 'memory/personal_preferences.json');

export class FeedbackLearner {
    static async getPreferences() {
        try {
            const raw = await fs.readFile(prefFile, 'utf8');
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    static async recordFeedback(userMessage) {
        const text = userMessage.toLowerCase();
        const correctionTriggers = [
            'jangan ngomong', 'jangan pake kata', 'jangan bilang', 'gue biasanya', 'aku biasanya', 'maksudnya bukan'
        ];

        const isCorrection = correctionTriggers.some(t => text.includes(t));
        if (!isCorrection) return false;

        const currentPrefs = await this.getPreferences();
        
        // Add new preference rule
        currentPrefs.push({
            rule: userMessage.trim(),
            confidence: 0.9,
            timestamp: Date.now()
        });

        // Keep last 50 preferences
        const updated = currentPrefs.slice(-50);
        await fs.mkdir(path.dirname(prefFile), { recursive: true });
        await fs.writeFile(prefFile, JSON.stringify(updated, null, 2), 'utf8');
        
        console.log(`[FeedbackLearner] 🧠 Learned new personal rule: "${userMessage.trim()}"`);
        return true;
    }
}
