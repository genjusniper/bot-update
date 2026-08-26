// src/behavior/ConversationMomentumEngine.mjs
// ConversationMomentumEngine: Manages conversation momentum stages (START, FLOWING, COOLDOWN, ENDING)

export class ConversationMomentumEngine {
    static evaluate({ text, history = [] }) {
        const lower = (text || '').trim().toLowerCase();
        
        let momentum = 'FLOWING';
        let maxWords = 15;

        // 1. Identify Start / WARMING_UP
        if (history.length <= 1) {
            momentum = 'START';
            maxWords = 8; // Keep opening replies very brief
        }
        // 2. Identify Cooldown / Ending cues
        else if (lower.match(/^(oke siap|siap|yowes|yaudah|matur nuwun|suwun|thx|thanks|bye|cabut|turu)$/i)) {
            momentum = 'ENDING';
            maxWords = 3;
        }

        const directives = [];
        directives.push(`- CONVERSATION MOMENTUM: ${momentum}`);
        
        if (momentum === 'START') {
            directives.push(`- ATURAN START: Obrolan baru dimulai. Balas sangat singkat (maksimal 5-8 kata) untuk memancing kelanjutan cerita (contoh: "hah neng ndi?", "piye-piye?").`);
        } else if (momentum === 'ENDING') {
            directives.push(`- ATURAN ENDING: Obrolan mendekati akhir. Balas super singkat (1-3 kata) seperti "siap", "yoi", atau "👍" tanpa bertanya balik.`);
        }

        return {
            momentum,
            maxWords,
            directive: `=== CONVERSATION MOMENTUM ENGINE ===\n${directives.join('\n')}\n====================================`
        };
    }
}
