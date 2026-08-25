// src/social/multiperson/ContactProfileStore.mjs
// Per-Contact Style Learning, Inside Jokes & Relationship Tracking with Explicit Contact Name Recognition

import { PerContactMemoryNamespace } from './PerContactMemoryNamespace.mjs';
import { ContactPolicyEngine } from '../../security/copilot/ContactPolicyEngine.mjs';

export class ContactProfileStore {
    static async getProfile(contactId, pushName = '') {
        const profile = await PerContactMemoryNamespace.loadContactMemory(contactId);
        const policyInfo = await ContactPolicyEngine.getPolicyForContact(contactId);

        // Resolve best name: Policy Name > Saved Profile Name > WhatsApp PushName > Phone Number
        if (policyInfo?.name && !policyInfo.name.startsWith('VIP Contact') && !policyInfo.name.startsWith('Unauthorized')) {
            profile.displayName = policyInfo.name;
        } else if (pushName && !profile.displayName) {
            profile.displayName = pushName;
        } else if (!profile.displayName) {
            profile.displayName = contactId.split('@')[0];
        }

        return profile;
    }

    static async updateFromMessage(contactId, message, pushName = '') {
        const text = (message || '').trim().toLowerCase();
        const profile = await PerContactMemoryNamespace.loadContactMemory(contactId);
        const policyInfo = await ContactPolicyEngine.getPolicyForContact(contactId);

        profile.totalInteractions = (profile.totalInteractions || 0) + 1;

        // Auto-learn Contact Display Name from WhatsApp pushName or Policy
        if (policyInfo?.name && !policyInfo.name.startsWith('VIP Contact')) {
            profile.displayName = policyInfo.name;
        } else if (pushName) {
            profile.displayName = pushName;
        }

        // 1. Detect language preference (Jawa vs Indo)
        const isJawa = Boolean(text.match(/(yo|ki|to|wae|lha|ngopo|piye|mangan|kue|kowe|opo|ora|ra|wis|wes|dadi|tenan)/i));
        if (isJawa) {
            profile.languageStyle = 'CASUAL_JAWA';
        } else if (text.length < 8 && !text.includes('wkwk')) {
            profile.languageStyle = 'CONCISE';
        }

        // 2. Detect Inside Jokes / Recurring phrases
        const jokeMatch = text.match(/(si paling [a-z0-9]+|langganan [a-z0-9]+|raja [a-z0-9]+)/i);
        if (jokeMatch) {
            const joke = jokeMatch[0].trim();
            if (!profile.insideJokes) profile.insideJokes = [];
            if (!profile.insideJokes.includes(joke)) {
                profile.insideJokes.push(joke);
                if (profile.insideJokes.length > 5) profile.insideJokes.shift();
            }
        }

        // 3. Detect Preferred Energy
        if (text.match(/wkwk|haha|ngakak|gila/i)) {
            profile.energyPreference = 0.85;
        } else if (text.match(/capek|lelah|pusing/i)) {
            profile.energyPreference = 0.3;
        }

        await PerContactMemoryNamespace.saveContactMemory(contactId, profile);
        return profile;
    }

    static formatDirectives(profile) {
        if (!profile) return '';

        const nameLine = profile.displayName ? `- Lawan Bicara: ${profile.displayName}` : '';

        const styleGuide = profile.languageStyle === 'CASUAL_JAWA'
            ? '- Gaya Kontak: Sangat akrab dengan bahasa santai campuran Jawa luwes (contoh: "yo", "wae", "to", "piye", "ki", "tenan").'
            : (profile.languageStyle === 'CONCISE'
                ? '- Gaya Kontak: Suka jawaban singkat, to-the-point, tanpa basa-basi panjang.'
                : '- Gaya Kontak: Santai, gaul Indonesia akrab.');

        const jokes = profile.insideJokes?.length > 0
            ? `- Inside Joke / Guyonan Akrab Kontak Ini: "${profile.insideJokes.join('", "')}"`
            : '';

        return `=== PROFIL KONTAK LAWAN BICARA ===\n${nameLine}\n${styleGuide}\n${jokes}\n- Total Interaksi: ${profile.totalInteractions}x\n==================================`;
    }
}
