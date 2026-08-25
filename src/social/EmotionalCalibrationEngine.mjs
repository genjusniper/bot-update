// src/social/EmotionalCalibrationEngine.mjs
// Emotional Tone & Response Calibration Engine

export class EmotionalCalibrationEngine {
    static calibrate(message) {
        const text = (message || '').toLowerCase();

        // 1. Tired with humor ("capek wkwk")
        if (text.includes('capek') && text.match(/(wkwk|haha|😂|lol)/i)) {
            return {
                tone: 'PLAYFUL_TIRED',
                directive: "NADA EMOSI: Santai dan bercanda ringan tentang rasa lelah/capeknya."
            };
        }

        // 2. Pure Venting ("capek banget kesel")
        if (text.match(/(capek|lelah|kesel|pusing|drop|stres)/i)) {
            return {
                tone: 'SUPPORTIVE',
                directive: "NADA EMOSI: Hangat, pengertian, dan mendukung. Jangan memaksakan humor."
            };
        }

        // 3. High Excitement ("gokil", "mantap banget", "berhasil")
        if (text.match(/(gokil|keren|mantap banget|asli seru|berhasil|yes)/i)) {
            return {
                tone: 'EXCITED',
                directive: "NADA EMOSI: Ikut antusias dan bersemangat merayakan kabar baiknya!"
            };
        }

        // 4. Inquisitive / Curious
        if (text.includes('?') || text.match(/(menurutmu|penasaran|kok bisa)/i)) {
            return {
                tone: 'CURIOUS',
                directive: "NADA EMOSI: Responsif dan memberikan opini santai yang menarik."
            };
        }

        // Default Casual
        return {
            tone: 'CASUAL',
            directive: "NADA EMOSI: Santai, akrab, dan bersahabat."
        };
    }
}
