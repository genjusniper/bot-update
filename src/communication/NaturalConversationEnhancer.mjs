// src/communication/NaturalConversationEnhancer.mjs
// Local Intelligence (<1ms, 0 Token): Dynamic Multi-Dialect Chameleon (Jabar/Jakarta vs Jawa vs Cewek/Cindy)

export class NaturalConversationEnhancer {
    static evaluate({ text, chatId, pushName, timeZone = 'Asia/Jakarta' }) {
        const input = (text || '').trim();
        const lower = input.toLowerCase();

        // 1. Multi-Dialect & Demographic Chameleon (Bunglon Bahasa Sesuai Asal & Lawan Bicara)
        let mirroringDirective = '';

        const isJabarJakarta = Boolean(lower.match(/\b(lu|gue|gw|elu|aing|maneh|kumaha|teh|kang|euy|bray|kuy|atuh|ceunah|nih|dong|kan|si)\b/i));
        const isJawaSantai = Boolean(lower.match(/\b(kue|kowe|piye|ngopo|mangkat|sido|tenan|ora|yo|wae|lha|dadi|durung|ngko|tangi|tuku|neng|ning|ra|wes|wis)\b/i));
        const isJawaSopan = Boolean(lower.match(/\b(nggih|matur nuwun|monggo|kulo|panjenengan|sampean|mugi)\b/i));
        const isKasartongkrongan = Boolean(lower.match(/\b(cok|cuk|asu|matamu|ndasmu|pantek|anjir|goblok)\b/i));

        if (isJabarJakarta && !isJawaSantai) {
            mirroringDirective = `- DETEKSI LAWAN BICARA: ORANG JABAR / JAKARTA / GAUL NASIONAL (kata kunci: lu/gue/kang/teh/euy).
  ⚠️ ATURAN MUTLAK: JANGAN SEKALI-KALI membalas dengan bahasa Jawa (seperti "kowe", "piye", "ngopo", "lha") karena lawan bicara bukan orang Jawa!
  👉 BALAS DENGAN: Bahasa Indonesia santai / gaul wajar (contoh: "aman bro", "siap", "lu gimana?", "wkwk santai aja").`;
        } else if (isKasartongkrongan) {
            mirroringDirective = `- DETEKSI LAWAN BICARA: TEMAN TONGKRONGAN SANGAT AKRAB (guyonan lepas).
  👉 BALAS DENGAN: Santai, akrab, boleh sedikit guyon/roasting timbal balik khas anak muda.`;
        } else if (isJawaSantai) {
            mirroringDirective = `- DETEKSI LAWAN BICARA: TEMAN JAWA AKRAB (seperti Hanif / kawan panjat tebing).
  👉 BALAS DENGAN: Bahasa Jawa Semarangan yang luwes, akrab, dan santai (contoh: "iyo", "wae", "piye", "ki", "tenan", "gas").`;
        } else if (isJawaSopan) {
            mirroringDirective = `- DETEKSI LAWAN BICARA: KONTAK FORMAL / SEPUH (Bahasa Jawa Halus).
  👉 BALAS DENGAN: Bahasa Jawa sopan / ramah dan menghargai.`;
        } else {
            // Default Indonesian (misal teman cewek / Cindy / chat netral)
            mirroringDirective = `- DETEKSI LAWAN BICARA: BAHASA INDONESIA SANTAI (seperti teman perempuan / Cindy / rekan netral).
  👉 BALAS DENGAN: Bahasa Indonesia santai, ramah, hangat, dan wajar (jangan membalas dengan bahasa Jawa medok agar obrolan tetap nyaman).`;
        }

        // 2. Multi-Question Detector (Jawab 2 Topik Sekaligus)
        let multiQuestionDirective = '';
        const questionMarks = (input.match(/\?/g) || []).length;
        const hasMultipleQuestions = questionMarks > 1 || (input.includes('?') && lower.match(/(oiyo|trus|terus|sekalian|sama|dan)/i));
        if (hasMultipleQuestions) {
            multiQuestionDirective = '- PANDUAN DUA TOPIK: User menanyakan 2 hal berbeda dalam 1 pesan. Pastikan kamu menjawab kedua poin tersebut secara ringkas dan runtut dalam 1 balasan!';
        }

        // 3. Time-Aware Natural Activity (Konteks Suasana Jam)
        const now = new Date();
        const hour = parseInt(now.toLocaleString('en-US', { timeZone, hour: 'numeric', hour12: false }), 10);
        let timeStateDirective = '';
        if (hour >= 5 && hour < 11) {
            timeStateDirective = '- SUASANA JAM: Pagi hari (05.00-11.00 WIB). JIKA user bertanya lagi apa, kamu baru bangun atau mulai aktivitas.';
        } else if (hour >= 11 && hour < 15) {
            timeStateDirective = '- SUASANA JAM: Siang hari (11.00-15.00 WIB). JIKA user bertanya lagi apa, kamu lagi istirahat siang atau makan.';
        } else if (hour >= 15 && hour < 18) {
            timeStateDirective = '- SUASANA JAM: Sore hari (15.00-18.00 WIB). Suasana santai sore.';
        } else if (hour >= 18 && hour < 23) {
            timeStateDirective = '- SUASANA JAM: Malam hari (18.00-23.00 WIB). Suasana santai malam.';
        } else {
            timeStateDirective = '- SUASANA JAM: Larut malam (23.00-05.00 WIB). Jawab topik obrolan secara fokus dan santai. JANGAN berulang-ulang menyuruh lawan bicara tidur kecuali lawan bicara memang sedang pamit tidur.';
        }

        return `=== PENYEMPURNA PERCAKAPAN ALAMI (NATURAL ENHANCER) ===
${mirroringDirective}
${multiQuestionDirective ? multiQuestionDirective + '\n' : ''}${timeStateDirective}
======================================================`;
    }
}
