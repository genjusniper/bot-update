// src/behavior/PersonalitySpectrumEngine.mjs
// Dynamic Personality Spectrum Engine: WARM ─── BALANCED ─── COOL ─── COLD

export class PersonalitySpectrumEngine {
    static evaluate({ text, chatId, pushName, conversationState = 'IDLE' }) {
        const lower = (text || '').trim().toLowerCase();
        
        // 1. Determine Baseline Personality based on Contact Relationship
        let baseline = 'BALANCED'; // Default
        
        // Cindy (159068543008903) -> WARM
        if (chatId.includes('159068543008903')) {
            baseline = 'WARM';
        }
        // Unidentified or standard contacts -> Default to COOL / BALANCED
        else if (!chatId.includes('165145904984105') && !chatId.includes('236322690191595')) {
            baseline = 'COOL';
        }

        // 2. Dynamic Shift based on Conversation Content
        let currentSpectrum = baseline;

        const isSeriousVenting = Boolean(lower.match(/(sedih|nangis|kecewa|putus|sakit|musibah|meninggal|kematian|masalah|stress|mumet|pusing|kesel|capek)/i));
        const isLowSubstance = Boolean(lower.match(/^(wkwk|haha|oke|siap|sip|yowes|yaudah|gass|oh|ohh|p)$/i)) || lower.length < 8;

        if (isSeriousVenting) {
            // Even a cool/cold baseline shifts to WARM when topics are serious/venting!
            currentSpectrum = 'WARM';
        } else if (isLowSubstance) {
            // Shift to COOL/COLD for low-substance messages (be concise, don't force chat)
            currentSpectrum = baseline === 'WARM' ? 'BALANCED' : 'COOL';
        }

        // 3. Generate Personality Directives
        const directives = [];
        directives.push(`- TARGET PERSONALITY STYLE: ${currentSpectrum}`);

        if (currentSpectrum === 'WARM') {
            directives.push(`- GAYA HANGAT (WARM): Tunjukkan kepedulian, kehangatan, bersahabat, gunakan emotikon sesuai energy, dan berikan respon suportif/empathis.`);
        } else if (currentSpectrum === 'COOL') {
            directives.push(`- GAYA COOL/CUEK (COOL): Hemat reaksi, jangan terburu-buru menjelaskan, gunakan respon minimalis/singkat (contoh: "wkwk", "ohh", "gas", "terus?"), jangan gunakan emoji berlebihan, dan JANGAN memaksakan percakapan jika topik sudah habis.`);
        } else if (currentSpectrum === 'COLD') {
            directives.push(`- GAYA DINGIN (COLD): Sangat singkat, to-the-point, hilangkan emoji sama sekali, dan jawab seperlunya.`);
        } else {
            directives.push(`- GAYA SEIMBANG (BALANCED): Berbicara wajar, santai, akrab, seimbang antara mendengarkan dan merespon.`);
        }

        return `=== PERSONALITY SPECTRUM ENGINE (DYNAMICS OF COOLNESS) ===
${directives.join('\n')}
==========================================================`;
    }
}
