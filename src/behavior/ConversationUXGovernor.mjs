// src/behavior/ConversationUXGovernor.mjs
// ConversationUXGovernor: Prevents AI from over-communicating and enforces the Minimum Effective Response policy

export class ConversationUXGovernor {
    static govern({ text, chatId, rawResponse, history = [], socialEnergy = {} }) {
        const incomingText = (text || '').trim().toLowerCase();
        const rawResText = (rawResponse || '').trim();

        // 1. Analyze User Fatigue / Conversation Momentum based on last 3 turns
        let userEnergy = 'NORMAL';
        const recentUserMessages = history.filter(h => h.role === 'user').slice(-3);
        const allShort = recentUserMessages.length >= 2 && recentUserMessages.every(m => m.text.length < 10);
        
        if (allShort || incomingText.length < 8) {
            userEnergy = 'LOW'; // User is tired, dry, or sending brief updates
        }

        // 2. Minimum Effective Response (Enforce strict brevity)
        let governedResponse = rawResText;
        let governedAction = 'REPLY';
        let governedReaction = null;

        // If user energy is LOW, apply strict social brake
        if (userEnergy === 'LOW') {
            // Cut response to first sentence or max 6 words
            const sentences = rawResText.split(/[.!?\n]/).filter(Boolean);
            if (sentences.length > 0) {
                governedResponse = sentences[0].trim();
            }
            // Strip any questions if user energy is low (Don't chase / interrogate)
            governedResponse = governedResponse.replace(/\?+$/, '');
            
            // If response is just laughter, simplify it
            if (incomingText.match(/^(wkwk|haha|😂|🤣)$/)) {
                governedAction = 'REACT_ONLY';
                governedReaction = '😂';
                governedResponse = '';
            } else if (incomingText.match(/^(oke|ok|siap|sip|yowes|yaudah|👍)$/)) {
                governedAction = 'REACT_ONLY';
                governedReaction = '👍';
                governedResponse = '';
            }
        }

        // 3. Emoji & Reaction Cooldown
        const emojiMatches = governedResponse.match(/[\u{1F300}-\u{1F6FF}]/gu);
        if (emojiMatches && emojiMatches.length > 1) {
            // Keep only the first emoji
            const firstEmoji = emojiMatches[0];
            governedResponse = governedResponse.replace(/[\u{1F300}-\u{1F6FF}]/gu, '');
            governedResponse += ' ' + firstEmoji;
        }

        return {
            action: governedAction,
            reactionEmoji: governedReaction,
            text: governedResponse.trim(),
            userEnergy
        };
    }
}
