// src/communication/NaturalConversationEnhancer.mjs
// Local Intelligence (<1ms, 0 Token): Slang Mirroring, Multi-Question Resolver, and Time-Aware State

export class NaturalConversationEnhancer {
    static evaluate({ text, chatId, pushName, timeZone = 'Asia/Jakarta' }) {
        const input = (text || '').trim().toLowerCase();

        // 1. Slang & Style Mirroring (Bunglon Bahasa)
        let mirroringDirective = '';
        if (input.match(/(cok|cuk|asu|matamu|ndasmu|pantek|anjir|goblok)/i)) {
            mirroringDirective = '- GAYA BUNGLON: Lawan bicara sangat akrab dengan gaya tongkrongan bebas/guyon lepas. Balas dengan santai, akrab, dan gaya tongkrongan anak muda.';
        } else if (input.match(/(kue|kowe|piye|ngopo|mangkat|sido|tenan|ora|yo|wae|lha|dadi|durung|ngko)/i)) {
            mirroringDirective = '- GAYA BUNGLON: Lawan bicara memakai bahasa Jawa santai. Balas dengan bahasa Jawa Semarangan yang luwes dan akrab (contoh: "iyo", "wae", "piye", "ki", "tenan").';
        } else if (input.match(/(nggih|matur nuwun|monggo|kulo|panjenengan|sampean)/i)) {
            mirroringDirective = '- GAYA BUNGLON: Lawan bicara memakai bahasa Jawa halus/sopan. Balas dengan nada ramah, sopan, dan menghargai.';
        } else {
            mirroringDirective = '- GAYA BUNGLON: Lawan bicara memakai bahasa Indonesia santai. Balas dengan bahasa Indonesia santai, akrab, dan wajar.';
        }

        // 2. Multi-Question Detector (Jawab 2 Topik Barengan)
        let multiQuestionDirective = '';
        const questionMarks = (text?.match(/\?/g) || []).length;
        const hasMultipleQuestions = questionMarks > 1 || (input.includes('?') && input.match(/(oiyo|trus|terus|sekalian|sama|dan)/i));
        if (hasMultipleQuestions) {
            multiQuestionDirective = '- PANDUAN DUA TOPIK: User menanyakan 2 hal berbeda dalam 1 chat. Pastikan kamu menjawab kedua poin tersebut secara ringkas dan runtut dalam 1 balasan singkat!';
        }

        // 3. Time-Aware Natural Activity (Konteks Suasana Jam)
        const now = new Date();
        const hour = parseInt(now.toLocaleString('en-US', { timeZone, hour: 'numeric', hour12: false }), 10);
        let timeStateDirective = '';
        if (hour >= 5 && hour < 11) {
            timeStateDirective = '- SUASANA JAM: Pagi hari (05.00-11.00 WIB). Jika ditanya lagi apa, kamu baru bangun, siap-siap, atau mulai aktivitas.';
        } else if (hour >= 11 && hour < 15) {
            timeStateDirective = '- SUASANA JAM: Siang hari (11.00-15.00 WIB). Jika ditanya lagi apa, kamu lagi istirahat siang, makan, atau santai.';
        } else if (hour >= 15 && hour < 18) {
            timeStateDirective = '- SUASANA JAM: Sore hari (15.00-18.00 WIB). Suasana santai sore.';
        } else if (hour >= 18 && hour < 23) {
            timeStateDirective = '- SUASANA JAM: Malam hari (18.00-23.00 WIB). Suasana santai malam, ngopi, atau rebahan santai.';
        } else {
            timeStateDirective = '- SUASANA JAM: Larut malam / Dini hari (23.00-05.00 WIB). Jika ditanya lagi apa, kamu lagi nyantai melek atau mau siap-siap tidur.';
        }

        return `=== PENYEMPURNA PERCAKAPAN ALAMI (NATURAL ENHANCER) ===
${mirroringDirective}
${multiQuestionDirective ? multiQuestionDirective + '\n' : ''}${timeStateDirective}
======================================================`;
    }
}
