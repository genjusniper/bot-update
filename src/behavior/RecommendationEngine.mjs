// src/behavior/RecommendationEngine.mjs
// RecommendationEngine: Manages recommendation candidates, search session memory, and presentation styles

export class RecommendationEngine {
    static evaluate({ text, chatId, searchContext = '', history = [] }) {
        const lower = (text || '').trim().toLowerCase();

        // 1. Search Conversation Continuity (Resolving "yang kedua", "yang rtx tadi")
        let continuityDirective = '';
        const recentAssistantTurns = history.filter(h => h.role === 'assistant').slice(-3);
        
        let candidates = [];
        // Attempt to extract candidates from last bot reply
        recentAssistantTurns.forEach(turn => {
            const lines = turn.text.split('\n');
            lines.forEach(line => {
                if (line.match(/^\d+\./) || line.match(/^[a-zA-Z]\s*—/)) {
                    candidates.push(line.trim());
                }
            });
        });

        if (candidates.length > 0) {
            if (lower.includes('yang kedua') || lower.includes('nomer dua') || lower.includes('nomor dua')) {
                continuityDirective = `- CONTEXT CONTINUITY: User sedang merujuk ke kandidat kedua yaitu: "${candidates[1] || candidates[0]}". Berikan detail tentang item ini secara spesifik.`;
            } else if (lower.includes('yang rtx') || lower.includes('vga rtx')) {
                const matched = candidates.find(c => c.toLowerCase().includes('rtx'));
                if (matched) {
                    continuityDirective = `- CONTEXT CONTINUITY: User merujuk ke item RTX: "${matched}". Berikan penjelasan mendalam tentang pilihan RTX ini.`;
                }
            }
        }

        // 2. Recommendation Presentation Engine
        let presentationStyle = 'ONE_LINE'; // Default cool one-liner
        if (lower.includes('mana aja') || lower.includes('pilihan') || lower.includes('daftar') || lower.includes('opsi')) {
            presentationStyle = 'SHORT_LIST';
        } else if (lower.includes('banding') || lower.includes('vs') || lower.includes('beda')) {
            presentationStyle = 'COMPARISON';
        }

        const directives = [];
        directives.push(`[RECOMMENDATION PRESENTATION STYLE: ${presentationStyle}]`);
        if (continuityDirective) {
            directives.push(continuityDirective);
        }

        if (presentationStyle === 'ONE_LINE') {
            directives.push(`- FORMAT: Jawab hanya 1 kalimat berisi penilaian terkuat (judgment) kamu (contoh: "gue nemu beberapa, tapi RTX 4060 paling masuk budget lu").`);
        } else if (presentationStyle === 'SHORT_LIST') {
            directives.push(`- FORMAT: Tampilkan maksimal 3 opsi ringkas dengan format:`);
            directives.push(`  1. [Nama Opsi] — [Fokus Value]`);
            directives.push(`  2. [Nama Opsi] — [Fokus Performa]`);
            directives.push(`  3. [Nama Opsi] — [Fokus Harga]`);
        } else if (presentationStyle === 'COMPARISON') {
            directives.push(`- FORMAT: Bandingkan opsi utama secara singkat dan beri keputusan final (contoh: "A lebih murah, B lebih kenceng. Buat lu gue pilih B").`);
        }

        // 3. Current Info Guard (Strict Search vs Knowledge boundary)
        const requiresRealTimeInfo = Boolean(lower.match(/(harga|terbaru|cuaca|berita|krl|jadwal|stok|kurs)/i));
        if (requiresRealTimeInfo && !searchContext) {
            directives.push(`⚠️ WARNING: Informasi yang ditanyakan memerlukan data real-time, tetapi hasil pencarian kosong. JANGAN mengarang fakta! Katakan secara jujur jika data tidak tersedia.`);
        }

        return {
            presentationStyle,
            directive: `=== RECOMMENDATION ENGINE DIRECTIVE ===\n${directives.join('\n')}\n=======================================`
        };
    }
}
