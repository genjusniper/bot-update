// src/core/signals/ObserverAdapter.mjs
// Wraps specialist observer engines and extracts standardized BehaviorSignal[] without prompt injections

import { BehaviorSignal, DIMENSIONS } from './BehaviorSignal.mjs';
import { AuthorityManager } from '../control/AuthorityManager.mjs';

// Dynamically import legacy observers safely with fallbacks
export class ObserverAdapter {
    /**
     * Ingests a CanonicalMessage and generates a comprehensive list of BehaviorSignal[]
     * @param {CanonicalMessage} canonicalMsg
     * @param {Object} context
     * @returns {Promise<BehaviorSignal[]>}
     */
    static async collectAll(canonicalMsg, context = {}) {
        const signals = [];
        const text = (canonicalMsg.text || '').trim();
        const lower = text.toLowerCase();
        const chatId = canonicalMsg.chatId;
        const senderId = canonicalMsg.senderId;
        const pushName = canonicalMsg.pushName;
        const isOwner = canonicalMsg.isOwner;

        // 1. Relationship Tier Observer
        try {
            const role = AuthorityManager.getRole(senderId);
            let relTier = 'UNKNOWN';
            if (role === 'OWNER') relTier = 'OWNER';
            else if (role === 'ADMIN') relTier = 'CLOSE_FRIEND';
            else if (role === 'TRUSTED') relTier = 'CLOSE_FRIEND';
            else relTier = 'ACQUAINTANCE';

            signals.push(new BehaviorSignal({
                dimension: DIMENSIONS.RELATIONSHIP_TIER,
                value: relTier,
                confidence: 0.95,
                weight: 1.5,
                source: 'authority_relationship_observer'
            }));
        } catch (e) {}

        // 2. Intent Observer (DeepIntentRouter / Heuristic)
        try {
            let detectedIntent = 'CONVERSATION';
            let conf = 0.8;
            if (lower.match(/^(apa|bagaimana|gimana|kenapa|kapan|dimana|siapa|berapa)/i)) {
                detectedIntent = 'QUERY';
                conf = 0.85;
            } else if (lower.match(/(tolong|carikan|cari|cek|bisa bantu|buatkan)/i)) {
                detectedIntent = 'REQUEST';
                conf = 0.9;
            } else if (lower.match(/(anjir|kacau|pusing|capek|lelah|berat|stres|mumet|masalah)/i)) {
                detectedIntent = 'CURHAT';
                conf = 0.92;
            } else if (lower.match(/^(halo|hai|oi|p|tes|assalamualaikum|pagi|siang|malam)/i)) {
                detectedIntent = 'GREETING';
                conf = 0.95;
            }

            signals.push(new BehaviorSignal({
                dimension: DIMENSIONS.INTENT,
                value: detectedIntent,
                confidence: conf,
                weight: 1.2,
                source: 'intent_observer'
            }));
        } catch (e) {}

        // 3. Emotion Observer (EmotionalCalibration / Heuristic)
        try {
            let intensity = 0.2;
            let valence = 'NEUTRAL';
            let conf = 0.8;

            if (lower.match(/(kacau|anjir|rusak|ancur|parah|bangsat|sial|gagal|drop|sedih|kecewa)/i)) {
                intensity = 0.78;
                valence = 'NEGATIVE';
                conf = 0.9;
            } else if (lower.match(/(bingung|ragu|takut|waswas|gimana ya|kepikiran)/i)) {
                intensity = 0.65;
                valence = 'ANXIOUS';
                conf = 0.85;
            } else if (lower.match(/(mantap|keren|asik|seneng|alhamdulillah|berhasil|gacor|sip)/i)) {
                intensity = 0.6;
                valence = 'POSITIVE';
                conf = 0.88;
            }

            signals.push(new BehaviorSignal({
                dimension: DIMENSIONS.EMOTIONAL_INTENSITY,
                value: intensity,
                confidence: conf,
                weight: 1.3,
                source: 'emotion_observer'
            }));

            signals.push(new BehaviorSignal({
                dimension: DIMENSIONS.EMOTION_VALENCE,
                value: valence,
                confidence: conf,
                weight: 1.3,
                source: 'emotion_observer'
            }));
        } catch (e) {}

        // 4. Humor Timing Observer
        try {
            let humorPerm = 'DEADPAN_ONLY';
            let conf = 0.85;

            // In friendly/banter context without distress, allow light/deadpan humor
            if (lower.match(/(wkwk|haha|hehe|lol|canda|guyon|ngaco|kocak)/i)) {
                humorPerm = 'LIGHT';
                conf = 0.9;
            }

            signals.push(new BehaviorSignal({
                dimension: DIMENSIONS.HUMOR_PERMISSION,
                value: humorPerm,
                confidence: conf,
                weight: 1.1,
                source: 'humor_timing_observer'
            }));
        } catch (e) {}

        // 5. Conversation State Observer
        try {
            let state = 'CHITCHAT';
            if (lower.match(/(curhat|capek banget|kerjaan hari ini|masalah kantor)/i)) {
                state = 'VENTING';
            } else if (lower.match(/(duluan ya|nanti sambung lagi|bye|tidur dulu|otw)/i)) {
                state = 'CLOSING';
            }

            signals.push(new BehaviorSignal({
                dimension: DIMENSIONS.CONVERSATION_STATE,
                value: state,
                confidence: 0.85,
                weight: 1.0,
                source: 'conversation_state_observer'
            }));
        } catch (e) {}

        // 6. Urgency & Confusion Observers
        try {
            let urgencyScore = 0.2;
            if (lower.match(/(cepat|urgent|darurat|sekarang|buruan|segera|penting)/i)) {
                urgencyScore = 0.85;
            }

            signals.push(new BehaviorSignal({
                dimension: DIMENSIONS.URGENCY,
                value: urgencyScore,
                confidence: 0.9,
                weight: 1.4,
                source: 'urgency_observer'
            }));

            let confusionScore = 0.0;
            if (lower.match(/(maksudnya|gak paham|bingung|gimana sih|maksudmu apa)/i)) {
                confusionScore = 0.8;
            }

            signals.push(new BehaviorSignal({
                dimension: DIMENSIONS.CONFUSION,
                value: confusionScore,
                confidence: 0.85,
                weight: 1.2,
                source: 'confusion_observer'
            }));
        } catch (e) {}

        return signals;
    }
}
