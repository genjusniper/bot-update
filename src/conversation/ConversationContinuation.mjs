// src/conversation/ConversationContinuation.mjs
// Conversation Continuation & Natural Momentum Keeper

export class ConversationContinuation {
    static evaluate(message, mode = 'CASUAL', historyLength = 0) {
        const text = message.toLowerCase().trim();

        // If user asks a light greeting / "lagi ngapain" / "gimana"
        if (text.match(/^(lagi ngapain|lg apa|lagi apa|gimana|halo|oi|p)$/i)) {
            return {
                shouldContinue: true,
                suggestedBounce: "Setelah menjawab santai, pertimbangkan follow-up ringan yang relevan (contoh: 'lu sendiri gimana?')."
            };
        }

        // If user ended with an acknowledgment / "oke" / "sip"
        if (text.match(/^(oke|sip|siap|makasih|mantap|yo|wkwk)$/i)) {
            return {
                shouldContinue: false,
                suggestedBounce: "Jangan memaksakan pertanyaan baru. Cukup respon singkat/reaktif."
            };
        }

        return {
            shouldContinue: false,
            suggestedBounce: ""
        };
    }
}
