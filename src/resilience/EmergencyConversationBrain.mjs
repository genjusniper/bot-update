// src/resilience/EmergencyConversationBrain.mjs
// Local Emergency Conversation Brain — Zero-API Offline Intelligence

export class EmergencyConversationBrain {
    static patternRegistry = [
        // 1. Diagnostics & Limit Inquiries
        {
            regex: /(kenapa gak selesai|kok lama|ngelag ya|kenapa lama|kok lemot|lama banget)/i,
            replies: [
                "Nah iki, barusan servere sempet padet tenan bro, tapi saiki wes tak benerke maneh wkwk.",
                "Tadi jaringane sempet antre padet bro, santai saiki wes aman kok.",
                "Waduh sorry bro, tadi sempet kepending antrean servere, saiki wes lancar maneh."
            ]
        },
        {
            regex: /(kena limit|limit token|api habis|kuota habis)/i,
            replies: [
                "Iyo mau sempet kena limit servere Google bro, tapi wes tak alihke jalur cadangan saiki wkwk.",
                "Tadi sempet overload kuotane, tapi wes tak benerke sistem rotasine kok bro, aman!",
                "Hooh mau sempet antre limit, saiki wes normal maneh jalurnya."
            ]
        },
        // 2. Urgent / Help
        {
            regex: /(urgent|darurat|tolong|bantuan segera)/i,
            replies: [
                "Yo, langsung omong wae bro! Kenapa ki?",
                "Siap bro, ada apa nih yang urgent? Ceritain wae.",
                "Yo bro, apa yang bisa tak bantu segera?"
            ]
        },
        // 3. Status & Normalcy Checks
        {
            regex: /(udah lancar|udah normal|gimana udah lancar|tes|test|cek)/i,
            replies: [
                "Wes lancar jaya bro! Monggo nek mau ngobrol maneh wkwk.",
                "Aman terkendali bro, wes normal tenan saiki.",
                "Lancar pol bro! Mau bahas opo ki?"
            ]
        },
        // 4. Everyday Casual Greetings & Status
        {
            regex: /^(lagi apa|lagi ngapain|lg apa|lg ngapain)\??$/i,
            replies: [
                "Lagi santai ki bro, karo ngecek sistem ben gak lemot wkwk. Kowe piye?",
                "Biasa bro, standby wae. Kowe lagi ngopo ki?",
                "Lagi nyante karo ngopi bro, lu sendiri lagi apa?"
            ]
        },
        // 5. Food & Hunger
        {
            regex: /(makan apa|laper|makan siang|makan malem|sarapan)/i,
            replies: [
                "Jajal soto seger opo mie ayam wae bro, pas tenan jam semene ki wkwk.",
                "Nasi padang opo penyetan enak ki bro nek pas luwe!",
                "Sego goreng babat opo bakso seger wae bro, marem!"
            ]
        },
        // 6. Fatigue & Work
        {
            regex: /(capek|lelah|kesel|pusing|lembur|banyak kerjaan)/i,
            replies: [
                "Wah istirahat sek gih bro, ojo diforsir tenan.. ngopi sek kono.",
                "Puk-puk bro, gawean pancen ra ono enteke, santai sek wae.",
                "Tarik nafas sek bro, tinggal turu sek nek wes ra kuat wkwk."
            ]
        },
        // 7. Single word laughs & confirmations
        {
            regex: /^(wkwk|haha|ngakak|lol|canda)$/i,
            replies: ["Wkwkwk 😂", "Malah ngakak lu wkwk", "Wkwk parah emang 😂"]
        },
        {
            regex: /^(oke|sip|siap|mantap|yoi|yo)$/i,
            replies: ["Sipp bro 👍", "Aman terkendali!", "Gasskeun! 🔥"]
        },
        {
            regex: /^(p|oi|oy|halo|hai)$/i,
            replies: ["Yo bro, ada apa nih?", "Oitt! Piye kabare?", "Yo! What's up?"]
        }
    ];

    static generateEmergencyReply(message) {
        const text = (message || '').trim();

        for (const pattern of this.patternRegistry) {
            if (pattern.regex.test(text)) {
                const choices = pattern.replies;
                return choices[Math.floor(Math.random() * choices.length)];
            }
        }

        // Generic friendly fallback that NEVER says "Bentar agak nge-lag"
        const defaultFallbacks = [
            "Iya bener juga sih wkwk. Terus kelanjutannya gimana bro?",
            "Wah ngono to, paham-paham.. terus piye maneh?",
            "Sip bro, tak pantau terus pokok e. Ada kabar baru gak?"
        ];
        return defaultFallbacks[Math.floor(Math.random() * defaultFallbacks.length)];
    }
}
