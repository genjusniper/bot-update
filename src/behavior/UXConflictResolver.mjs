// src/behavior/UXConflictResolver.mjs
// UXConflictResolver: Resolves conflict between social/behavioral modules, estimates user energy, detects overtalk, and enforces low initiative.

export class UXConflictResolver {
    static resolve({ text, chatId, rawResponse, history = [], moodState = 'NORMAL' }) {
        const incomingText = (text || '').trim().toLowerCase();
        const responseText = (rawResponse || '').trim();

        // 1. User Energy Estimator (0.1 to 1.0)
        let userEnergy = 0.5; // Default normal
        const userTurns = history.filter(h => h.role === 'user').slice(-3);
        
        if (userTurns.length > 0) {
            const avgLength = userTurns.reduce((acc, t) => acc + t.text.length, 0) / userTurns.length;
            const hasLaughter = userTurns.some(t => t.text.toLowerCase().match(/(wkwk|haha|😂|🤣)/));
            
            if (avgLength < 8) {
                userEnergy = 0.2; // Low energy
            } else if (avgLength > 30 || hasLaughter) {
                userEnergy = 0.8; // High energy
            }
        }

        // 2. Overtalk Detector (Compare Bot vs User message length ratio)
        let governedResponse = responseText;
        const userLength = incomingText.split(/\s+/).length;
        const botLength = responseText.split(/\s+/).length;

        // Ratio brake: if Bot is talking > 3x the user, enforce Minimum Effective Response
        if (userEnergy < 0.5 && botLength > 15 && botLength > userLength * 2.5) {
            const sentences = responseText.split(/[.!?\n]/).filter(Boolean);
            if (sentences.length > 0) {
                governedResponse = sentences[0].trim(); // Cut to the very first sentence
            }
        }

        // 3. Social Initiative Controller (Low Initiative Policy)
        let finalAction = 'REPLY';
        let finalReaction = null;

        const isBasaBasi = Boolean(incomingText.match(/^(wkwk|haha|😂|🤣|oke|ok|siap|sip|yowes|yaudah|👍|suwun|makasih|thanks|turu|tidur dulu)$/i));
        if (isBasaBasi) {
            if (incomingText.match(/^(wkwk|haha|😂|🤣)$/i)) {
                finalAction = 'REACT_ONLY';
                finalReaction = '😂';
                governedResponse = '';
            } else if (incomingText.match(/^(oke|ok|siap|sip|yowes|yaudah|👍|suwun|makasih)$/i)) {
                finalAction = 'REACT_ONLY';
                finalReaction = '👍';
                governedResponse = '';
            } else {
                // Exit/Turu
                finalAction = 'REPLY';
                governedResponse = incomingText.match(/(turu|tidur)/) ? 'oke, turu sono' : 'yoi, sama-sama';
            }
        }

        // 4. Message Form Selector (Enforce TEXT_SINGLE or REACTION_ONLY)
        const form = finalAction === 'REACT_ONLY' ? 'REACTION_ONLY' : 'TEXT_SINGLE';

        return {
            action: finalAction,
            reactionEmoji: finalReaction,
            text: governedResponse.trim(),
            userEnergy,
            form
        };
    }
}
