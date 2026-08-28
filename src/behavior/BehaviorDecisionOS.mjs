// src/behavior/BehaviorDecisionOS.mjs
// BehaviorDecisionOS: Consolidated social behavior coordinator with ResponseShape, AntiExcitement and MemoryRestraint policies

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

        // 2. Response Shape Selector (Decide shape beforehand)
        let targetShape = 'SINGLE';
        if (lower.match(/^(wkwk|haha|😂|🤣|oke|ok|siap|sip|👍)$/i)) {
            targetShape = 'REACTION_ONLY';
        } else if (lower.length > 80) {
            targetShape = 'MEDIUM';
        }

        // 3. Question Budget
        let allowQuestions = false;
        const recentAssistantTurns = history.filter(h => h.role === 'assistant').slice(-5);
        const questionCount = recentAssistantTurns.filter(t => t.text.includes('?')).length;
        if (questionCount < 1 && (mode === 'SERIOUS' || mode === 'NORMAL')) {
            allowQuestions = true;
        }

        // 4. Formulate unified directives
        const directives = [];
        directives.push(`[STICKY CONVERSATION MODE: ${mode}]`);
        directives.push(`[TARGET RESPONSE SHAPE: ${targetShape}]`);

        // AntiExcitement Engine
        directives.push(`- ANTI-EXCITEMENT POLICY: DILARANG keras meningkatkan energi percakapan sendirian!`);
        directives.push(`  * Jika user membalas cuek/pendek, kamu wajib membalas cuek/pendek.`);
        directives.push(`  * DILARANG lebay, DILARANG memuji berlebihan, DILARANG bertanya balik tanpa henti.`);

        // Memory Restraint Engine
        directives.push(`- MEMORY RESTRAINT POLICY: "Aku ingat, tapi aku nggak harus mengucapkannya."`);
        directives.push(`  * Hanya gunakan memori masa lalu jika ditanyakan langsung oleh user.`);
        directives.push(`  * JANGAN tiba-tiba memunculkan fakta lama yang tidak relevan dengan obrolan detik ini.`);

        if (mode === 'CURHAT') {
            directives.push(`- MODE CURHAT: Fokus empati tenang. DILARANG menyela dengan humor/wkwk atau nasihat sok tau.`);
            directives.push(`- Jeda santai, katakan sesuatu yang menenangkan saja (contoh: "waduh, dinikmati pelan-pelan wae").`);
        } else if (mode === 'SERIOUS') {
            directives.push(`- MODE SERIUS: Jawab to-the-point, berwibawa, dan ringkas.`);
        } else if (mode === 'BANTER') {
            directives.push(`- MODE BANTER: Ikuti candaan user secara santai. Gunakan maksimal 1 'wkwk' di akhir.`);
        } else {
            directives.push(`- MODE COOL: Singkat, padat, cuek tapi tetap nyambung.`);
        }

        directives.push(`- LIMITER: Maksimal 1 tawa (wkwk/haha), maksimal 1 emoji, DILARANG menggunakan tanda seru (!).`);
        directives.push(`- ALIRAN PERCAKAPAN: ${allowQuestions ? 'Boleh bertanya balik secukupnya.' : 'DILARANG bertanya balik untuk menghindari kesan interogasi.'}`);

        return {
            mode,
            targetShape,
            directive: `=== BEHAVIOR DECISION OS DIRECTIVE ===\n${directives.join('\n')}\n=====================================`
        };
    }
}
