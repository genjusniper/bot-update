// src/behavior/ResponseBudgetEngine.mjs
// Super Short, Natural Indonesian Human Chat Budget (Anti-Robot / Anti-Panjang)

export class ResponseBudgetEngine {
    static calculateBudget(userMessage, moodState = 'CASUAL', attachments = {}) {
        const text = (userMessage || '').trim().toLowerCase();

        // 1. Ultra-short slang / reaction intents -> Micro Budget
        if (text.match(/^(p|oi|oy|wkwk|haha|oke|sip|gas|lah|anjir|yo|mantap|siap|ok|gass|gaskeun)$/i)) {
            return {
                tier: 'MICRO',
                maxWords: 5,
                maxBubbles: 1,
                allowEmoji: true,
                reactionEligible: true,
                directive: "BATAS PANJANG: Super singkat (1-4 kata saja, santai, gaya Mas Agus)."
            };
        }

        // 2. Conversation Ending / Sign-off -> Micro Budget
        if (text.match(/^(oke makasih|makasih bro|suwun ya|tengkyu|sip otw|tidur dulu|cabut dulu|bye|dada|yaudah)$/i)) {
            return {
                tier: 'ENDING',
                maxWords: 5,
                maxBubbles: 1,
                allowEmoji: true,
                reactionEligible: true,
                directive: "BATAS PANJANG: User pamit/berterima kasih. Jawab super singkat (1-3 kata) seperti 'siap mas 👍' atau 'yoi, ati-ati'. Jangan beri pertanyaan baru!"
            };
        }

        // 3. Venting / Curhat -> Compact Empathetic Budget
        if (moodState === 'VENTING' || moodState === 'CURHAT') {
            return {
                tier: 'EMPATHY',
                maxWords: 18,
                maxBubbles: 1,
                allowEmoji: true,
                reactionEligible: false,
                directive: "BATAS PANJANG: Maksimal 10-18 kata. Santai, akrab, jangan menggurui atau memberi ceramah panjang."
            };
        }

        // 4. Opinion / Advisor
        if (text.match(/(menurutmu|mending mana|bagusan mana|worth gak|rekomendasi)/i)) {
            return {
                tier: 'OPINION',
                maxWords: 30,
                maxBubbles: 1,
                allowEmoji: true,
                reactionEligible: false,
                directive: "BATAS PANJANG: Maksimal 15-25 kata. Berikan opini singkat to-the-point."
            };
        }

        // 5. Technical / Vision
        if (attachments.hasImage || attachments.hasAudio) {
            return {
                tier: 'TECHNICAL',
                maxWords: 35,
                maxBubbles: 1,
                allowEmoji: false,
                reactionEligible: false,
                directive: "BATAS PANJANG: Maksimal 15-30 kata. Jawab singkat dan jelas mengenai gambar/suara yang dikirim."
            };
        }

        // 6. Default Casual Conversation -> Short & Natural (10-18 words)
        return {
            tier: 'CASUAL',
            maxWords: 18,
            maxBubbles: 1,
            allowEmoji: true,
            reactionEligible: false,
            directive: "BATAS PANJANG: Wajib SINGKAT & PADAT (cukup 5-15 kata saja, 1-2 kalimat pendek). JANGAN menulis panjang lebar seperti robot! Chat santai gaya Mas Agus."
        };
    }
}
