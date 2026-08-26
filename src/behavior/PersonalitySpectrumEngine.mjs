// src/behavior/PersonalitySpectrumEngine.mjs
// Unified Adaptive Social Behavior Engine: Decoupled Personality, Reciprocity, Energy Matching & Conversation Momentum

export class PersonalitySpectrumEngine {
    static evaluate({ text, chatId, pushName, conversationState = 'IDLE', history = [] }) {
        const lower = (text || '').trim().toLowerCase();
        const wordCount = (text || '').split(/\s+/).filter(Boolean).length;
        
        // 1. Decoupled Baseline Personality (No gender rules)
        let baseline = 'COOL'; // Default to cool/minimalist for general contacts
        if (chatId.includes('165145904984105') || chatId.includes('236322690191595')) {
            // Known very close friends / Owner -> BALANCED (warm when needed, cool when needed)
            baseline = 'BALANCED';
        }

        // 2. Conversation Momentum Detection (OPEN, FLOWING, FADING, CLOSED)
        let momentum = 'FLOWING';
        const isCloser = Boolean(lower.match(/^(makasih|suwun|matur nuwun|thanks|thx|bye|dada|cabut|tidur dulu|otw|yowes|yaudah|yws|oke siap|siap|sip)$/i)) || lower.match(/(cabut dulu|turu dulu|duluan ya|makasih ya)/i);
        const isLowSubstance = Boolean(lower.match(/^(wkwk|haha|oke|siap|sip|yowes|yaudah|gass|oh|ohh|p|👍)$/i)) || lower.length < 8;

        if (isCloser) {
            momentum = 'CLOSED';
        } else if (isLowSubstance) {
            momentum = 'FADING';
        }

        // 3. Reciprocity Engine (Matching length & substance)
        let lengthRecommendation = 'SHORT';
        if (wordCount <= 3) {
            lengthRecommendation = 'MICRO'; // User wrote very little, match with micro (1-3 words)
        } else if (wordCount > 15) {
            lengthRecommendation = 'NORMAL'; // User wrote a lot, allow normal short response (max 15 words)
        }

        // 4. Energy Matching (60-80% alignment)
        let energyLevel = 'BALANCED';
        const isExcited = Boolean(lower.match(/(woy|anjing|anjir|gila|edan|wkwkwk|haha|😂|🤣|🔥|💯)/i)) || (text && text === text.toUpperCase() && text.length > 4);
        const isSerious = Boolean(lower.match(/(sedih|nangis|kecewa|putus|sakit|musibah|meninggal|kematian|masalah|stress|mumet|pusing|kesel|capek)/i));

        if (isSerious) {
            energyLevel = 'LOW_SERIOUS';
        } else if (isExcited) {
            energyLevel = 'HIGH_EXCITED';
        }

        // 5. Calculate Final Personality Style Shift
        let currentSpectrum = baseline;
        if (isSerious) {
            currentSpectrum = 'WARM'; // Empathetic shift
        } else if (isLowSubstance && baseline !== 'COOL') {
            currentSpectrum = 'COOL'; // Chill shift
        }

        // 6. Assemble Directives
        const directives = [];
        directives.push(`- TARGET PERSONALITY: ${currentSpectrum}`);
        directives.push(`- CONVERSATION MOMENTUM: ${momentum}`);
        directives.push(`- RECIPROCITY LEVEL: ${lengthRecommendation}`);
        directives.push(`- ENERGY MATCHING: ${energyLevel}`);

        // Momentum rules
        if (momentum === 'CLOSED') {
            directives.push(`⚠️ MOMENTUM TERTUTUP: Lawan bicara pamit/mengakhiri chat. DILARANG bertanya balik! Balas super pendek (1-2 kata) seperti "siap", "yoi", atau "👍" lalu diam.`);
        } else if (momentum === 'FADING') {
            directives.push(`⚠️ MOMENTUM MEMUDAR: Chat bernada santai/rendah. Cukup balas pendek atau gunakan reaksi emoji (😂/👍) tanpa memaksakan topik baru.`);
        }

        // Reciprocity rules
        if (lengthRecommendation === 'MICRO') {
            directives.push(`- ATURAN PANJANG: User membalas sangat pendek. Balas setara (1-3 kata saja), contoh: "yoi", "gas", "oke". Jangan menulis kalimat lengkap.`);
        }

        // Energy rules
        if (energyLevel === 'LOW_SERIOUS') {
            directives.push(`- ATURAN EMOSI: Topik serius/curhat. Jawab hangat, suportif, hilangkan tawa wkwk/emot lucu.`);
        } else if (energyLevel === 'HIGH_EXCITED') {
            directives.push(`- ATURAN ENERGI: User bersemangat. Boleh ikutan tertawa wkwk atau pakai emot wajar (tapi jangan lebay/over-excited sendiri).`);
        }

        return `=== ADAPTIVE SOCIAL BEHAVIOR ENGINE (DYNAMICS & RECIPROCITY) ===
${directives.join('\n')}
================================================================`;
    }
}
