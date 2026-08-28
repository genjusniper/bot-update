// src/behavior/ConversationStateSnapshot.mjs
// ConversationStateSnapshot: Creates a single unified social/conversational state snapshot to prevent conflict between modules.

export class ConversationStateSnapshot {
    static create({ text, chatId, pushName, history = [], currentMode = 'NORMAL' }) {
        const lower = (text || '').trim().toLowerCase();

        // 1. Estimate Mode
        let mode = currentMode || 'NORMAL';
        const isVenting = Boolean(lower.match(/(sedih|nangis|kecewa|putus|sakit|musibah|meninggal|masalah|stress|mumet|pusing|kesel|capek)/i));
        const isSerious = Boolean(lower.match(/(kerjaan|resign|pc rakitan|laptop|akses kai|jadwal|krl|harga|beli|jual|kontrak)/i)) || lower.length > 40;
        const isHumor = Boolean(lower.match(/(wkwk|haha|hehe|ngakak|goblok|lucu|jodoh|halu)/i));

        if (isVenting) {
            mode = 'CURHAT';
        } else if (isSerious) {
            mode = 'SERIOUS';
        } else if (isHumor && mode !== 'CURHAT') {
            mode = 'BANTER';
        } else if (lower.length < 10 && mode !== 'CURHAT' && mode !== 'SERIOUS') {
            mode = 'COOL';
        }

        // 2. Estimate Energy (0.1 to 1.0)
        let energy = 0.5;
        const userTurns = history.filter(h => h.role === 'user').slice(-3);
        if (userTurns.length > 0) {
            const avgLength = userTurns.reduce((acc, t) => acc + t.text.length, 0) / userTurns.length;
            if (avgLength < 8) {
                energy = 0.25; // Low energy
            } else if (avgLength > 30) {
                energy = 0.8; // High energy
            }
        }

        // 3. Estimate Relationship Dynamics
        let relationship = 'FRIEND';
        if (chatId.endsWith('@g.us')) {
            relationship = 'FRIEND';
        } else {
            const totalTurns = history.length;
            if (totalTurns < 5) {
                relationship = 'STRANGER';
            } else if (totalTurns > 15) {
                relationship = 'CLOSE_FRIEND';
            }
        }

        // 4. Estimate Initiative & Reply Need
        let initiative = 'LOW'; // Default is low (don't chase conversation)
        let replyNeed = 'MUST_REPLY';

        if (lower.match(/^(wkwk|haha|😂|🤣)$/i)) {
            replyNeed = 'REACT_ONLY';
            initiative = 'LOW';
        } else if (lower.match(/^(oke|ok|siap|sip|yowes|yaudah|👍)$/i)) {
            replyNeed = 'REACT_ONLY';
            initiative = 'LOW';
        }

        // 5. Estimate Response Shape
        let responseShape = 'SINGLE';
        if (replyNeed === 'REACT_ONLY') {
            responseShape = 'REACTION_ONLY';
        } else if (lower.length > 80) {
            responseShape = 'MEDIUM';
        }

        return {
            mode,
            energy,
            relationship,
            topic: mode === 'SERIOUS' ? 'informational' : 'casual',
            initiative,
            replyNeed,
            responseShape,
            memoryUse: mode === 'SERIOUS' ? 'RELEVANT_ONLY' : 'NONE'
        };
    }
}
