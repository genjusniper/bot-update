// src/behavior/BehaviorDecisionOS.mjs
// BehaviorDecisionOS: Consolidated social behavior coordinator to reduce conflicts between social engines

export class BehaviorDecisionOS {
    static evaluate({ text, chatId, history = [], currentMode = 'NORMAL' }) {
        const lower = (text || '').trim().toLowerCase();

        // 1. Conversation Mode Memory (Sticky modes)
        let mode = currentMode || 'NORMAL';
        const isVenting = Boolean(lower.match(/(sedih|nangis|kecewa|putus|sakit|musibah|meninggal|masalah|stress|mumet|pusing|kesel|capek)/i));
        const isSerious = Boolean(lower.match(/(kerjaan|resign|pc rakitan|laptop|akses kai|jadwal|krl|harga|beli|jual|kontrak)/i)) || lower.length > 40;
        const isHumor = Boolean(lower.match(/(wkwk|haha|hehe|ngakak|goblok|lucu|jodoh|halu)/i));

        if (isVenting) {
            mode = 'CURHAT';
        } else if (isSerious) {
            mode = 'SERIOUS';
        } else if (isHumor && mode !== 'CURHAT') {
            mode = 'BANTER';
        } else if (lower.length < 10 && mode !== 'CURHAT' && mode !== 'SERIOUS') {
            mode = 'COOL';
        }

        // 2. Excitement Limiter (Do not raise energy alone)
        let maxEmojis = 1;
        let allowQuestions = false;
        let maxLaughter = 1;

        // Question budget: check history for recent questions from Assistant
        const recentAssistantTurns = history.filter(h => h.role === 'assistant').slice(-5);
        const questionCount = recentAssistantTurns.filter(t => t.text.includes('?')).length;
        if (questionCount < 1 && (mode === 'SERIOUS' || mode === 'NORMAL')) {
            allowQuestions = true; // Only allow questions if we haven't asked recently
        }

        // 3. Formulate unified directives
        const directives = [];
        directives.push(`[STICKY CONVERSATION MODE: ${mode}]`);
        
        if (mode === 'CURHAT') {
            directives.push(`- MODE CURHAT: Fokus empati tenang. DILARANG menyela dengan humor/wkwk atau nasihat sok tau.`);
            directives.push(`- Jeda santai, katakan sesuatu yang menenangkan saja (contoh: "waduh, dinikmati pelan-pelan wae").`);
            maxLaughter = 0;
            maxEmojis = 1;
        } else if (mode === 'SERIOUS') {
            directives.push(`- MODE SERIUS: Jawab to-the-point, berwibawa, dan ringkas.`);
            maxLaughter = 0;
        } else if (mode === 'BANTER') {
            directives.push(`- MODE BANTER: Ikuti candaan user secara santai. Gunakan maksimal 1 'wkwk' di akhir.`);
        } else {
            directives.push(`- MODE COOL: Singkat, padat, cuek tapi tetap nyambung.`);
        }

        directives.push(`- LIMITER: Maksimal ${maxLaughter} tawa (wkwk/haha), maksimal ${maxEmojis} emoji, DILARANG menggunakan tanda seru (!).`);
        directives.push(`- ALIRAN PERCAKAPAN: ${allowQuestions ? 'Boleh bertanya balik secukupnya.' : 'DILARANG bertanya balik untuk menghindari kesan interogasi.'}`);

        return {
            mode,
            directive: `=== BEHAVIOR DECISION OS DIRECTIVE ===\n${directives.join('\n')}\n=====================================`
        };
    }
}
