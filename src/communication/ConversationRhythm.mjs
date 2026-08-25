// src/communication/ConversationRhythm.mjs

export class ConversationRhythm {
    static determineRhythm(userMessage, momentum, emotionalState) {
        const text = (userMessage || '').trim().toLowerCase();
        const wordCount = text.split(/\s+/).length;

        // 1. Determine Target Response Length (word count budget)
        let targetLength = 'short'; // Default for messaging
        let maxWords = 15;
        let shouldAskQuestion = false;

        if (wordCount <= 3) {
            targetLength = 'micro'; // 1-5 words
            maxWords = 7;
            shouldAskQuestion = false; // Never force a question on micro inputs like "wkwk", "p", "oke"
        } else if (wordCount > 15 || text.includes('?') || text.includes('cerita') || text.includes('gimana')) {
            targetLength = 'medium';
            maxWords = 35;
            shouldAskQuestion = Math.random() < 0.4; // 40% chance to follow up
        }

        // 2. Trailing Ellipsis & Fragmentation Chance
        const useEllipsis = Math.random() < 0.25 && targetLength !== 'micro';
        const doubleMessageEligible = wordCount > 20 && Math.random() < 0.30;

        return {
            targetLength,
            maxWords,
            shouldAskQuestion,
            useEllipsis,
            doubleMessageEligible,
            directive: `RITME PANJANG: Maksimal ${maxWords} kata. ${shouldAskQuestion ? 'Boleh beri 1 pertanyaan balik yang santai.' : 'JANGAN bertanya balik, cukup tanggapi pernyataan user secara lugas.'}`
        };
    }
}
