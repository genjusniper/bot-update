// src/core/kernel/PersonalityStabilityController.mjs
// Dynamic state modulator strictly preserving the immutable Core while adapting transient CurrentState

import { PersonalityCore } from './PersonalityCore.mjs';

export class PersonalityStabilityController {
    /**
     * Computes the dynamic CurrentState modulated by FusedSensorySnapshot without mutating PersonalityCore
     * @param {Object} fusedSnapshot - Output from SignalFusion
     * @returns {Object} Modulated CurrentState
     */
    static modulate(fusedSnapshot = {}) {
        const dims = fusedSnapshot.dimensions || {};
        const modulations = [];

        // 1. Baseline copied from Immutable Core
        const state = {
            directness: PersonalityCore.COMMUNICATION.directness,
            casualness: PersonalityCore.COMMUNICATION.casualness,
            slangAffinity: PersonalityCore.COMMUNICATION.slangAffinity,
            verbosityScore: PersonalityCore.COMMUNICATION.verbosityScore,
            jawaAffinity: PersonalityCore.COMMUNICATION.jawaAffinity,
            
            warmth: PersonalityCore.SOCIAL.warmth,
            teasingAffinity: PersonalityCore.SOCIAL.teasingAffinity,
            formality: PersonalityCore.SOCIAL.formality,

            humorStyle: PersonalityCore.HUMOR.primaryStyle,
            humorAllowed: dims.humorPermission !== 'OFF',
            allowSolution: dims.allowUnsolicitedAdvice !== false,

            targetTone: 'CASUAL_COOL',
            targetLength: 'ULTRA_SHORT',
            languageMode: 'CASUAL_INDO'
        };

        // 2. Dynamic Modulation: Curhat / Venting
        if (dims.conversationState === 'VENTING' || dims.intent === 'CURHAT') {
            state.warmth = 0.90;
            state.directness = 0.55;
            state.humorAllowed = false;
            state.humorStyle = 'NONE';
            state.allowSolution = false;
            state.targetTone = 'WARM_SUPPORTIVE';
            state.targetLength = 'CONCISE'; // Give slightly more breathing room for empathetic validation
            modulations.push('CURHAT_VENTING_MODULATION');
        }

        // 3. Dynamic Modulation: High Urgency
        if (dims.urgency >= 0.65) {
            state.directness = 0.95;
            state.verbosityScore = 0.20;
            state.teasingAffinity = 0.10;
            state.humorAllowed = false;
            state.targetTone = 'COURTEOUS_DIRECT';
            state.targetLength = 'ULTRA_SHORT'; // 3-8 words maximum
            modulations.push('URGENCY_MODULATION');
        }

        // 4. Dynamic Modulation: Customer / Client Relationship
        if (dims.relationshipTier === 'CUSTOMER' || dims.relationshipTier === 'CLIENT_VIP' || dims.relationshipTier === 'REGULAR_CUSTOMER') {
            state.formality = 0.60;
            state.slangAffinity = 0.15;
            state.teasingAffinity = 0.0;
            state.jawaAffinity = 0.0;
            state.targetTone = 'PROFESSIONAL_COURTEOUS';
            state.languageMode = 'FORMAL_INDO';
            state.targetLength = 'CONCISE';
            modulations.push('CUSTOMER_TIER_MODULATION');
        } else if (dims.relationshipTier === 'CLOSE_FRIEND' || dims.relationshipTier === 'OWNER') {
            state.casualness = 0.95;
            state.formality = 0.05;
            state.teasingAffinity = 0.75;
            state.languageMode = 'SEMARANGAN_JAWA';
            modulations.push('CLOSE_FRIEND_MODULATION');
        }

        // 5. Dynamic Modulation: User Confusion
        if (dims.clarityPriority || dims.confusion >= 0.5) {
            state.directness = 0.90;
            state.teasingAffinity = 0.10;
            state.humorAllowed = false;
            modulations.push('CLARITY_PRIORITY_MODULATION');
        }

        return {
            state,
            modulationsApplied: modulations,
            coreSnapshot: PersonalityCore.IDENTITY
        };
    }
}
