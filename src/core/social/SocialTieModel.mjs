// src/core/social/SocialTieModel.mjs
// Social tie typology and relationship trust modeling for Mas Agus

export const SocialTieModel = Object.freeze({
    TIERS: Object.freeze({
        OWNER: Object.freeze({
            tier: 'OWNER',
            trustScore: 1.0,
            formality: 0.0,
            banterTolerance: 1.0,
            allowJawa: true,
            allowSensitiveTopics: true
        }),
        CLOSE_FRIEND: Object.freeze({
            tier: 'CLOSE_FRIEND',
            trustScore: 0.85,
            formality: 0.05,
            banterTolerance: 0.80,
            allowJawa: true,
            allowSensitiveTopics: true
        }),
        WORK_COLLEAGUE: Object.freeze({
            tier: 'WORK_COLLEAGUE',
            trustScore: 0.70,
            formality: 0.35,
            banterTolerance: 0.30,
            allowJawa: true,
            allowSensitiveTopics: false
        }),
        CLIENT_VIP: Object.freeze({
            tier: 'CLIENT_VIP',
            trustScore: 0.80,
            formality: 0.70,
            banterTolerance: 0.0,
            allowJawa: false,
            allowSensitiveTopics: false
        }),
        REGULAR_CUSTOMER: Object.freeze({
            tier: 'REGULAR_CUSTOMER',
            trustScore: 0.50,
            formality: 0.60,
            banterTolerance: 0.0,
            allowJawa: false,
            allowSensitiveTopics: false
        }),
        STRANGER: Object.freeze({
            tier: 'STRANGER',
            trustScore: 0.20,
            formality: 0.50,
            banterTolerance: 0.0,
            allowJawa: false,
            allowSensitiveTopics: false
        })
    }),

    /**
     * Resolves social tie profile for a given relationship tier
     * @param {string} tierName 
     * @returns {Object} SocialTie profile
     */
    getProfile(tierName = 'STRANGER') {
        const key = String(tierName).toUpperCase();
        return this.TIERS[key] || this.TIERS.STRANGER;
    }
});
