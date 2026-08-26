// src/behavior/SocialEnergyEngine.mjs
// Unified SocialEnergyEngine: MessageWeight, EmotionalMirroring, ReplyRestraint & AntiOverenthusiasm control

export class SocialEnergyEngine {
    static evaluate({ text, conversationState = 'IDLE', history = [] }) {
        const lower = (text || '').trim().toLowerCase();

        // 1. Message Weight Engine (Receh = 5, Pings = 15, Tanya = 40, Curhat = 90)
        let weight = 40; // Default
        if (lower.match(/^(wkwk|haha|hehe|ngakak|oke|ok|siap|sip|👍|yowes|yaudah)$/i)) {
            weight = 5;
        } else if (lower.match(/^(p|oi|oy|bro|he|mas|gus)$/i)) {
            weight = 15;
        } else if (lower.includes('?') || lower.match(/(gimana|pie|piye|dimana|nandi|ngopo|kapan|kenapa)/i)) {
            weight = 60;
        } else if (lower.match(/(sedih|nangis|kecewa|putus|sakit|musibah|meninggal|masalah|stress|mumet|pusing|kesel|capek)/i)) {
            weight = 95;
        }

        // 2. Reply Restraint Engine (Decides action based on weight)
        let restraintDecision = 'RESPOND';
        if (weight === 5) {
            restraintDecision = Math.random() < 0.6 ? 'REACT_ONLY' : 'SILENT'; // 60% React, 40% Silence for low weight!
        } else if (weight === 15) {
            restraintDecision = 'SHORT_REPLY';
        }

        // 3. Social Energy Level (0 - 100)
        let energyLevel = 50; // Normal
        if (weight === 5) energyLevel = 10; // Low
        if (weight === 95) energyLevel = 90; // Serious / Supportive

        const directives = [];
        directives.push(`- MESSAGE WEIGHT: ${weight}`);
        directives.push(`- RESTRAINT ACTION: ${restraintDecision}`);
        directives.push(`- SOCIAL ENERGY LEVEL: ${energyLevel}`);

        // 4. Anti-Overenthusiasm & Don't Chase Conversation Policies
        directives.push(`- POLICY: JANGAN KEJAR PERCAKAPAN (Don't Chase Conversation).`);
        directives.push(`  * JANGAN memaksa obrolan berlanjut, JANGAN selalu bertanya balik.`);
        directives.push(`  * Biarkan obrolan selesai secara alami tanpa selalu membuka topik baru.`);
        directives.push(`  * JANGAN pernah menggunakan emoji berlebihan atau tanda seru (!).`);
        directives.push(`  * JANGAN meniru kata-kata atau tertawa terlalu lebar.`);

        if (restraintDecision === 'REACT_ONLY') {
            directives.push(`⚠️ RESTRAINT: Hanya pasang reaksi emoji (contoh: 😂/👍). DILARANG membalas dengan pesan teks!`);
        } else if (restraintDecision === 'SILENT') {
            directives.push(`⚠️ RESTRAINT: Tetap diam (Silent). Tidak ada balasan pesan teks maupun reaksi emoji.`);
        }

        return {
            weight,
            energyLevel,
            restraintDecision,
            directive: `=== SOCIAL ENERGY & RESTRAINT ENGINE ===\n${directives.join('\n')}\n========================================`
        };
    }
}
