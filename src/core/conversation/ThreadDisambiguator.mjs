// src/core/conversation/ThreadDisambiguator.mjs
// Disambiguates whether an incoming message continues a thread, answers a prompt, or interrupts

export class ThreadDisambiguator {
    /**
     * Evaluates relationship of incoming message to active conversation thread
     * @param {Object} params
     * @param {string} params.text - Incoming text
     * @param {Object} params.lastBotTurn - { text, askedQuestion, timestamp }
     * @param {Object} params.conversationState - StateRecord from ConversationStateGraph
     * @returns {{ threadRelation: string, isDirectAnswer: boolean, confidence: number }}
     */
    static disambiguate({ text = '', lastBotTurn = null, conversationState = null }) {
        if (!text) return { threadRelation: 'EMPTY', isDirectAnswer: false, confidence: 0 };

        const lower = text.toLowerCase().trim();

        // 1. If bot asked a question in last 2 minutes, check if this is an answer
        if (lastBotTurn?.askedQuestion && (Date.now() - (lastBotTurn.timestamp || 0) < 120000)) {
            // Short direct confirmations or answers ("iya", "nggak", "belum", "udah", numbers, etc.)
            if (/^(iya|yo|hooh|betul|bener|engga|nggak|ora|gak|belum|sudah|udah|siap|oke|yoi)$/i.test(lower) || lower.length < 15) {
                return {
                    threadRelation: 'ANSWER_TO_QUESTION',
                    isDirectAnswer: true,
                    confidence: 0.95
                };
            }
        }

        // 2. Abrupt interruption / Topic Pivot
        if (/^(eh|ngomong-ngomong|btw|anyway|oh iya|oia|eh iya)\b/i.test(lower)) {
            return {
                threadRelation: 'TOPIC_PIVOT',
                isDirectAnswer: false,
                confidence: 0.90
            };
        }

        // 3. Flow continuation
        return {
            threadRelation: 'THREAD_CONTINUATION',
            isDirectAnswer: false,
            confidence: 0.80
        };
    }
}
