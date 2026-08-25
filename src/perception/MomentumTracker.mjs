// src/perception/MomentumTracker.mjs
import fs from 'fs/promises';
import path from 'path';

const storageDir = path.resolve(process.cwd(), 'memory/momentum');

export class MomentumTracker {
    static async getState(chatId) {
        await fs.mkdir(storageDir, { recursive: true });
        const filePath = path.join(storageDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return {
                energy: 0.70,
                engagement: 0.75,
                topicMomentum: 0.60,
                humorMomentum: 0.50,
                emotionalIntensity: 0.30,
                curiosity: 0.60,
                lastUpdated: Date.now()
            };
        }
    }

    static async updateState(chatId, perception) {
        const state = await this.getState(chatId);
        const now = Date.now();
        const timeDiffMinutes = (now - (state.lastUpdated || now)) / 60000;

        // Natural decay if idle for > 15 minutes
        if (timeDiffMinutes > 15) {
            state.energy = Math.max(0.40, state.energy * 0.7);
            state.topicMomentum = Math.max(0.20, state.topicMomentum * 0.5);
            state.humorMomentum = Math.max(0.30, state.humorMomentum * 0.6);
        }

        // Adjust based on Perception
        if (perception.emotion === 'excited') {
            state.energy = Math.min(1.0, state.energy + 0.15);
            state.engagement = Math.min(1.0, state.engagement + 0.10);
            state.humorMomentum = Math.min(1.0, state.humorMomentum + 0.15);
        } else if (perception.emotion === 'frustrated' || perception.emotion === 'sad') {
            state.emotionalIntensity = Math.min(1.0, state.emotionalIntensity + 0.30);
            state.humorMomentum = Math.max(0.10, state.humorMomentum - 0.25); // Suppress jokes when user is down
        } else if (perception.intent === 'acknowledgement_or_burst') {
            state.energy = Math.max(0.30, state.energy - 0.10);
            state.topicMomentum = Math.max(0.20, state.topicMomentum - 0.15);
        }

        state.lastUpdated = now;
        const filePath = path.join(storageDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
        await fs.writeFile(filePath, JSON.stringify(state, null, 2), 'utf8');
        return state;
    }
}
