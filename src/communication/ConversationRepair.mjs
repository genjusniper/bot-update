// src/communication/ConversationRepair.mjs

export class ConversationRepair {
    static detectMisunderstanding(message) {
        const text = (message || '').toLowerCase();
        const repairPatterns = [
            /(lah|eh)\s*(bukan|salah)/,
            /(maksud (gue|gua|aku|saya)|bukan gitu)/,
            /(kok jadi|gak nyambung|salah nangkep)/,
            /(maksudnya bukan)/
        ];

        for (const pattern of repairPatterns) {
            if (pattern.test(text)) {
                return {
                    isRepair: true,
                    directive: 'MISUNDERSTANDING DETECTED: Akui salah tangkap dengan santai & natural (contoh: "WKWK iya salah nangkep gue 😭" atau "ohh maksudnya gitu, wkwk kirain apa"), lalu jawab maksud user yang sebenarnya tanpa basa-basi formal.'
                };
            }
        }

        return { isRepair: false, directive: '' };
    }
}
