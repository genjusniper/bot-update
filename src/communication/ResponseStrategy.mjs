// src/communication/ResponseStrategy.mjs

export class ResponseStrategy {
    static evaluate(message, relationship) {
        const text = (message || '').trim().toLowerCase();
        
        // 1. Single character or extreme short bursts (e.g. "p", "halo", "wkwk", "lah")
        if (text.length <= 4 || /^(p|o|y|halo|wkwk+|haha+|tes|ping)$/.test(text)) {
            return {
                mode: 'SHORT_ACKNOWLEDGE',
                target_length: 'short', // 2 - 8 words
                prompt_instruction: 'Pesan user sangat singkat/hanya sapaan/tertawa. Balas sangat singkat, santai, 1 kalimat pendek maksimal 5 kata.'
            };
        }

        // 2. Question / Inquiry
        if (text.includes('?') || /^(apa|siapa|kenapa|gimana|kapan|dimana|berapa|bisa gak)/.test(text)) {
            if (text.includes('kenapa') || text.includes('jelasin') || text.includes('bagaimana')) {
                return {
                    mode: 'EXPLAIN',
                    target_length: relationship.response_length === 'short' ? 'medium' : 'detailed',
                    prompt_instruction: 'Jelaskan poin intinya secara padat, lugas, tanpa bertele-tele.'
                };
            }
            return {
                mode: 'DIRECT_ANSWER',
                target_length: 'short_to_medium', // 5 - 15 words
                prompt_instruction: 'Jawab langsung intinya. Jangan pakai kalimat pembuka basa-basi.'
            };
        }

        // 3. Greeting / Casual banter
        if (/^(wkwk|anjir|wkwkwk|haha|gila|keren|mantap|asik)/.test(text)) {
            return {
                mode: 'JOKE_OR_BANTER',
                target_length: 'short',
                prompt_instruction: 'Ikuti vibe santai/tawa user, tanggapi dengan lelucon ringan atau celetukan natural.'
            };
        }

        // 4. Request / Help
        if (/^(tolong|bantu|bisa minta|coba|bikinin|carikan)/.test(text)) {
            return {
                mode: 'HELPFUL_EXECUTION',
                target_length: 'medium',
                prompt_instruction: 'Bantu selesaikan permintaan user secara proaktif dan to-the-point.'
            };
        }

        // 5. Default General Context
        return {
            mode: 'NATURAL_CONVERSATION',
            target_length: relationship.familiarity === 'close_friend' ? 'short' : 'medium',
            prompt_instruction: 'Tanggapin dengan gaya ngobrol santai seperti teman.'
        };
    }
}
