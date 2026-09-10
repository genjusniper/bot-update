// src/core/learning/AdaptivePreferenceTuner.mjs
// Dynamically adjusts behavioral state based on active learned lessons and adaptive user profiles

import { OutcomeLearningLoop } from './OutcomeLearningLoop.mjs';
import { AdaptivePreferenceEngine, Cadence, DialectStyle } from './AdaptivePreferenceEngine.mjs';

export class AdaptivePreferenceTuner {
    /**
     * Applies active lessons and user profile onto a behavioral state
     * @param {Object} state - Target state from PersonalityStabilityController
     * @param {string} [userId=''] - Target user identifier
     * @returns {Object} Tuned state
     */
    static tune(state = {}, userId = '') {
        const tuned = { ...state };

        // 1. Apply user preference profile if available
        if (userId) {
            const profile = AdaptivePreferenceEngine.getProfile(userId);
            if (profile.cadence === Cadence.ULTRA_CONCISE) {
                tuned.targetLength = 'ULTRA_SHORT';
            }
            if (profile.dialect === DialectStyle.SEMARANGAN_JAWA) {
                tuned.targetTone = 'SEMARANGAN_CASUAL';
            }
            tuned.userPreferences = profile.toJSON();
        }

        // 2. Apply active runtime lessons from OutcomeLearningLoop
        const lessons = OutcomeLearningLoop.getLessons();
        for (const lsn of lessons) {
            if (lsn.category === 'VERBOSITY') {
                if (lsn.directive === 'CLAMP_TO_ULTRA_SHORT') {
                    tuned.targetLength = 'ULTRA_SHORT';
                }
            } else if (lsn.category === 'TONE') {
                if (lsn.directive === 'INCREASE_CASUAL_DIALECT') {
                    tuned.targetTone = 'CASUAL_DIRECT';
                    tuned.directness = Math.min(1.0, (tuned.directness || 0.8) + 0.1);
                }
            }
        }

        return tuned;
    }
}
