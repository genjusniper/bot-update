// src/communication/HumorCallbackEngine.mjs
import fs from 'fs/promises';
import path from 'path';

const storageDir = path.resolve(process.cwd(), 'memory/humor');

export class HumorCallbackEngine {
    static async getJokes(chatId) {
        await fs.mkdir(storageDir, { recursive: true });
        const filePath = path.join(storageDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}_jokes.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    static async recordJoke(chatId, topic, jokeSnippet) {
        const jokes = await this.getJokes(chatId);
        jokes.push({
            topic,
            snippet: jokeSnippet,
            timestamp: Date.now(),
            useCount: 0
        });
        const updated = jokes.slice(-20); // Keep last 20 running jokes
        const filePath = path.join(storageDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}_jokes.json`);
        await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf8');
    }

    static evaluateOpportunity(message, recentJokes = []) {
        const text = (message || '').toLowerCase();
        
        // 1. Check for Callback Match
        for (const j of recentJokes) {
            if (j.topic && text.includes(j.topic.toLowerCase()) && (Date.now() - j.timestamp > 60000)) {
                return {
                    opportunity: true,
                    style: 'CALLBACK_JOKE',
                    instruction: `Gunakan Callback Humor terkait lelucon/topik lama tentang "${j.topic}" (${j.snippet}). Singgung secara natural dan lucu.`
                };
            }
        }

        // 2. Playful Teasing on Complaints or Mistakes
        if (/^(capek|lelah|pusing|males|gagal|eror|rusak|miskin|bokek)/.test(text)) {
            return {
                opportunity: true,
                style: 'PLAYFUL_TEASING_OR_EMPATHY',
                instruction: 'User sedang mengeluh/bercanda tentang kondisi apesnya. Berikan tanggapan lucu, playful teasing yang relatable atau lelucon situasional sebelum menyemangati.'
            };
        }

        // 3. Situational Exaggeration on excited expressions
        if (/^(anjir|gila|buse[tt]|parah|gokil|wkwk{3,})/.test(text)) {
            return {
                opportunity: true,
                style: 'SITUATIONAL_EXAGGERATION',
                instruction: 'Ikuti hype/reaksi heboh user dengan sedikit hiperbola santai atau analogi kocak.'
            };
        }

        return { opportunity: false, style: 'NONE', instruction: '' };
    }
}
