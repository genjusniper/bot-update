// src/core/flow/FlowStateModel.mjs
// Dynamic state model tracking conversation momentum and lifecycle

export const FlowStateModel = Object.freeze({
    STATES: Object.freeze({
        INITIATION: 'INITIATION',     // First contact / greeting / opening
        ENGAGED: 'ENGAGED',           // Active discussion, back-and-forth
        DEEP_DIVE: 'DEEP_DIVE',       // Intensive problem solving or emotional curhat
        WINDING_DOWN: 'WINDING_DOWN', // Topic exhausting, natural cooling off
        CLOSURE: 'CLOSURE',           // Exit/goodbye signals detected
        IDLE: 'IDLE'                  // Conversation paused or finished
    }),

    /**
     * Determines current flow state based on user input and history length
     * @param {Object} params
     * @param {string} params.text
     * @param {number} [params.turnCount=1]
     * @returns {string} One of STATES
     */
    evaluateState({ text = '', turnCount = 1 }) {
        const lower = text.toLowerCase().trim();

        // Check closure indicators (short phrases <= 5 words containing closure keywords without questions)
        const words = lower.split(/\s+/).filter(Boolean);
        const hasClosure = /\b(makasih|suwun|thx|thanks|yowis|yo wis|duluan|bye|dadah|oke|siap|sip|mantap|noted|aman)\b/i.test(lower);
        if (words.length <= 5 && hasClosure && !lower.includes('?')) {
            return this.STATES.CLOSURE;
        }

        // Check greeting / initiation
        if (turnCount <= 1 && /^(halo|hai|oi|p|assalamualaikum|pagi|siang|sore|malem)/i.test(lower)) {
            return this.STATES.INITIATION;
        }

        if (turnCount >= 6) {
            return this.STATES.WINDING_DOWN;
        }

        return this.STATES.ENGAGED;
    }
});
