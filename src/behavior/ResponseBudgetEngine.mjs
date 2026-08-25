// src/behavior/ResponseBudgetEngine.mjs
// Pre-flight Response Budget: Determines word limits, bubble counts, and energy before AI generation

export class ResponseBudgetEngine {
    static calculateBudget(userMessage, moodState = 'CASUAL', attachments = {}) {
        const text = (userMessage || '').trim().toLowerCase();

        // 1. Ultra-short slang / reaction intents -> Micro Budget
        if (text.match(/^(p|oi|wkwk|haha|oke|sip|gas|lah|anjir|yo|mantap|siap)$/i)) {
            return {
                tier: 'MICRO',
                maxWords: 6,
                maxBubbles: 1,
                allowEmoji: true,
                reactionEligible: true,
                directive: "BATAS JAWABAN: Maksimal 1-4 kata saja. Singkat, padat, dan santai."
            };
        }

        // 2. Conversation Ending / Sign-off -> Micro Budget
        if (text.match(/^(oke makasih|makasih bro|suwun ya|tengkyu|sip otw|tidur dulu|cabut dulu|bye|dada)$/i)) {
            return {
                tier: 'ENDING',
                maxWords: 5,
                maxBubbles: 1,
                allowEmoji: true,
                reactionEligible: true,
                directive: "BATAS JAWABAN: User pamit/berterima kasih. Jawab super singkat (1-3 kata) seperti 'siap bro 👍' atau 'yoi, istirahat gih'. Jangan beri pertanyaan baru!"
            };
        }

        // 3. Venting / Curhat -> Compact Empathetic Budget
        if (moodState === 'VENTING' || moodState === 'CURHAT') {
            return {
                tier: 'EMPATHY',
                maxWords: 35,
                maxBubbles: 1,
                allowEmoji: true,
                reactionEligible: false,
                directive: "BATAS JAWABAN: Maksimal 15-30 kata. Fokus mendengarkan dan tenangkan hatinya dulu. Jangan beri kuliah atau daftar solusi!"
            };
        }

        // 4. Opinion / Shopping Advisor -> Balanced Budget
        if (text.match(/(menurutmu|mending mana|bagusan mana|worth gak|rekomendasi)/i)) {
            return {
                tier: 'OPINION',
                maxWords: 75,
                maxBubbles: 2,
                allowEmoji: true,
                reactionEligible: false,
                directive: "BATAS JAWABAN: Maksimal 40-70 kata. Berikan opini tegas dengan 1-2 poin alasan trade-off utama."
            };
        }

        // 5. Technical / Troubleshooting / Multimodal -> Detailed Budget
        if (attachments.hasImage || attachments.hasAudio || text.match(/(error|koding|server|troubleshoot|kenapa ini)/i)) {
            return {
                tier: 'TECHNICAL',
                maxWords: 120,
                maxBubbles: 2,
                allowEmoji: false,
                reactionEligible: false,
                directive: "BATAS JAWABAN: Maksimal 60-100 kata. Berikan langkah diagnosis langkah demi langkah yang jelas."
            };
        }

        // 6. Default Casual Conversation -> Standard Budget
        return {
            tier: 'CASUAL',
            maxWords: 40,
            maxBubbles: 2,
            allowEmoji: true,
            reactionEligible: false,
            directive: "BATAS JAWABAN: Maksimal 20-35 kata. Gaya mengalir santai layaknya teman akrab."
        };
    }
}
