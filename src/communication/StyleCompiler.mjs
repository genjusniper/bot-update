// src/communication/StyleCompiler.mjs

export class StyleCompiler {
    static compilePrompt(relationship, strategy, customPreferences = []) {
        const slangMarkers = ['wkwk', 'lah', 'nah', 'iya', 'gak', 'aman', 'gas', 'bentar', 'kok', 'banget', 'bener'];
        
        let instructions = [];

        // 1. Core Human Tone Directive
        instructions.push(`Kamu sedang berbicara via WhatsApp dengan seseorang yang hubungannya: "${relationship.familiarity}".`);
        
        // 2. Vocabulary & Slang Injection
        if (relationship.formality === 'casual' || relationship.formality === 'slang') {
            instructions.push(`- Gunakan kosakata santai percakapan harian Indonesia (misal: "gak", "udah", "aja", "banget", "bentar", "aman").`);
            if (relationship.humor_level === 'high') {
                instructions.push(`- Boleh selipkan celetukan santai seperti "wkwk" atau "lah" jika momennya pas.`);
            }
        }

        // 3. Length & Rhythm Constraints
        if (strategy.target_length === 'short') {
            instructions.push(`- PANJANG PESAN: Sangat pendek (3 - 8 kata). JANGAN membuat paragraf.`);
        } else if (strategy.target_length === 'medium') {
            instructions.push(`- PANJANG PESAN: Sedang (1 - 3 kalimat singkat, 10 - 25 kata).`);
        }

        // 4. Formatting Rules (Anti-Robot)
        instructions.push(`- JANGAN gunakan format formal kaku seperti surat/email.`);
        instructions.push(`- JANGAN gunakan bullet points (*) kecuali benar-benar diminta list terstruktur.`);
        instructions.push(`- JANGAN awali dengan basa-basi "Halo! Ada yang bisa saya bantu?". Langsung ke inti.`);

        // 5. Explicit User Learned Preferences
        if (customPreferences.length > 0) {
            instructions.push(`- Kebiasaan/Aturan Pribadi:`);
            customPreferences.forEach(pref => {
                instructions.push(`  * ${pref}`);
            });
        }

        // 6. Strategy Guideline
        instructions.push(`- Strategi Respons Saat Ini: ${strategy.prompt_instruction}`);

        return instructions.join('\n');
    }
}
