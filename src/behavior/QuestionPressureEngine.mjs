// src/behavior/QuestionPressureEngine.mjs
// QuestionPressureEngine: Prevents AI from asking too many questions or interrogating users

export class QuestionPressureEngine {
    static evaluate({ text, conversationState }) {
        const lower = (text || '').trim().toLowerCase();

        // 1. Identify Venting / Emotional states
        const isVenting = Boolean(lower.match(/(sedih|nangis|kecewa|putus|sakit|musibah|meninggal|masalah|stress|mumet|pusing|kesel|capek)/i));
        
        let allowQuestions = true;
        let pressureLevel = 'LOW';

        if (isVenting) {
            allowQuestions = false;
            pressureLevel = 'BLOCKED_EMPATHY';
        } else if (lower.length < 8) {
            allowQuestions = false;
            pressureLevel = 'BLOCKED_SHORT_CHAT';
        }

        const directives = [];
        directives.push(`- QUESTION PRESSURE: ${pressureLevel}`);

        if (!allowQuestions) {
            directives.push(`⚠️ DILARANG BERTANYA: Jangan ajukan pertanyaan apa pun dalam balasan ini! Cukup berikan empati hangat, tawa pendek wkwk, atau pengakuan santai (contoh: "waduh 😭", "siap", "sabar bro").`);
        } else {
            directives.push(`- ATURAN PERTANYAAN: Batasi pertanyaan maksimal 1 saja, jangan menumpuk banyak pertanyaan.`);
        }

        return {
            allowQuestions,
            directive: `=== QUESTION PRESSURE ENGINE ===\n${directives.join('\n')}\n=================================`
        };
    }
}
