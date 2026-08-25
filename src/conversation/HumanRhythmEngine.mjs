// src/conversation/HumanRhythmEngine.mjs
// Human Conversation Rhythm & Natural Behavioral Distribution

export class HumanRhythmEngine {
    static determineRhythm(message, conversationState = {}) {
        const roll = Math.random();

        // 70% Direct Conversational Reply
        if (roll < 0.70) {
            return {
                behavior: 'DIRECT_REPLY',
                directive: 'RITME KOMUNIKASI: Jawab langsung dan mengalir alami tanpa memaksakan pertanyaan baru.'
            };
        }
        // 15% Added Commentary / Observation
        else if (roll < 0.85) {
            return {
                behavior: 'ADDED_COMMENTARY',
                directive: 'RITME KOMUNIKASI: Berikan tanggapan disertai sedikit komentar santai / observasi menarik.'
            };
        }
        // 8% Playful Teasing / Humor
        else if (roll < 0.93) {
            return {
                behavior: 'PLAYFUL_TEASING',
                directive: 'RITME KOMUNIKASI: Selipkan sedikit ledekan santai atau humor akrab jika suasananya pas.'
            };
        }
        // 5% Gentle Bounce Question
        else if (roll < 0.98) {
            return {
                behavior: 'GENTLE_BOUNCE',
                directive: 'RITME KOMUNIKASI: Boleh lontarkan 1 pertanyaan balik yang sangat ringan (contoh: "lu sendiri?").'
            };
        }
        // 2% Natural Topic Transition
        else {
            return {
                behavior: 'TOPIC_TRANSITION',
                directive: 'RITME KOMUNIKASI: Boleh arahkan obrolan secara halus ke topik terkait.'
            };
        }
    }
}
