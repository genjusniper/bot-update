// src/humor/HumorTimingDetector.mjs
// Humor Timing & Fatigue Detector

export class HumorTimingDetector {
    static calculateIntensity(message, emotionalTone = 'NEUTRAL') {
        const text = (message || '').toLowerCase();

        // 1. User is laughing or joking
        if (text.match(/(wkwk|haha|ngakak|lucu|lawak|lol|canda)/i)) {
            return {
                intensity: 0.85,
                timingState: 'HIGH_HUMOR_FLOW',
                directive: "TIMING HUMOR: Sangat tepat untuk menimpali candaan atau melontarkan ledekan akrab."
            };
        }

        // 2. User is serious or venting
        if (text.match(/(capek|lelah|sedih|kesel|parah|benci|nangis|kecewa)/i) || emotionalTone === 'SERIOUS') {
            return {
                intensity: 0.05,
                timingState: 'SERIOUS_SUPPRESSION',
                directive: "TIMING HUMOR: DILARANG bercanda. Jaga nada bicara tetap tenang, perhatian, dan empatik."
            };
        }

        // 3. Casual conversational baseline
        return {
            intensity: 0.50,
            timingState: 'CASUAL_WARMTH',
            directive: "TIMING HUMOR: Sisipkan celetukan ringan jika relevan."
        };
    }
}
