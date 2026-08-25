// src/communication/BubbleComposer.mjs
// Bubble Composer & Natural Typing Pacing

export class BubbleComposer {
    static composeBubbles(fullText) {
        if (!fullText || typeof fullText !== 'string') return [fullText];
        const trimmed = fullText.trim();

        // If very short or contains line breaks
        if (trimmed.includes('\n\n')) {
            return trimmed.split(/\n\n+/).map(s => s.trim()).filter(s => s.length > 0);
        }

        // Probability distribution: 70% single bubble, 25% two bubbles, 5% three bubbles
        const sentences = trimmed.split(/(?<=[.?!])\s+/).filter(s => s.length > 0);
        if (sentences.length <= 1) return [trimmed];

        const roll = Math.random();
        if (roll < 0.70 || sentences.length < 2) {
            return [trimmed]; // Single bubble
        } else if (roll < 0.95 || sentences.length === 2) {
            // Two bubbles
            const mid = Math.ceil(sentences.length / 2);
            return [
                sentences.slice(0, mid).join(' '),
                sentences.slice(mid).join(' ')
            ];
        } else {
            // Three bubbles
            return sentences.slice(0, 3);
        }
    }

    static calculateTypingDelayMs(text) {
        const words = (text || '').split(/\s+/).length;
        if (words <= 4) return 600; // 0.6s
        if (words <= 12) return 1200; // 1.2s
        return Math.min(2500, 1000 + (words * 60)); // Max 2.5s
    }
}
