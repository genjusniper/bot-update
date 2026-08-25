// src/humor/AdvancedHumorEngine.mjs
// Advanced Humor Engine with 8 Modes & Contextual Callback Strategy

export class AdvancedHumorEngine {
    static HUMOR_MODES = [
        'TEASING',
        'ABSURD',
        'EXAGGERATION',
        'OBSERVATIONAL',
        'WORDPLAY',
        'SELF_DEPRECATING',
        'CALLBACK',
        'SITUATIONAL'
    ];

    static evaluate(message, conversationState, matchedCallback = null) {
        // If state is serious/curhat, suppress humor
        if (conversationState.seriousness > 0.6) {
            return {
                mode: 'SERIOUS_EMPATHY',
                shouldHumor: false,
                directive: ''
            };
        }

        // If callback matches, prioritize contextual callback humor!
        if (matchedCallback) {
            return {
                mode: 'CALLBACK',
                shouldHumor: true,
                directive: `[CALLBACK HUMOR]: Singgung dengan lelucon santai kejadian lucu lalu tentang '${matchedCallback.description}'.`
            };
        }

        // Probability roll based on state humor level
        const roll = Math.random();
        const shouldHumor = roll <= conversationState.humorLevel;

        if (!shouldHumor) {
            return { mode: 'NEUTRAL_CASUAL', shouldHumor: false, directive: '' };
        }

        // Pick dynamic mode
        const available = ['TEASING', 'EXAGGERATION', 'OBSERVATIONAL', 'SITUATIONAL'];
        const selected = available[Math.floor(Math.random() * available.length)];

        return {
            mode: selected,
            shouldHumor: true,
            directive: `[HUMOR MODE: ${selected}]: Sisipkan sedikit humor ${selected.toLowerCase()} yang luwes dan bersahabat.`
        };
    }
}
