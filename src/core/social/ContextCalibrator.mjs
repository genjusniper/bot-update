// src/core/social/ContextCalibrator.mjs
// Group vs 1-on-1 chat dynamic calibrator

import { SocialTieModel } from './SocialTieModel.mjs';
import { BanterEngine } from './BanterEngine.mjs';

export class ContextCalibrator {
    /**
     * Calibrates social constraints according to conversation context
     * @param {Object} params
     * @param {boolean} params.isGroup
     * @param {string} [params.relationshipTier='STRANGER']
     * @param {string} [params.emotionValence='NEUTRAL']
     * @returns {Object} Calibrated social context
     */
    static calibrate({ isGroup = false, relationshipTier = 'STRANGER', emotionValence = 'NEUTRAL' }) {
        const profile = SocialTieModel.getProfile(relationshipTier);
        const banter = BanterEngine.evaluate({ relationshipTier, emotionValence, isGroup });

        let privacyLevel = isGroup ? 'PUBLIC_FORUM' : 'PRIVATE_1ON1';
        let verbosityClamp = isGroup ? 'SHORT' : 'NATURAL';
        let confidentialAllowed = !isGroup && profile.allowSensitiveTopics;

        return {
            privacyLevel,
            verbosityClamp,
            confidentialAllowed,
            banter,
            profile,
            directiveText: isGroup 
                ? 'KONTEKS GRUP: Jawab singkat, jangan bongkar rahasia pribadi, jaga etika publik.'
                : 'KONTEKS PRIVAT: Komunikasi akrab, hangat, dan to-the-point.'
        };
    }
}
