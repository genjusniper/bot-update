// src/social/v12/DontOverhelpEngine.mjs
// Prevents unsolicited lecture-style advice; enforces Listen -> Validate -> Ask

export class DontOverhelpEngine {
    static isVentingWithoutAdviceRequest(message) {
        const text = (message || '').trim().toLowerCase();

        const isVenting = Boolean(text.match(/(capek banget|lelah banget|mumet|pusing poll|lagi berat|down banget|kesel gue)/i));
        const asksForAdvice = Boolean(text.match(/(harus gimana|solusinya apa|saran dong|menurutmu gue ngapain|gimana baiknya)/i));

        return isVenting && !asksForAdvice;
    }

    static getEmpatheticValidation(message) {
        const text = (message || '').trim().toLowerCase();

        if (text.match(/kerjaan|kantor|bos|proyek|tugas/i)) {
            const replies = [
                "capek urusan kerjaan lagi ya bro? istirahat dulu gih, jangan dipaksa.",
                "mumet sama tugas ya? rehat sek bro, tarik nafas dulu.",
                "lagi padat banget ya bro? santai sek, nek butuh cerita monggo."
            ];
            return replies[Math.floor(Math.random() * replies.length)];
        }

        const generalReplies = [
            "capek banget ya hari ini? istirahat dulu bro, jangan terlalu dipikir berat.",
            "rehat sek bro, badan sama pikiran butuh jeda. Semangat ya!",
            "berat ya bro hari ini? rehat sek wae, ngopi santai ben rada enteng."
        ];
        return generalReplies[Math.floor(Math.random() * generalReplies.length)];
    }
}
