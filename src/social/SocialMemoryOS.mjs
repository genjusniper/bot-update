// src/social/SocialMemoryOS.mjs
// Comprehensive Social Dynamics & Person Profile OS

import fs from 'fs/promises';
import path from 'path';

const socialDir = path.resolve(process.cwd(), 'memory/social_profiles');

export class SocialMemoryOS {
    static async getProfile(chatId) {
        await fs.mkdir(socialDir, { recursive: true });
        const filePath = path.join(socialDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return {
                relationship: 'FRIEND',
                topics: ['coding', 'game', 'makanan'],
                runningJokes: [],
                unresolvedStories: [],
                importantEvents: [],
                preferences: { preferredLanguage: 'Jawa-Indo', brevity: 'short' },
                boundaries: ['hindari politik', 'hindari formalitas kaku']
            };
        }
    }

    static async registerStory(chatId, storyTitle, details) {
        const profile = await this.getProfile(chatId);
        profile.unresolvedStories.push({
            id: `story_${Date.now()}`,
            title: storyTitle,
            details,
            status: 'unresolved',
            createdAt: Date.now()
        });
        if (profile.unresolvedStories.length > 5) profile.unresolvedStories.shift();
        await this.saveProfile(chatId, profile);
    }

    static async saveProfile(chatId, profile) {
        await fs.mkdir(socialDir, { recursive: true });
        const filePath = path.join(socialDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        await fs.writeFile(filePath, JSON.stringify(profile, null, 2), 'utf8');
    }

    static formatSocialContext(profile) {
        const parts = [];
        if (profile.unresolvedStories && profile.unresolvedStories.length > 0) {
            parts.push(`- Cerita Masa Lalu: "${profile.unresolvedStories[0].title}" (${profile.unresolvedStories[0].details}).`);
        }
        if (profile.runningJokes && profile.runningJokes.length > 0) {
            parts.push(`- Lelucon Khas: ${profile.runningJokes.join(', ')}.`);
        }
        return parts.length > 0 ? `=== PROFIL SOSIAL (SOCIAL MEMORY) ===\n${parts.join('\n')}` : '';
    }
}
