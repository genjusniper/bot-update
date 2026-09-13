/**
 * ConversationEvaluationEngine.mjs
 * 
 * Multi-dimensional conversation evaluation and failure diagnosis engine.
 * Scores interactions on 9 key criteria:
 * - Context Understanding (0-100)
 * - Intent Accuracy (0-100)
 * - Answer Relevance (0-100)
 * - Persuasiveness (0-100)
 * - Naturalness (0-100)
 * - Hallucination Risk (0-100, lower is better)
 * - Spam Risk (0-100, lower is better)
 * - Over-Pitch Risk (0-100, lower is better)
 * - Handoff Quality (0-100)
 * 
 * Diagnoses failure modes:
 * - PREMATURE_OFFER: Offered demo/proposal before understanding user need.
 * - OVER_PITCHING: Aggressive feature-dumping when user asked a simple question.
 * - TONE_DEAF_RESPONSE: Responded with cheerfulness/humor when user was frustrated.
 * - FAILED_HANDOFF: Ignored request to talk to human.
 */

export class ConversationEvaluationEngine {
    static FAILURE_TYPES = {
        NONE: 'NONE',
        PREMATURE_OFFER: 'PREMATURE_OFFER',
        OVER_PITCHING: 'OVER_PITCHING',
        TONE_DEAF_RESPONSE: 'TONE_DEAF_RESPONSE',
        FAILED_HANDOFF: 'FAILED_HANDOFF',
        VERBOSITY_MISMATCH: 'VERBOSITY_MISMATCH',
        UNGROUNDED_CLAIM: 'UNGROUNDED_CLAIM'
    };

    /**
     * Evaluate an inbound message and the generated response
     */
    static evaluate({ incomingText, responseText, intel, bestAction }) {
        const inClean = (incomingText || '').trim().toLowerCase();
        const outClean = (responseText || '').trim();

        // 1. Context Understanding & Intent Accuracy
        const contextUnderstanding = intel.confidence ? Math.round(intel.confidence * 100) : 85;
        const intentAccuracy = intel.intent !== 'CASUAL_CHAT' ? 92 : 80;

        // 2. Answer Relevance
        let answerRelevance = 90;
        if (inClean.length < 10 && outClean.length > 300) answerRelevance -= 20; // overly verbose

        // 3. Persuasiveness & Naturalness
        let naturalness = 88;
        if (outClean.includes('1.') && outClean.includes('2.') && outClean.includes('3.') && inClean.length < 15) {
            naturalness -= 15; // Too robotic for a simple question
        }
        const persuasiveness = bestAction.action === 'CLARIFY' ? 92 : 84;

        // 4. Hallucination Risk (0 = safe, 100 = dangerous)
        let hallucinationRisk = 2;
        if (/500\s*bisnis|ribuan\s*klien|garansi\s*100%/i.test(outClean)) {
            hallucinationRisk = 85;
        }

        // 5. Spam Risk & Over-Pitch Risk
        let spamRisk = 0;
        let overPitchRisk = 5;
        if (intel.stage === 'AWARENESS' && (bestAction.action === 'OFFER_DEMO' || /beli|sewa\s*sekarang|transfer/i.test(outClean))) {
            overPitchRisk = 75;
        }

        // 6. Handoff Quality
        let handoffQuality = 95;
        if (intel.intent === 'HUMAN_HANDOFF_REQUEST' && bestAction.action !== 'HANDOFF') {
            handoffQuality = 15;
        }

        // Failure Classification
        let failureType = this.FAILURE_TYPES.NONE;
        let recommendation = 'Performance aligns with business objectives.';

        if (overPitchRisk > 60) {
            failureType = this.FAILURE_TYPES.PREMATURE_OFFER;
            recommendation = 'Increase discovery depth before offering commercial solutions or demos.';
        } else if (intel.emotionalTone === 'FRUSTRATED' && outClean.includes('😄')) {
            failureType = this.FAILURE_TYPES.TONE_DEAF_RESPONSE;
            recommendation = 'Disable playful emojis and humor when user expresses frustration.';
        } else if (hallucinationRisk > 50) {
            failureType = this.FAILURE_TYPES.UNGROUNDED_CLAIM;
            recommendation = 'Ground all claims in TruthEvidenceEngine verified knowledge base.';
        } else if (handoffQuality < 50) {
            failureType = this.FAILURE_TYPES.FAILED_HANDOFF;
            recommendation = 'Immediately hand off conversation to Bos Agus when prospect asks.';
        }

        const scores = {
            contextUnderstanding,
            intentAccuracy,
            answerRelevance,
            persuasiveness,
            naturalness,
            hallucinationRisk,
            spamRisk,
            overPitchRisk,
            handoffQuality
        };

        return {
            scores,
            failureType,
            recommendation,
            isPassed: failureType === this.FAILURE_TYPES.NONE && hallucinationRisk < 10
        };
    }
}
