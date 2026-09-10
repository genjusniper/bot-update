// src/core/interaction/ConversationRhythmEngine.mjs
// Analyzes conversational pacing and temporal cadence across turns

export class ConversationRhythmEngine {
    static RHYTHM_TYPES = Object.freeze({
        RAPID_EXCHANGE: 'RAPID_EXCHANGE',
        SLOW_CONVERSATION: 'SLOW_CONVERSATION',
        DEEP_DISCUSSION: 'DEEP_DISCUSSION',
        BANTER: 'BANTER',
        QUESTION_ANSWER: 'QUESTION_ANSWER',
        VENTING: 'VENTING',
        STORYTELLING: 'STORYTELLING'
    });

    /**
     * Determines the active conversation rhythm pattern
     * @param {Object} params
     * @param {string} params.interactionMode
     * @param {number} [params.turnIntervalSeconds=30]
     * @param {number} [params.userWordCount=10]
     * @returns {Object} { rhythmType: string, tempo: 'FAST' | 'MEDIUM' | 'SLOW' }
     */
    static analyze({ interactionMode = 'Casual', turnIntervalSeconds = 30, userWordCount = 10 }) {
        if (interactionMode === 'Banter' || (turnIntervalSeconds < 15 && userWordCount < 8)) {
            return {
                rhythmType: this.RHYTHM_TYPES.RAPID_EXCHANGE,
                tempo: 'FAST',
                directive: 'TEMPO CEPAT: Jawab tangkas, hindari kalimat berbelit.'
            };
        }

        if (interactionMode === 'Deep Talk' || userWordCount > 35) {
            return {
                rhythmType: this.RHYTHM_TYPES.DEEP_DISCUSSION,
                tempo: 'SLOW',
                directive: 'TEMPO DALAM: Jawab matang dan terarah.'
            };
        }

        if (interactionMode === 'Venting') {
            return {
                rhythmType: this.RHYTHM_TYPES.VENTING,
                tempo: 'SLOW',
                directive: 'TEMPO EMPATI: Beri ruang bagi user untuk berekspresi.'
            };
        }

        if (interactionMode === 'Asking' || interactionMode === 'Problem Solving') {
            return {
                rhythmType: this.RHYTHM_TYPES.QUESTION_ANSWER,
                tempo: 'MEDIUM',
                directive: 'TEMPO TEKNIS: Jawab langsung pada inti pertanyaan.'
            };
        }

        return {
            rhythmType: this.RHYTHM_TYPES.SLOW_CONVERSATION,
            tempo: 'MEDIUM',
            directive: 'TEMPO SANTAI: Pertahankan aliran santai alami.'
        };
    }
}
