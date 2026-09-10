// src/core/conversation/ConversationStateGraph.mjs
// Finite state graph tracking multi-turn conversation progression per chat

export class ConversationStateGraph {
    static STATES = Object.freeze({
        IDLE: 'IDLE',
        IN_TOPIC: 'IN_TOPIC',
        VENTING: 'VENTING',
        PROBLEM_SOLVING: 'PROBLEM_SOLVING',
        BANTER_FLOW: 'BANTER_FLOW',
        CLOSING: 'CLOSING'
    });

    static #chatStates = new Map(); // chatId -> StateRecord

    /**
     * Updates or retrieves conversation state for a chat
     * @param {Object} params
     * @param {string} params.chatId
     * @param {string} params.intent - From signal fusion
     * @param {boolean} params.isClosing - From ClosureEngine
     * @param {boolean} params.isShifting - From TopicShiftEngine
     * @param {string} [params.currentTopic='GENERAL']
     * @returns {Object} StateRecord { currentState, previousState, turnCount, topic, updatedAt }
     */
    static transition({ chatId, intent = 'CHAT', isClosing = false, isShifting = false, currentTopic = 'GENERAL' }) {
        if (!chatId) return { currentState: this.STATES.IDLE, turnCount: 0, topic: 'GENERAL' };

        let record = this.#chatStates.get(chatId);
        const now = Date.now();

        if (!record || (now - record.updatedAt > 1000 * 60 * 30)) { // 30 min idle reset
            record = {
                currentState: this.STATES.IDLE,
                previousState: null,
                turnCount: 0,
                topic: currentTopic,
                updatedAt: now
            };
        }

        record.previousState = record.currentState;
        record.turnCount++;
        record.updatedAt = now;

        // Transitions
        if (isClosing) {
            record.currentState = this.STATES.CLOSING;
        } else if (intent === 'CURHAT') {
            record.currentState = this.STATES.VENTING;
        } else if (intent === 'QUERY' || intent === 'REQUEST') {
            record.currentState = this.STATES.PROBLEM_SOLVING;
        } else if (intent === 'GREETING' && record.turnCount <= 1) {
            record.currentState = this.STATES.IN_TOPIC;
        } else if (isShifting) {
            record.currentState = this.STATES.IN_TOPIC;
            record.topic = currentTopic;
        } else if (record.currentState === this.STATES.IDLE) {
            record.currentState = this.STATES.IN_TOPIC;
        }

        this.#chatStates.set(chatId, record);
        return record;
    }

    /**
     * Retrieves current state for a chat
     * @param {string} chatId
     * @returns {Object|null}
     */
    static getState(chatId) {
        return this.#chatStates.get(chatId) || null;
    }

    /**
     * Resets states for testing
     */
    static reset() {
        this.#chatStates.clear();
    }
}
