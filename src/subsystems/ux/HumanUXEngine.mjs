// src/subsystems/ux/HumanUXEngine.mjs
// Realistic Human Typing Delays for WhatsApp (1.5s - 4.5s natural rhythm)

export class HumanUXEngine {
    static calculateTypingDelay(responseText, hasMedia = false) {
        if (!responseText) return 1000;

        const charCount = responseText.length;
        const wordCount = responseText.split(/\s+/).filter(Boolean).length;

        // Ultra short (1-2 words): ~1.2s - 1.8s
        if (wordCount <= 2) {
            return 1200 + Math.floor(Math.random() * 600);
        }

        // Short chat (3-8 words): ~1.8s - 2.8s
        if (wordCount <= 8) {
            return 1800 + Math.floor(Math.random() * 1000);
        }

        // Medium chat (9-20 words): ~2.8s - 4.2s
        const calculated = Math.min(4500, Math.max(2200, wordCount * 220 + charCount * 20));
        return calculated;
    }

    static contextualizeEmojis(responseText, energyLevel = 0.5) {
        return responseText || '';
    }
}
