// src/communication/SharedExperienceMemory.mjs
import fs from 'fs/promises';
import path from 'path';

const storageDir = path.resolve(process.cwd(), 'memory/shared_experiences');

export class SharedExperienceMemory {
    static async getExperiences(chatId) {
        await fs.mkdir(storageDir, { recursive: true });
        const filePath = path.join(storageDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}_shared.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return [
                {
                    event: 'Troubleshooting bot WhatsApp & perbaikan kuota API',
                    tag: 'tech_troubleshooting',
                    sentiment: 'humorous_relief',
                    timestamp: Date.now()
                }
            ];
        }
    }

    static async addExperience(chatId, experienceObj) {
        const list = await this.getExperiences(chatId);
        list.push({
            ...experienceObj,
            timestamp: Date.now()
        });
        const updated = list.slice(-25); // Keep last 25 shared memories
        const filePath = path.join(storageDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}_shared.json`);
        await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf8');
    }

    static getFormattedExperiences(experiences) {
        if (!experiences || experiences.length === 0) return '';
        return experiences.map(e => `- ${e.event}`).join('\n');
    }
}
