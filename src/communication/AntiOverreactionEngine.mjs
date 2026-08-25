// src/communication/AntiOverreactionEngine.mjs

export class AntiOverreactionEngine {
    static sanitizeReaction(userMessage, candidateResponse) {
        const userText = (userMessage || '').trim();
        let response = (candidateResponse || '').trim();

        // If user sends simple short message (e.g. "anjir", "oke", "p"), suppress emoji explosion
        if (userText.length < 10) {
            // Cap emojis to at most 1
            const emojiMatches = response.match(/[\u{1F300}-\u{1F9FF}]/gu) || [];
            if (emojiMatches.length > 2) {
                // Keep only first emoji
                let seen = 0;
                response = response.replace(/[\u{1F300}-\u{1F9FF}]/gu, (match) => {
                    seen++;
                    return seen === 1 ? match : '';
                });
            }

            // Suppress exaggerated laughter like "WKWKWKWKWK" if user didn't laugh
            if (!userText.toLowerCase().includes('wkwk') && response.match(/WKWK{3,}/i)) {
                response = response.replace(/WKWK{3,}/gi, 'wkwk');
            }
        }

        return response.trim();
    }
}
