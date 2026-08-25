// src/subsystems/ux/HumanUXEngine.mjs
// Human UX Engine: Adaptive Typing Speed, Presence Management & Contextual Emojis

export class HumanUXEngine {
    static calculateTypingDelay(responseText, hasMedia = false) {
        if (!responseText) return 200;

        const len = responseText.length;

        // Instant for ultra-short slang
        if (len < 10 && !hasMedia) {
            return 200; // ~0.2s
        }

        if (hasMedia) {
            return 1200; // ~1.2s for media processing
        }

        // Adaptive scaled typing delay: ~35ms per word, bounded between 300ms and 1800ms
        const wordCount = responseText.split(/\s+/).length;
        const calculated = Math.min(1800, Math.max(300, wordCount * 35));
        return calculated;
    }

    static contextualizeEmojis(responseText, energyLevel = 0.5) {
        if (!responseText) return responseText;

        if (energyLevel > 0.8 && responseText.includes('wkwk') && !responseText.match(/😂|🤣|😭/)) {
            return responseText;
        }

        return responseText;
    }
}
