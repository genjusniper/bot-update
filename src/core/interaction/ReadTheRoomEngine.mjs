// src/core/interaction/ReadTheRoomEngine.mjs
// Evaluates emotional and social room climate to prevent tone-deaf responses

export class ReadTheRoomEngine {
    static ROOM_STATES = Object.freeze({
        SERIOUS: 'SERIOUS',
        CASUAL: 'CASUAL',
        JOKING: 'JOKING',
        ANNOYED: 'ANNOYED',
        EXCITED: 'EXCITED',
        CONFUSED: 'CONFUSED',
        ASKING: 'ASKING',
        VENTING: 'VENTING',
        JUST_SHARING: 'JUST_SHARING'
    });

    /**
     * Reads room state from text and sensory signals
     * @param {Object} params
     * @param {string} params.text
     * @param {Object} params.fusedSnapshot
     * @returns {Object} { state, confidence, toneRecommendation }
     */
    static read({ text = '', fusedSnapshot = {} }) {
        const lower = (text || '').toLowerCase().trim();
        const dims = fusedSnapshot.dimensions || {};

        // 1. High Urgency or Emergency -> SERIOUS
        if (dims.urgency >= 0.7 || /server down|urgent|crash|error 500|emergency|darurat|critical/i.test(lower)) {
            return {
                state: this.ROOM_STATES.SERIOUS,
                confidence: 0.95,
                toneRecommendation: 'DIRECT_NO_NONSENSE'
            };
        }

        // 2. Curhat / Venting -> VENTING
        if (dims.conversationState === 'VENTING' || dims.intent === 'CURHAT' || /capek|lelah|pusing|kesel|marah|kecewa|sedih|burnout/i.test(lower)) {
            return {
                state: this.ROOM_STATES.VENTING,
                confidence: 0.90,
                toneRecommendation: 'EMPATHETIC_VALIDATING'
            };
        }

        // 3. User Annoyance -> ANNOYED
        if (/ribet banget|lemot|gajelas|bego|gak fungsi|payah/i.test(lower)) {
            return {
                state: this.ROOM_STATES.ANNOYED,
                confidence: 0.85,
                toneRecommendation: 'CALM_PRAGMATIC'
            };
        }

        // 4. Playful / Sarcasm / Banter -> JOKING
        if (/\bwkwk+|haha+|ceng|lucu|koplak|lawak\b/i.test(lower) && dims.emotionValence !== 'NEGATIVE') {
            return {
                state: this.ROOM_STATES.JOKING,
                confidence: 0.85,
                toneRecommendation: 'DRY_DEADPAN_PLAYFUL'
            };
        }

        // 5. User excitement -> EXCITED
        if (/mantap|gacor|asik|keren|akhirnya|berhasil|sukses/i.test(lower) && dims.emotionalIntensity >= 0.6) {
            return {
                state: this.ROOM_STATES.EXCITED,
                confidence: 0.80,
                toneRecommendation: 'WARM_APPRECIATIVE'
            };
        }

        // 6. Confusion -> CONFUSED
        if (dims.confusion >= 0.5 || /maksudnya|gimana caranya|bingung|kok bisa/i.test(lower)) {
            return {
                state: this.ROOM_STATES.CONFUSED,
                confidence: 0.85,
                toneRecommendation: 'CLEAR_LUCID'
            };
        }

        // 7. Direct Functional Query -> ASKING
        if (dims.intent === 'QUERY' || dims.intent === 'REQUEST' || lower.includes('?')) {
            return {
                state: this.ROOM_STATES.ASKING,
                confidence: 0.80,
                toneRecommendation: 'HELPFUL_CONCISE'
            };
        }

        // 8. Story sharing -> JUST_SHARING
        if (/\b(tadi|kemarin|gue ketemu|liat orang|pas lagi)\b/i.test(lower) && !lower.includes('?')) {
            return {
                state: this.ROOM_STATES.JUST_SHARING,
                confidence: 0.75,
                toneRecommendation: 'CASUAL_LISTENER'
            };
        }

        return {
            state: this.ROOM_STATES.CASUAL,
            confidence: 0.70,
            toneRecommendation: 'CASUAL_COOL'
        };
    }
}
