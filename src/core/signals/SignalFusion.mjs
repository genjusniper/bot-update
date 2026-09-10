// src/core/signals/SignalFusion.mjs
// Normalizes multiple observer signals and executes deterministic conflict resolution rules

import { DIMENSIONS } from './BehaviorSignal.mjs';

export class SignalFusion {
    /**
     * Ingests an array of BehaviorSignal objects and synthesizes a consolidated FusedSensorySnapshot
     * @param {BehaviorSignal[]} signals
     * @param {Object} context - { chatId, senderId, messageText, pushName }
     * @returns {Object} FusedSensorySnapshot
     */
    static fuse(signals = [], context = {}) {
        if (!Array.isArray(signals)) signals = [];

        // 1. Group signals by dimension
        const grouped = {};
        for (const s of signals) {
            if (!grouped[s.dimension]) grouped[s.dimension] = [];
            grouped[s.dimension].push(s);
        }

        // Helper to pick best signal by weighted confidence
        const pickBest = (dim, fallback) => {
            const list = grouped[dim];
            if (!list || list.length === 0) return fallback;
            list.sort((a, b) => (b.confidence * b.weight) - (a.confidence * a.weight));
            return list[0].value;
        };

        const getAverageScore = (dim, fallback = 0.0) => {
            const list = grouped[dim];
            if (!list || list.length === 0) return fallback;
            let totalWeight = 0;
            let sum = 0;
            for (const s of list) {
                const num = Number(s.value);
                if (!isNaN(num)) {
                    const w = s.confidence * s.weight;
                    sum += num * w;
                    totalWeight += w;
                }
            }
            return totalWeight > 0 ? (sum / totalWeight) : fallback;
        };

        // 2. Initial Dimension Extraction
        let intent = pickBest(DIMENSIONS.INTENT, 'CONVERSATION');
        let emotionalIntensity = getAverageScore(DIMENSIONS.EMOTIONAL_INTENSITY, 0.2);
        let emotionValence = pickBest(DIMENSIONS.EMOTION_VALENCE, 'NEUTRAL');
        let humorPermission = pickBest(DIMENSIONS.HUMOR_PERMISSION, 'DEADPAN_ONLY');
        let conversationState = pickBest(DIMENSIONS.CONVERSATION_STATE, 'CHITCHAT');
        let topicContinuity = pickBest(DIMENSIONS.TOPIC_CONTINUITY, 'SAME');
        let relationshipTier = pickBest(DIMENSIONS.RELATIONSHIP_TIER, 'UNKNOWN');
        let temperature = getAverageScore(DIMENSIONS.TEMPERATURE, 0.3);
        let urgency = getAverageScore(DIMENSIONS.URGENCY, 0.2);
        let confusion = getAverageScore(DIMENSIONS.CONFUSION, 0.0);
        let questionPressure = getAverageScore(DIMENSIONS.QUESTION_PRESSURE, 0.0);

        // 3. Deterministic Conflict Resolution Matrix
        const conflictResolutions = [];

        // Rule 1: High Emotional Intensity + Negative Valence SUPPRESSES Humor
        if (emotionalIntensity >= 0.55 && ['NEGATIVE', 'FRUSTRATED', 'ANXIOUS', 'SAD'].includes(String(emotionValence).toUpperCase())) {
            const prevHumor = humorPermission;
            humorPermission = 'OFF';
            conflictResolutions.push({
                rule: 'EMOTION_SUPPRESSED_HUMOR',
                reason: `User experiencing intense negative emotion (${emotionValence} @ ${emotionalIntensity.toFixed(2)}). Downgraded humor from ${prevHumor} to OFF.`
            });
        }

        // Rule 2: High Urgency enforces Brevity and suppresses light humor
        if (urgency >= 0.65) {
            const prevHumor = humorPermission;
            if (humorPermission === 'PLAYFUL' || humorPermission === 'LIGHT') {
                humorPermission = 'DEADPAN_ONLY';
            }
            conflictResolutions.push({
                rule: 'URGENCY_ENFORCED_BREVITY',
                reason: `High urgency (${urgency.toFixed(2)}) detected. Clamping humor from ${prevHumor} to ${humorPermission} and prioritizing speed.`
            });
        }

        // Rule 3: User Confusion forces High Clarity & suppresses slang ambiguity
        let clarityPriority = false;
        if (confusion >= 0.5 || String(intent).toUpperCase() === 'CONFUSION_CLARIFY') {
            clarityPriority = true;
            if (humorPermission === 'PLAYFUL') humorPermission = 'DEADPAN_ONLY';
            conflictResolutions.push({
                rule: 'CONFUSION_ENFORCED_CLARITY',
                reason: `User expressed confusion (${confusion.toFixed(2)}). Sarcasm/slang suppressed in favor of direct clarity.`
            });
        }

        // Rule 4: Customer / Commercial relationship enforces professionalism
        if (relationshipTier === 'CUSTOMER') {
            if (humorPermission === 'PLAYFUL') humorPermission = 'LIGHT';
            conflictResolutions.push({
                rule: 'CUSTOMER_TIER_CALIBRATION',
                reason: 'Customer interaction detected. Solution and courteous responsiveness prioritized.'
            });
        }

        // Rule 5: Curhat / Venting mode disables unsolicited advice
        let allowUnsolicitedAdvice = true;
        if (conversationState === 'VENTING' || conversationState === 'CURHAT') {
            allowUnsolicitedAdvice = false;
            conflictResolutions.push({
                rule: 'VENTING_DONT_OVERHELP',
                reason: 'User is venting/curhat. Solution-giving suppressed in favor of empathetic listening and gentle probing.'
            });
        }

        return {
            snapshotId: `fused_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
            dimensions: {
                intent,
                emotionalIntensity: Number(emotionalIntensity.toFixed(2)),
                emotionValence,
                humorPermission,
                conversationState,
                topicContinuity,
                relationshipTier,
                temperature: Number(temperature.toFixed(2)),
                urgency: Number(urgency.toFixed(2)),
                confusion: Number(confusion.toFixed(2)),
                questionPressure: Number(questionPressure.toFixed(2)),
                clarityPriority,
                allowUnsolicitedAdvice
            },
            conflictResolutions,
            rawSignalsCount: signals.length,
            context: {
                chatId: context.chatId || '',
                senderId: context.senderId || '',
                pushName: context.pushName || '',
                canonicalMsg: context.canonicalMsg || null,
                isGroup: Boolean(context.isGroup || context.canonicalMsg?.isGroup)
            }
        };
    }
}
