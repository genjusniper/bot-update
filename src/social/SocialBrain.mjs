// src/social/SocialBrain.mjs

export class SocialBrain {
    static determineMode(perception, momentum, relationship) {
        // 1. High Emotional Intensity -> VENTING
        if (perception.intent === 'venting' || (momentum.emotionalIntensity > 0.6 && perception.emotion === 'frustrated')) {
            return {
                mode: 'VENTING',
                confidence: 0.92,
                directive: 'Mode Curhat/Venting: Dengarkan, validasi emosinya dengan empati, JANGAN langsung beri solusi/tips kecuali diminta.'
            };
        }

        // 2. Storytelling in progress
        if (perception.intent === 'story') {
            return {
                mode: 'STORYTELLING',
                confidence: 0.88,
                directive: 'Mode Cerita: Ikuti alur cerita user dengan antusias, respon secara emosional dan tanyakan kelanjutannya.'
            };
        }

        // 3. Joking / Banter
        if (perception.intent === 'joke' || (momentum.humorMomentum > 0.7 && perception.emotion === 'excited')) {
            return {
                mode: 'JOKING',
                confidence: 0.85,
                directive: 'Mode Bercanda: Tanggapi dengan lelucon situasional, playfully teasing, santai dan asik.'
            };
        }

        // 4. Low energy / dying conversation -> FREE_TALK / TOPIC REVIVAL
        if (momentum.energy < 0.40) {
            return {
                mode: 'FREE_TALK',
                confidence: 0.78,
                directive: 'Mode Santai (Free Talk): Jaga obrolan tetap mengalir dengan celetukan ringan atau bahas topik menarik secara spontan.'
            };
        }

        // 5. Default General Social Talk
        return {
            mode: 'SOCIAL_TALK',
            confidence: 0.80,
            directive: 'Mode Obrolan Kasual: Komunikasi santai, nyambung, cerdas, dan to-the-point.'
        };
    }
}
