// src/resilience/EmergencyBrainExpanded.mjs
// V13.7 — More varied, context-aware fallback responses (non-repetitive, natural)

export class EmergencyBrainExpanded {
    static responses = {
        GREETING: [
            "Yo bro, ada apa nih?",
            "Oit! Piye kabare?",
            "Hadir bro, ngopo?",
            "Halo! Ada yang bisa dibantu?",
            "Eh, apa kabar? Lagi santai nih wkwk"
        ],
        CASUAL_STATUS: [
            "Lagi standby bro, kowe piye?",
            "Santai aja wae ki, ada apa nih?",
            "Lagi nyante karo ngopi, ada yang mau dibahas?",
            "Biasa bro, on duty. Kowe mau ngapain?",
            "Aman terkendali bro, ada yang bisa kubantu?"
        ],
        FRUSTRATION_WORK: [
            "Istirahat sek gih bro, ojo diforsir tenan.",
            "Puk-puk bro, gawean pancen ra ono enteke. Ngopi sek!",
            "Wah kesel yo bro, wajar banget. Tarik napas dulu.",
            "Santai wae bro, semua ada solusinya kok.",
            "Iya capek tuh nyata bro, jangan dipaksa kalau udah mentok. Rehat sek."
        ],
        FOOD: [
            "Nasi padang atau penyetan enak ki bro jam segini wkwk.",
            "Soto seger opo mie ayam wae bro, pas tenan!",
            "Sego goreng babat atau bakso enak ki bro. Mau order?",
            "Kopi karo gorengan anget, cocok banget nih buat nemenin ngobrol!",
            "Kayaknya lagi pengen yang berat-berat ya? Nasi goreng seafood kali?"
        ],
        LAUGH_JOKE: [
            "Wkwkwk 😂",
            "Malah ngakak lu wkwk",
            "Wkwk parah emang",
            "Bisa-bisanya ngomong gitu 😂",
            "Njir ngakak gue wkwkwk"
        ],
        CONFIRMATION: [
            "Sipp bro 👍",
            "Oke siap!",
            "Gasskeun! 🔥",
            "Mantap, lanjut!",
            "Noted bro."
        ],
        URGENT: [
            "Siap bro, ada apa? Ceritain wae.",
            "Yo bro, langsung to the point!",
            "Hadir. Gimana situasinya?"
        ],
        DIAGNOSTIC_QUERY: [
            "Tadi servernya sempet padet bro, wes tak benerin maneh.",
            "Sempet queued bro, tapi wes lancar saiki.",
            "Wes normal lagi bro, monggo lanjut ngobrol!"
        ],
        LOW_ENERGY: [
            "Rebahan sek wae bro, kadang otak emang butuh libur.",
            "Santai wae, nek lagi males ra usah dipaksa wkwk.",
            "Ngopi sek gih, ben gak spaneng."
        ],
        GENERAL_FLOW: [
            "Oh gitu, menarik bro. Terus gimana?",
            "Wah ngono to, paham. Ada lagi yang mau dibahas?",
            "Sip bro, noted. Terus?",
            "Oalah, jadi gitu ceritanya. Mau lanjut bahas apa?",
            "Hm iya bro, bener juga sih. Gimana rencana selanjutnya?",
            "Wah beneran toh? Seru juga. Ada yang bisa kubantu lebih lanjut?"
        ]
    };

    static generateReply(message) {
        const text = (message || '').trim().toLowerCase();

        if (text.match(/(kenapa gak selesai|kok lama|ngelag|kenapa lama|kok lemot|kena limit|limit token|api habis|kuota)/i)) {
            return this.pickRandom(this.responses.DIAGNOSTIC_QUERY);
        }
        if (text.match(/(urgent|darurat|tolong|bantuan segera|penting banget)/i)) {
            return this.pickRandom(this.responses.URGENT);
        }
        if (text.match(/(lagi males|males banget|mager|rebahan doang|gabut)/i)) {
            return this.pickRandom(this.responses.LOW_ENERGY);
        }
        if (/^(p|oi|oy|halo|hai|pagi|siang|malam|yo|hei)$/i.test(text)) {
            return this.pickRandom(this.responses.GREETING);
        }
        if (text.match(/(lagi apa|lagi ngapain|lg apa|lagi ngopo|kamu ngapain|km ngapain)/i)) {
            return this.pickRandom(this.responses.CASUAL_STATUS);
        }
        if (text.match(/(makan apa|laper|makan siang|makan malem|sarapan|lapar)/i)) {
            return this.pickRandom(this.responses.FOOD);
        }
        if (text.match(/(capek|lelah|kesel|pusing|lembur|banyak kerjaan|stres|burnout)/i)) {
            return this.pickRandom(this.responses.FRUSTRATION_WORK);
        }
        if (/^(wkwk|wkwkwk|haha|ngakak|lol|hehe|canda|xd)$/i.test(text)) {
            return this.pickRandom(this.responses.LAUGH_JOKE);
        }
        if (/^(oke|sip|siap|mantap|yoi|yo|ok|noted|nggih|monggo)$/i.test(text)) {
            return this.pickRandom(this.responses.CONFIRMATION);
        }

        return this.pickRandom(this.responses.GENERAL_FLOW);
    }

    static pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
}
