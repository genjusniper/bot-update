// src/humor/HumorEngine.mjs
// Humor Engine with Adaptive Probability & Modes

export class HumorEngine {
    static modes = [
        'PLAYFUL_TEASING',
        'SELF_DEPRECATION',
        'OBSERVATIONAL',
        'ABSURD',
        'CALLBACK',
        'WORDPLAY',
        'SITUATIONAL'
    ];

    static evaluate(message, relationshipLevel = 'CLOSE', matchedCallback = null) {
        let probability = 0.50; // default 50%
        if (relationshipLevel === 'STRANGER') probability = 0.15;
        else if (relationshipLevel === 'ACQUAINTANCE') probability = 0.35;
        else if (relationshipLevel === 'CLOSE' || relationshipLevel === 'close_friend') probability = 0.70;

        const isHumorousContext = message.match(/(wkwk|haha|lucu|canda|njir|lawak|lelucon|becanda)/i);
        if (isHumorousContext) probability += 0.20;

        const isSeriousContext = message.match(/(capek|sedih|masalah|kecewa|sakit|parah|benci|nangis)/i);
        if (isSeriousContext) probability = 0.05; // Don't joke when user is sad/serious

        const roll = Math.random();
        const shouldHumor = roll <= probability;

        let selectedMode = 'PLAYFUL_TEASING';
        if (matchedCallback) {
            selectedMode = 'CALLBACK';
        } else if (shouldHumor) {
            selectedMode = this.modes[Math.floor(Math.random() * this.modes.length)];
        }

        return {
            shouldHumor,
            mode: selectedMode,
            directive: shouldHumor 
                ? (selectedMode === 'CALLBACK' 
                    ? `[HUMOR CALLBACK]: Selipkan lelucon lama tentang '${matchedCallback.keyword}'.` 
                    : `[HUMOR MODE: ${selectedMode}]: Berikan respon dengan sentuhan humor santai/teasing yang natural.`)
                : ''
        };
    }
}
