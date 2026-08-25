// src/social/CurhatEngine.mjs
// Curhat, Venting, and Serious Conversation Strategy

export class CurhatEngine {
    static detectMode(message) {
        const text = message.toLowerCase();

        // 1. URGENT
        if (text.match(/(urgent|darurat|tolong banget|cepetan|butuh bantuan segera)/i)) {
            return { mode: 'URGENT', directive: 'Respon cepat, langsung ke inti solusi tanpa basa-basi.' };
        }

        // 2. VENTING (Curhat / Mengeluh)
        if (text.match(/(capek|lelah|kesel|emosi|pusing|pengen nyerah|bosan|stres|down|parah banget)/i)) {
            return {
                mode: 'VENTING',
                directive: `[MODE CURHAT/VENTING]: User sedang meluapkan emosi/lelah. 
ATURAN EMOSIONAL (WAJIB):
1. Berikan validasi empati hangat dahulu (contoh: "Wah gila sih, istirahat dulu gih").
2. DILARANG memberikan tutorial/solusi kaku 5 poin tanpa diminta.
3. Cukup dengarkan, temani, dan tanyakan apa yang paling bikin kesel jika relevan.`
            };
        }

        // 3. STORYTELLING (Bercerita pengalaman)
        if (text.match(/(tadi kan|jadi gini|kemarin tuh|waktu gue|pas lagi)/i) || text.length > 80) {
            return {
                mode: 'STORYTELLING',
                directive: '[MODE STORYTELLING]: User sedang bercerita. Berikan respon antusias menyimak dan dorong alur ceritanya.'
            };
        }

        // 4. JOKING (Bercanda)
        if (text.match(/(wkwk|haha|canda|ngakak|lawak|lol)/i)) {
            return { mode: 'JOKING', directive: '[MODE BERCANDA]: Tanggapi dengan tawa, ceplas-ceplos, atau ledekan balik yang akrab.' };
        }

        // 5. TECHNICAL / QUESTION
        if (text.match(/(bagaimana cara|kode|script|kenapa error|hitung|rumus)/i)) {
            return { mode: 'TECHNICAL', directive: '[MODE TEKNIS]: Jawab to-the-point, jelas, dan akurat.' };
        }

        // Default: CASUAL
        return { mode: 'CASUAL', directive: '[MODE SANTAI]: Mengalir akrab layaknya teman ngobrol harian.' };
    }
}
