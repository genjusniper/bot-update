// src/core/whatsapp/ConversationUniverse.mjs
// Hierarchical conversation model: Chat -> Conversation -> Thread -> Topic -> Participants -> Decisions -> Open Loops -> Memories
// Includes anaphoric reference resolution ("yang kemarin", "proyek tadi")

export class ConversationUniverse {
    static #threads = new Map(); // threadId -> ThreadRecord
    static #chatTopics = new Map(); // chatId -> Array of TopicHistory

    /**
     * Registers a turn into the conversation universe
     * @param {Object} intelligence - UnifiedMessageIntelligence
     * @returns {Object} Thread State
     */
    static recordTurn(intelligence) {
        const { chatId, threadId, senderId, content, timestamp, topic } = intelligence;

        if (!this.#threads.has(threadId)) {
            this.#threads.set(threadId, {
                threadId,
                chatId,
                startedAt: timestamp,
                lastActivity: timestamp,
                participants: new Set([senderId]),
                turns: [],
                activeTopic: topic || 'GENERAL',
                decisions: [],
                openLoops: []
            });
        }

        const thread = this.#threads.get(threadId);
        thread.lastActivity = timestamp;
        thread.participants.add(senderId);
        thread.turns.push({
            messageId: intelligence.messageId,
            senderId,
            content,
            timestamp
        });

        // Track topic history for the chat
        if (!this.#chatTopics.has(chatId)) {
            this.#chatTopics.set(chatId, []);
        }
        const history = this.#chatTopics.get(chatId);
        if (topic && topic !== 'GENERAL' && !history.some(h => h.topic === topic)) {
            history.push({ topic, timestamp, threadId });
            if (history.length > 20) history.shift();
        }

        return {
            threadId,
            turnCount: thread.turns.length,
            participantCount: thread.participants.size,
            activeTopic: thread.activeTopic
        };
    }

    /**
     * Resolves anaphoric expressions (e.g. "yang kemarin", "proyek tadi", "dia bilang apa")
     * @param {string} text - User query
     * @param {string} chatId - Target chat
     * @returns {{ hasReference: boolean, referenceType: string, candidateTopic: string|null, confidence: number }}
     */
    static resolveAnaphora(text = '', chatId = '') {
        const lower = text.toLowerCase();
        const history = this.#chatTopics.get(chatId) || [];

        // 1. Check temporal anaphora ("yang kemarin", "tadi", "minggu lalu")
        const isTemporalAnaphora = /\b(yang kemarin|yang tadi|tadi itu|kemarin itu|sebelumnya)\b/i.test(lower);
        if (isTemporalAnaphora) {
            const latestTopic = history.length > 0 ? history[history.length - 1].topic : null;
            return {
                hasReference: true,
                referenceType: 'TEMPORAL_ANAPHORA',
                candidateTopic: latestTopic,
                confidence: latestTopic ? 0.85 : 0.40,
                clarificationNeeded: !latestTopic
            };
        }

        // 2. Check relational anaphora ("dia bilang", "orang tadi")
        const isPersonAnaphora = /\b(dia bilang|kata dia|orang tadi|dia tadi)\b/i.test(lower);
        if (isPersonAnaphora) {
            return {
                hasReference: true,
                referenceType: 'PERSON_ANAPHORA',
                candidateTopic: null,
                confidence: 0.70,
                clarificationNeeded: false
            };
        }

        return {
            hasReference: false,
            referenceType: 'NONE',
            candidateTopic: null,
            confidence: 1.0,
            clarificationNeeded: false
        };
    }

    /**
     * Resets universe for testing
     */
    static reset() {
        this.#threads.clear();
        this.#chatTopics.clear();
    }
}
