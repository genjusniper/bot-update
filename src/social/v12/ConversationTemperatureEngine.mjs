// src/social/v12/ConversationTemperatureEngine.mjs
// Analyzes conversational temperature to prevent tone-deaf responses

export class ConversationTemperatureEngine {
    static evaluateTemperature(message, previousTone = 'NORMAL') {
        const text = (message || '').trim().toLowerCase();

        // 1. TENSE / ANGRY / FRUSTRATED (😤)
        if (text.match(/(kesel|marah|brengsek|bangsat|anjir lah|parah banget sih|gak jelas)/i) && !text.includes('wkwk')) {
            return {
                temperature: 'TENSE',
                emojiPolicy: 'NO_EMOJI',
                humorAllowed: false,
                directive: "SUASANA PERCAKAPAN: TENSE / KESEL (😤). User sedang kesal/marah. JANGAN PERNAH bercanda, tertawa (wkwk), atau meremehkan. Berikan respon tenang, pengertian, dan suportif."
            };
        }

        // 2. SERIOUS / DOWN / TIRED (😔)
        if (text.match(/(capek|lelah|berat|sedih|down|kecewa|berduka|sakit)/i) && !text.includes('wkwk')) {
            return {
                temperature: 'SERIOUS',
                emojiPolicy: 'MINIMAL_WARM',
                humorAllowed: false,
                directive: "SUASANA PERCAKAPAN: SERIOUS / EMOSIONAL (😔). User sedang lelah/sedih. Gunakan empati hangat, tulus, dan dengarkan. Jangan memaksakan humor."
            };
        }

        // 3. FUN / JOKING (😂)
        if (text.match(/(wkwk|haha|ngakak|gila|lucu|kocak|wkwkwk)/i)) {
            return {
                temperature: 'FUN',
                emojiPolicy: 'NATURAL_LAUGH',
                humorAllowed: true,
                directive: "SUASANA PERCAKAPAN: FUN / BERCANDA (😂). Suasana penuh tawa dan santai. Boleh ikut tertawa santai dan gunakan humor akrab."
            };
        }

        // 4. EXCITED / HYPE (🔥)
        if (text.match(/(gokil|keren|mantap poll|jos|juara|berhasil|menang|gaspol)/i)) {
            return {
                temperature: 'EXCITED',
                emojiPolicy: 'HYPE',
                humorAllowed: true,
                directive: "SUASANA PERCAKAPAN: EXCITED / HYPE (🔥). User antusias dan senang. Balas dengan energi positif dan apresiatif."
            };
        }

        // 5. CONFUSED / ASKING CLARIFICATION (🤔)
        if (text.match(/(maksudnya|kok bisa|gimana caranya|bingung|gak paham|kenapa ya)/i)) {
            return {
                temperature: 'CONFUSED',
                emojiPolicy: 'CLEAR',
                humorAllowed: false,
                directive: "SUASANA PERCAKAPAN: CONFUSED / INGIN TAHU (🤔). User sedang bingung. Jelaskan dengan bahasa sederhana dan langsung ke intinya."
            };
        }

        // 6. DEFAULT NORMAL (😐)
        return {
            temperature: 'NORMAL',
            emojiPolicy: 'NATURAL',
            humorAllowed: true,
            directive: "SUASANA PERCAKAPAN: NORMAL (😐). Mengalir santai, akrab, dan bersahabat layaknya teman dekat."
        };
    }
}
