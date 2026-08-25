// src/subsystems/ux/HumanUXEngine.mjs
// Realistic Human Typing Delays for WhatsApp (1.5s - 4.5s natural rhythm)

export class HumanUXEngine {
    static calculateTypingDelay(responseText, hasMedia = false) {
        if (!responseText) return 1000;

        const charCount = responseText.length;
        const wordCount = responseText.split(/\s+/).filter(Boolean).length;

        // Ultra short (1-2 words): ~1.8s - 2.5s (reading + brief typing)
        if (wordCount <= 2) {
            return 1800 + Math.floor(Math.random() * 700);
        }

        // Short chat (3-8 words): ~2.5s - 3.8s
        if (wordCount <= 8) {
            return 2500 + Math.floor(Math.random() * 1300);
        }

        // Medium chat (9-20 words): ~3.5s - 5.0s
        const calculated = Math.min(5000, Math.max(2800, wordCount * 250 + charCount * 25));
        return calculated;
    }

    static contextualizeEmojis(responseText, energyLevel = 0.5) {
        return responseText || '';
    }
}
