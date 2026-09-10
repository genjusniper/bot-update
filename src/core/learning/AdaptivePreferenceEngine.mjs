// src/core/learning/AdaptivePreferenceEngine.mjs
// Phase 40: Continuous Evolution & Adaptive User Preferences
// Dynamic user preference convergence, feedback learning loop, and behavioral adaptation.

export const Cadence = Object.freeze({
    ULTRA_CONCISE: 'ULTRA_CONCISE',
    BALANCED: 'BALANCED',
    DETAILED: 'DETAILED'
});

export const DialectStyle = Object.freeze({
    CASUAL_JAKSEL: 'CASUAL_JAKSEL',
    SEMARANGAN_JAWA: 'SEMARANGAN_JAWA',
    FORMAL_INDONESIAN: 'FORMAL_INDONESIAN',
    ENGLISH_TECH: 'ENGLISH_TECH'
});

export class UserPreferenceProfile {
    /**
     * @param {string} userId
     */
    constructor(userId) {
        this.userId = userId;
        this.cadence = Cadence.BALANCED;
        this.dialect = DialectStyle.CASUAL_JAKSEL;
        this.technicalDepth = 0.5; // 0.0 (low/layman) to 1.0 (high/engineer)
        this.emojiLevel = 'MINIMAL'; // 'ZERO' | 'MINIMAL' | 'EXPRESSIVE'
        this.topics = new Map(); // topicName -> interestWeight (0.0 - 1.0)
        this.positiveFeedbackCount = 0;
        this.correctionCount = 0;
        this.totalTurns = 0;
        this.lastActive = Date.now();
    }

    toJSON() {
        return {
            userId: this.userId,
            cadence: this.cadence,
            dialect: this.dialect,
            technicalDepth: Number(this.technicalDepth.toFixed(2)),
            emojiLevel: this.emojiLevel,
            topics: Object.fromEntries(this.topics),
            positiveFeedbackCount: this.positiveFeedbackCount,
            correctionCount: this.correctionCount,
            totalTurns: this.totalTurns,
            lastActive: this.lastActive
        };
    }
}

export class AdaptivePreferenceEngine {
    static #profiles = new Map(); // userId -> UserPreferenceProfile
    static #maxProfiles = 100;

    /**
     * Retrieves or creates user preference profile
     * @param {string} userId
     * @returns {UserPreferenceProfile}
     */
    static getProfile(userId) {
        if (!userId) userId = 'GLOBAL_DEFAULT';

        let profile = this.#profiles.get(userId);
        if (!profile) {
            profile = new UserPreferenceProfile(userId);
            this.#cacheProfile(userId, profile);
        }
        return profile;
    }

