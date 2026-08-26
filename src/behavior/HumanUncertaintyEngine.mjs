// src/behavior/HumanUncertaintyEngine.mjs
// HumanUncertaintyEngine: Generates natural uncertainty/hedging phrases for human realism

export class HumanUncertaintyEngine {
    static evaluate({ text }) {
        const lower = (text || '').trim().toLowerCase();

        // If user is asking for opinions or details where hedging is natural
        const isFactualInquiry = Boolean(lower.match(/(beneran|yakin|apakah|siapa|sopo|kapan|nandi|dimana)/i));

        const directives = [];
        if (isFactualInquiry) {
            directives.push(`- HEDGING GUIDELINE: Gunakan keraguan alami manusia jika menjelaskan informasi yang belum 100% pasti (contoh: "setahuku sih...", "kurang yakin, tapi nek gak salah...", "bentar, tak cek sek").`);
        }

        return {
            directive: directives.length > 0 ? `=== HUMAN UNCERTAINTY ENGINE ===\n${directives.join('\n')}\n================================` : ''
        };
    }
}
