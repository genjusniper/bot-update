// src/core/social/BanterEngine.mjs
// Affectionate teasing and buddy banter evaluator

import { SocialTieModel } from './SocialTieModel.mjs';

export class BanterEngine {
    /**
     * Evaluates whether banter/teasing is socially appropriate
     * @param {Object} context
     * @param {string} [context.relationshipTier='STRANGER']
     * @param {string} [context.emotionValence='NEUTRAL']
     * @param {string} [context.intent='CONVERSATION']
     * @param {boolean} [context.isGroup=false]
     * @returns {Object} Banter decision
     */
    static evaluate({ relationshipTier = 'STRANGER', emotionValence = 'NEUTRAL', intent = 'CONVERSATION', isGroup = false }) {
        const profile = SocialTieModel.getProfile(relationshipTier);

        // Banter rule 1: Negative emotions (venting, sad, angry) STRICTLY forbid banter
        if (emotionValence === 'NEGATIVE' || intent === 'CURHAT') {
            return {
                banterAllowed: false,
                reason: 'NEGATIVE_EMOTION_SUPPRESSES_BANTER',
                style: 'NONE'
            };
        }

        // Banter rule 2: Strangers, customers, and VIP clients STRICTLY forbid banter
        if (profile.banterTolerance < 0.50) {
            return {
                banterAllowed: false,
                reason: 'RELATIONSHIP_TIER_REQUIRES_RESPECT',
                style: 'NONE'
            };
        }

        // Banter rule 3: Group banter is toned down to avoid public embarrassment
        if (isGroup) {
            return {
                banterAllowed: true,
                reason: 'GROUP_PUBLIC_LIGHT_BANTER',
                style: 'LIGHT_DEADPAN',
                directive: 'Candaan santai ringan, jangan menyudutkan di depan umum.'
            };
        }

        // Banter rule 4: 1-on-1 with close friends or owner
        return {
            banterAllowed: true,
            reason: 'CLOSE_BOND_INTIMATE_BANTER',
            style: 'AFFECTIONATE_TEASING',
            directive: 'Boleh ceng-cengan santai khas sahabat akrab, tetap jaga batas sopan.'
        };
    }
}
