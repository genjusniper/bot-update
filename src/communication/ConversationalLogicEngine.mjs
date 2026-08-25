// src/communication/ConversationalLogicEngine.mjs
// Local Intelligence (<1ms, 0 Token): Golden Conversational Wit, Counter-Logic, Gossip Dynamics & Banter Immunity

export class ConversationalLogicEngine {
    static evaluate({ text, pushName, chatId }) {
        const input = (text || '').trim();
        const lower = input.toLowerCase();

        const directives = [];

        // 1. Gossip / Story Teasing Detector ("aku mau cerita", "dicritani si X", "ojo ngomong...")
        const isGossip = Boolean(lower.match(/(dicritani|critani|cerita|ngomongke|tentang kowe|tentang lu|rahasia|ojo ngomong|jangan bilang|tau gak|ngerti ra)/i));
        if (isGossip) {
            directives.push(`- LOGIKA GOSIP / PENASARAN: Lawan bicara memancing cerita/gosip. Tunjukkan rasa penasaran manusiawi, desak santai untuk cerita, dan janjikan rahasia aman (contoh: "aman rahasia wkwk ndang crito", "selak penasaran iki, crito sek").`);
        }

        // 2. Playful Accusation / Teasing Counter-Logic ("jarene kowe...", "jaremu...", "katanya...")
        const isTeasedOrAccused = Boolean(lower.match(/(jarene|katanya|jare|fitnah|cium|pacar|selingkuh|gaya|sok|ngaku)/i));
        if (isTeasedOrAccused) {
            directives.push(`- LOGIKA BANTAHAN CERDAS: Jika dituduh/diejek/digosipkan hal aneh, JANGAN cuma bilang 'bukan'. Berikan bantahan logika yang lucu, santai, dan membalikkan keadaan (contoh: "pacaran wae ora pernah kok iso-isone nggawe cerita ciuman wkwk ra masuk akal kan", "fitnah kejam iku wkwk rasah dipercaya").`);
        }

        // 3. Banter / Roasting Immunity (Ora Gampang Tersinggung)
        const isRoasting = Boolean(lower.match(/(elek|sok|gaya|males|lemah|payah|pelit|cemen)/i));
        if (isRoasting) {
            directives.push(`- KEBAL ROASTING: Tanggapi ejekan santai teman dengan tawa dan roasting balik yang lucu dan santai (contoh: "wkwk sirik wae kowe", "lha timbang kowe").`);
        }

        // 4. Pop-Culture & Metaphors Guidance
        directives.push(`- METAFORA GAUL ZAMAN NOW: Gunakan analogi/metafora santai anak muda jika relevan (contoh: "kakean moco wattpad dadi halu", "seneng nambahi bumbu", "overthinking", "kurang turu").`);

        return `=== LOGIKA NALAR & KECERDASAN OBROLAN (WIT & REASONING) ===
${directives.join('\n')}
===========================================================`;
    }
}
