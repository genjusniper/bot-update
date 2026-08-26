// src/behavior/ReplyDecisionPolicy.mjs
// Local Deterministic Decision Policy (<1ms, 0 Token): Decide whether to REPLY, REACT_ONLY, READ_ONLY, or IGNORE

export class ReplyDecisionPolicy {
    static evaluate({ text, incomingText, lastBotMessage, conversationState, topicOutcome }) {
        const clean = (incomingText || text || '').trim().toLowerCase();

        // 1. Empty or whitespace -> IGNORE
        if (!clean) {
            return { decision: 'IGNORE', reason: 'EMPTY_TEXT', reactionEmoji: null };
        }

        // 2. Pure laughter / chuckle -> REACT_ONLY (send emoji reaction only, no text message)
        if (clean.match(/^(wkwk|wkwkwk|wkwkwkwk|haha|hahaha|ngakak|wkwkkw)$/i)) {
            return { decision: 'REACT_ONLY', reason: 'CASUAL_LAUGHTER', reactionEmoji: '😂' };
        }

        // 3. Pure acknowledgement / conversation closer -> READ_ONLY (stay silent, just read)
        if (clean.match(/^(oke|ok|oke siap|siap|noted|sip|sipp|siipp|yowes|yaudah|nggih|monggo)$/i)) {
            // If there is an active unresolved question waiting from bot, reply. Otherwise stay silent!
            if (topicOutcome?.status === 'WAITING_USER_CONFIRMATION') {
                return { decision: 'REPLY', reason: 'USER_CONFIRMED_PENDING_PLAN', reactionEmoji: null };
            }
            return { decision: 'READ_ONLY', reason: 'CONVERSATION_CLOSER_SILENT', reactionEmoji: '👍' };
        }

        // 4. Gratitude sign-off -> REACT_ONLY with thumbs up / heart
        if (clean.match(/^(makasih|matur nuwun|suwun ya|suwun mas|thanks|thx|tengkyu)$/i)) {
            return { decision: 'REACT_ONLY', reason: 'GRATITUDE_REACTION', reactionEmoji: '👍' };
        }

        // 5. Direct Question or Location Inquiry -> Full REPLY
        if (clean.match(/(dimana|nandi|ngopo|kapan|jam piro|piye|sido|sido ora|jadi gak|bisa gak|kenapa|opo|siapa|sopo)/i) || clean.includes('?')) {
            return { decision: 'REPLY', reason: 'EXPLICIT_QUESTION', reactionEmoji: null };
        }

        // 6. Action / Banter / Conversation Flow -> Full REPLY
        return { decision: 'REPLY', reason: 'STANDARD_CONVERSATION', reactionEmoji: null };
    }
}
