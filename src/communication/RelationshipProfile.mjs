// src/communication/RelationshipProfile.mjs
import fs from 'fs/promises';
import path from 'path';

const storageDir = path.resolve(process.cwd(), 'memory/relationships');

export class RelationshipProfile {
    static async getProfile(chatId) {
        await fs.mkdir(storageDir, { recursive: true });
        const filePath = path.join(storageDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
        
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch {
            // Default Profile for new contacts
            return {
                chatId,
                familiarity: 'neutral', // 'stranger' | 'neutral' | 'close_friend' | 'work'
                interaction_count: 0,
                preferred_language: 'id', // 'id' | 'jv' | 'en' | 'mix'
                humor_level: 'medium',   // 'low' | 'medium' | 'high'
                response_length: 'concise', // 'short' | 'concise' | 'detailed'
                formality: 'casual',     // 'formal' | 'semi-formal' | 'casual' | 'slang'
                boundaries: [],
                last_interaction: Date.now()
            };
        }
    }

    static async updateProfile(chatId, delta = {}) {
        const profile = await this.getProfile(chatId);
        const updated = {
            ...profile,
            ...delta,
            interaction_count: (profile.interaction_count || 0) + 1,
            last_interaction: Date.now()
        };

        // Auto-evolve familiarity based on message volume
        if (updated.interaction_count > 30 && updated.familiarity === 'neutral') {
            updated.familiarity = 'close_friend';
            updated.formality = 'casual';
            updated.humor_level = 'high';
        }

        const filePath = path.join(storageDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
        await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf8');
        return updated;
    }
}