    /**
     * Records an interaction turn and updates preference convergence
     * @param {Object} params
     * @param {string} params.userId
     * @param {string} params.userText
     * @param {string} [params.botText='']
     * @param {string} [params.reactionText='']
     * @returns {UserPreferenceProfile}
     */
    static recordTurn({ userId, userText = '', botText = '', reactionText = '' }) {
        const profile = this.getProfile(userId);
        profile.totalTurns++;
        profile.lastActive = Date.now();

        const lowerUser = (userText + ' ' + reactionText).toLowerCase();

        // 1. Dialect Convergence
        if (/\b(piye|iso|ra\s+popo|ora|nggih|kui|iki|tenan|lur|mas|nggawe)\b/i.test(lowerUser)) {
            profile.dialect = DialectStyle.SEMARANGAN_JAWA;
        } else if (/\b(gue|lu|santai|bgt|anjir|worth\s+it|literally|jujur)\b/i.test(lowerUser)) {
            profile.dialect = DialectStyle.CASUAL_JAKSEL;
        } else if (/\b(saya|anda|mohon|terima\s+kasih|dengan\s+hormat)\b/i.test(lowerUser)) {
            profile.dialect = DialectStyle.FORMAL_INDONESIAN;
        }

        // 2. Cadence & Length Convergence
        if (/\b(terlalu\s+panjang|panjang\s+amat|singkat\s+aja|to\s+the\s+point|pendek\s+aja)\b/i.test(lowerUser)) {
            profile.cadence = Cadence.ULTRA_CONCISE;
            profile.correctionCount++;
        } else if (/\b(jelasin\s+lengkap|detail|langkah-langkah|tutorial\s+rinci)\b/i.test(lowerUser)) {
            profile.cadence = Cadence.DETAILED;
        } else if (lowerUser.length <= 4 && /^(ok|k|sip|ya|y)$/i.test(lowerUser.trim())) {
            // Implicit preference for brevity
            if (profile.totalTurns > 3 && profile.cadence === Cadence.BALANCED) {
                profile.cadence = Cadence.ULTRA_CONCISE;
            }
        }

        // 3. Technical Depth
        if (/\b(can-bus|mosfet|inverter|ecu|firmware|baud\s*rate|telemetry|koding|sql|api)\b/i.test(lowerUser)) {
            profile.technicalDepth = Math.min(1.0, profile.technicalDepth + 0.1);
        } else if (/\b(bahasa\s+awam|jangan\s+teknis|gue\s+nggak\s+paham\s+koding)\b/i.test(lowerUser)) {
            profile.technicalDepth = Math.max(0.0, profile.technicalDepth - 0.2);
            profile.correctionCount++;
        }

        // 4. Positive Reinforcement
        if (/\b(sip|mantap|keren|pas\s+banget|top|bener)\b/i.test(lowerUser)) {
            profile.positiveFeedbackCount++;
        }

        // 5. Topic Weight Tracking
        const topicKeywords = {
            automotive: /\b(motor|mobil|ev|baterai|inverter|ecu|can-bus|tuner)\b/i,
            coding: /\b(koding|javascript|python|api|bot|pm2|termux|database)\b/i,
            commerce: /\b(harga|beli|jual|stok|ongkir|rekening|katalog)\b/i,
            outdoor: /\b(gunung|hiking|pendakian|sindoro|merbabu|tenda)\b/i
        };

        for (const [topic, regex] of Object.entries(topicKeywords)) {
            if (regex.test(lowerUser)) {
                const currentWeight = profile.topics.get(topic) || 0;
                profile.topics.set(topic, Math.min(1.0, currentWeight + 0.15));
            }
        }

        return profile;
    }

    /**
     * Formats concise preference directives for prompt injection
     * @param {UserPreferenceProfile} profile
     * @returns {string}
     */
    static formatDirectives(profile) {
        if (!profile) return '';

        let dir = '[USER ADAPTIVE PREFERENCE]\n';
        dir += '- Cadence: ' + profile.cadence + ' (Maks kata: ' + (profile.cadence === Cadence.ULTRA_CONCISE ? '25-35' : '60-80') + ')\n';
        dir += '- Dialect: ' + profile.dialect + '\n';
        dir += '- Tech Depth: ' + (profile.technicalDepth >= 0.7 ? 'HIGH (Gunakan terminologi teknis presisi)' : 'BALANCED') + '\n';
        dir += '- Emoji: ' + profile.emojiLevel;

        const topTopics = Array.from(profile.topics.entries())
            .filter(([_, w]) => w >= 0.3)
            .sort((a, b) => b[1] - a[1])
            .map(([t]) => t);

        if (topTopics.length > 0) {
            dir += '\n- Minat Utama: ' + topTopics.join(', ');
        }

        return dir;
    }

    static #cacheProfile(userId, profile) {
        if (this.#profiles.size >= this.#maxProfiles) {
            const oldestKey = this.#profiles.keys().next().value;
            this.#profiles.delete(oldestKey);
        }
        this.#profiles.set(userId, profile);
    }

    static clear() {
        this.#profiles.clear();
    }
}