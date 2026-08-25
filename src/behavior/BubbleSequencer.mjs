// src/behavior/BubbleSequencer.mjs
// Sequences multi-part responses into 1-3 natural WhatsApp chat bubbles

export class BubbleSequencer {
    static sequence(text, maxBubbles = 2) {
        if (!text) return [];

        const clean = text.trim();

        // If no newline, keep as 1 bubble
        if (!clean.includes('\n')) {
            return [clean];
        }

        // Split by distinct paragraphs / double newlines
        const paragraphs = clean
            .split(/\n{2,}/)
            .map(p => p.trim())
            .filter(p => p.length > 0);

        if (paragraphs.length > 1 && paragraphs.length <= maxBubbles) {
            // Ensure each bubble has substance (> 5 chars)
            if (paragraphs.every(p => p.length >= 5)) {
                return paragraphs;
            }
        }

        // Split by single newline if there are 2 natural blocks
        const lines = clean
            .split(/\n+/)
            .map(l => l.trim())
            .filter(l => l.length > 0);

        if (lines.length === 2 && lines[0].length >= 5 && lines[1].length >= 5) {
            return lines;
        }

        // Default: return single full bubble
        return [clean];
    }
}
