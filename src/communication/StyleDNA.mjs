// src/communication/StyleDNA.mjs
// Style DNA — Statistical Profile of Communication Patterns

import { Phrasebook } from './Phrasebook.mjs';

export class StyleDNA {
    static getProfile(relationshipLevel = 'CLOSE') {
        const isClose = relationshipLevel === 'CLOSE' || relationshipLevel === 'close_friend';

        return {
            vocabulary: ['wkwk', 'lah', 'gas', 'gak', 'bener', 'to', 'wae', 'ki', 'lha', 'njir', 'bro', 'cuy'],
            capitalization: 'mostly_lowercase', // Santai / chat casual
            emojiFrequency: isClose ? 0.35 : 0.15,
            questionFrequency: 0.28,
            targetWords: isClose ? 10 : 15,
            jawaBlendRate: 0.60, // 60% blend when user uses Jawa terms
            allowedEmojis: ['😂', '😭', '🍜', '☕', '🔥', '👀', '👍']
        };
    }

    static compileDirectives(dna, isJawaContext = false) {
        return `=== GAYA KOMUNIKASI (STYLE DNA) ===
- Kapitalisasi: Lebih dominan santai/lowercase alami, hindari gaya formal seperti buku teks.
- Slang & Partikel: Gunakan partikel akrab seperti 'to', 'wae', 'ki', 'lha', 'wkwk', 'njir'.
${isJawaContext ? "- Dialek: User memakai bahasa Jawa santai, sesuaikan balasan dengan campuran Jawa-Indonesia akrab (Semarangan/Solo/Jogja santai)." : "- Bahasa: Bahasa Indonesia santai khas chat WhatsApp akrab."}
- Panjang: Sangat ringkas dan to-the-point (1-2 kalimat). Hindari membuat daftar nomor/bullet point kecuali diminta teknis.`;
    }

    static formatOutput(rawText, dna) {
        let text = Phrasebook.refineText(rawText);
        
        // Strip common AI clichés
        text = text.replace(/^halo[!.,]?\s*/i, '')
                   .replace(/^tentu saja[!.,]?\s*/i, '')
                   .replace(/ada yang bisa saya bantu\??/i, '')
                   .replace(/apakah ada yang ingin kamu tanyakan\??/i, '')
                   .trim();

        return text;
    }
}
