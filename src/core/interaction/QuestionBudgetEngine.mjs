// src/core/interaction/QuestionBudgetEngine.mjs
// Regulates question frequency to eliminate artificial AI interrogation fatigue

export class QuestionBudgetEngine {
    /**
     * Calculates allowed question budget for the response
     * @param {Object} params
     * @param {string} params.interactionMode - From InteractionModeEngine
     * @param {Object} params.sharing - From SharingDetectionEngine
     * @param {Object} params.clarification - From ClarificationPolicy
     * @returns {Object} { allowedQuestions: number, reason: string, directive: string }
     */
    static calculate({ interactionMode = 'Casual', sharing = {}, clarification = {} }) {
        // 1. Critical ambiguity where clarification is mandatory
        if (clarification.mustClarify) {
            return {
                allowedQuestions: 1,
                reason: 'AMBIGUITY_CLARIFICATION',
                directive: 'KUOTA PERTANYAAN: MAKSIMAL 1 PERTANYAAN untuk mengklarifikasi maksud user.'
            };
        }

        // 2. User is just sharing a story -> 1 natural probe question allowed
        if (sharing.isSharing || interactionMode === 'Storytelling') {
            return {
                allowedQuestions: 1,
                reason: 'STORY_ENGAGEMENT',
                directive: 'KUOTA PERTANYAAN: MAKSIMAL 1 PERTANYAAN singkat untuk menunjukkan ketertarikan (misal: "terus?").'
            };
        }

        // 3. Venting / Curhat -> 0 questions or 1 gentle open question
        if (interactionMode === 'Venting') {
            return {
                allowedQuestions: 1,
                reason: 'EMPATHETIC_LISTENING',
                directive: 'KUOTA PERTANYAAN: MAKSIMAL 1 PERTANYAAN lembut atau cukup validasi emosi tanpa tanya.'
            };
        }

        // 4. Closing or Minimal -> STRICTLY 0 questions
        if (interactionMode === 'Closing' || interactionMode === 'Silent/Minimal') {
            return {
                allowedQuestions: 0,
                reason: 'CONVERSATION_EXIT',
                directive: 'KUOTA PERTANYAAN: 0 PERTANYAAN! Jangan pancing obrolan baru.'
            };
        }

        // 5. Problem Solving / High Urgency -> STRICTLY 0 questions (give the answer)
        if (interactionMode === 'Problem Solving') {
            return {
                allowedQuestions: 0,
                reason: 'DIRECT_SOLUTION',
                directive: 'KUOTA PERTANYAAN: 0 PERTANYAAN. Langsung jawab solusi tanpa balik bertanya.'
            };
        }

        // 6. Default Casual / Banter -> 0 or 1 question max
        return {
            allowedQuestions: 0,
            reason: 'NATURAL_STATUTE',
            directive: 'KUOTA PERTANYAAN: 0 PERTANYAAN. Tanggapi dengan santai tanpa memaksa interogasi.'
        };
    }
}
