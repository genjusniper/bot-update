// src/behavior/BehaviorDecisionOS.mjs
// BehaviorDecisionOS: Unified social decision engine fueled by a single ConversationStateSnapshot

export class BehaviorDecisionOS {
    static evaluate({ text, chatId, snapshot, history = [] }) {
        const mode = snapshot.mode;
        const targetShape = snapshot.responseShape;
        const memoryUse = snapshot.memoryUse;

        // 1. Excitement Limiter (Energy Matching)
        let maxLaughter = 1;
        let maxEmojis = 1;

        if (mode === 'CURHAT' || mode === 'SERIOUS') {
            maxLaughter = 0;
            maxEmojis = 0;
        }

        // 2. Question Budget Constraint
        const recentAssistantTurns = history.filter(h => h.role === 'assistant').slice(-5);
        const questionCount = recentAssistantTurns.filter(t => t.text.includes('?')).length;
        const allowQuestions = questionCount < 1 && (mode === 'SERIOUS' || mode === 'NORMAL');

        const directives = [];
        directives.push(`[STICKY CONVERSATION MODE: ${mode}]`);
        directives.push(`[TARGET RESPONSE SHAPE: ${targetShape}]`);

        // Anti-Excitement Engine (Limits AI energy escalation)
        directives.push(`- ANTI-EXCITEMENT POLICY: JANGAN menaikkan energi percakapan sendirian!`);
        directives.push(`  * Jika user membalas datar/cuek, kamu wajib membalas datar/cuek.`);
        directives.push(`  * Batasi tawa maksimal ${maxLaughter} wkwk, batasi emoji maksimal ${maxEmojis}, DILARANG tanda seru (!).`);

        // Memory Relevance Gate (Memory restriction)
        if (memoryUse === 'RELEVANT_ONLY') {
            directives.push(`- MEMORY RELEVANCE GATE: Memori masa lalu hanya boleh disebut jika ditanya langsung oleh user. Jika tidak ditanya, simpan saja dalam ingatan, JANGAN diucapkan.`);
        } else {
            directives.push(`- MEMORY RELEVANCE GATE: DILARANG menyebut memori masa lalu secara acak.`);
        }

        if (mode === 'CURHAT') {
            directives.push(`- MODE CURHAT: Fokus empati tenang. DILARANG menyela dengan humor/wkwk atau nasihat sok tau.`);
        } else if (mode === 'SERIOUS') {
            directives.push(`- MODE SERIUS: Jawab to-the-point, berwibawa, dan ringkas.`);
        } else if (mode === 'BANTER') {
            directives.push(`- MODE BANTER: Ikuti candaan user secara santai.`);
        } else {
            directives.push(`- MODE COOL: Singkat, padat, cuek tapi tetap nyambung.`);
        }

        directives.push(`- ALIRAN PERCAKAPAN: ${allowQuestions ? 'Boleh bertanya balik secukupnya.' : 'DILARANG bertanya balik untuk menghindari kesan interogasi.'}`);

        return {
            mode,
            targetShape,
            directive: `=== BEHAVIOR DECISION OS DIRECTIVE ===\n${directives.join('\n')}\n=====================================`
        };
    }
}
