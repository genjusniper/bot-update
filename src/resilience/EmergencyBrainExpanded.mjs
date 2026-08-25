// src/resilience/EmergencyBrainExpanded.mjs
// Expanded Organic Emergency Brain — Rich, Contextual, Zero-Leakage Offline Intelligence

export class EmergencyBrainExpanded {
    static responses = {
        GREETING: [
            "Yo bro, ada apa nih?",
            "Oit! Piye kabare?",
            "Yo! What's up?",
            "Hadir bro, ada apa nih?",
            "Oyy, nyari siapa ki? wkwk"
        ],
        CASUAL_STATUS: [
            "Lagi santai ki bro, karo ngecek sistem ben gak lemot wkwk. Kowe piye?",
            "Biasa bro, standby wae. Kowe lagi ngopo ki?",
            "Lagi nyante karo ngopi bro, lu sendiri lagi apa?",
            "Aman terkendali bro, lagi rebahan santai iki."
        ],
        FRUSTRATION_WORK: [
            "Wah istirahat sek gih bro, ojo diforsir tenan.. ngopi sek kono.",
            "Puk-puk bro, gawean pancen ra ono enteke, santai sek wae.",
            "Tarik nafas sek bro, tinggal turu sek nek wes ra kuat wkwk.",
            "Iya sih, kadang kerjaan bikin emosi, tapi jangan lupa kewarasan tetep nomor satu!"
        ],
        FOOD: [
            "Jajal soto seger opo mie ayam wae bro, pas tenan jam semene ki wkwk.",
            "Nasi padang opo penyetan enak ki bro nek pas luwe!",
            "Sego goreng babat opo bakso seger wae bro, marem!",
            "Kopi panas karo gorengan anget enak ki sore-sore ngene."
        ],
        LAUGH_JOKE: [
            "Wkwkwk 😂",
            "Malah ngakak lu wkwk",
            "Wkwk parah emang 😂",
            "Bisa-bisanya kepikiran gitu wkwk"
        ],
        CONFIRMATION: [
            "Sipp bro 👍",
            "Aman terkendali!",
            "Gasskeun! 🔥",
            "Oke siap, tak pantau!"
        ],
        URGENT: [
            "Yo bro, langsung omong wae! Kenapa ki?",
            "Siap bro, ada apa nih yang urgent? Ceritain wae.",
            "Yo bro, apa yang bisa tak bantu segera?"
        ],
        DIAGNOSTIC_QUERY: [
            "Nah iki, mau servere Google sempet padet tenan bro, tapi wes tak benerke maneh wkwk.",
            "Tadi sempet antre limit bro, tapi wes tak alihke jalur cadangan saiki, aman!",
            "Wes lancar jaya bro, monggo nek mau lanjut ngobrol maneh!"
        ],
        LOW_ENERGY: [
            "wkwk yaudah rebahan sek, kadang otak emang butuh libur 😂",
            "santai wae bro, nek lagi males ra usah dipaksa.",
            "ngopi sek gih, ben gak spaneng."
        ],
        GENERAL_FLOW: [
            "Iya bener juga sih wkwk. Terus kelanjutannya gimana bro?",
            "Wah ngono to, paham-paham.. terus piye maneh?",
            "Sip bro, tak pantau terus pokok e. Ada cerita baru gak?"
        ]
    };

    static generateReply(message) {
        const text = (message || '').trim().toLowerCase();

        // 1. Diagnostics & Limit questions
        if (text.match(/(kenapa gak selesai|kok lama|ngelag ya|kenapa lama|kok lemot|kena limit|limit token|api habis|kuota)/i)) {
            return this.pickRandom(this.responses.DIAGNOSTIC_QUERY);
        }

        // 2. Urgent
        if (text.match(/(urgent|darurat|tolong|bantuan segera)/i)) {
            return this.pickRandom(this.responses.URGENT);
        }

        // 3. Low energy / Males
        if (text.match(/(lagi males|males banget|mager|rebahan doang)/i)) {
            return this.pickRandom(this.responses.LOW_ENERGY);
        }

        // 4. Greetings
        if (/^(p|oi|oy|halo|hai|pagi|siang|malam|yo)$/i.test(text)) {
            return this.pickRandom(this.responses.GREETING);
        }

        // 5. Inquiries about status
        if (text.match(/(lagi apa|lagi ngapain|lg apa|lg ngapain)/i)) {
            return this.pickRandom(this.responses.CASUAL_STATUS);
        }

        // 6. Food
        if (text.match(/(makan apa|laper|makan siang|makan malem|sarapan)/i)) {
            return this.pickRandom(this.responses.FOOD);
        }

        // 7. Fatigue & Work
        if (text.match(/(capek|lelah|kesel|pusing|lembur|banyak kerjaan)/i)) {
            return this.pickRandom(this.responses.FRUSTRATION_WORK);
        }

        // 8. Laughs
        if (/^(wkwk|haha|ngakak|lol|canda)$/i.test(text)) {
            return this.pickRandom(this.responses.LAUGH_JOKE);
        }

        // 9. Confirmations
        if (/^(oke|sip|siap|mantap|yoi|yo)$/i.test(text)) {
            return this.pickRandom(this.responses.CONFIRMATION);
        }

        // Default natural flow
        return this.pickRandom(this.responses.GENERAL_FLOW);
    }

    static pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
}
