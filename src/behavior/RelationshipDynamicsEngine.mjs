// src/behavior/RelationshipDynamicsEngine.mjs
// RelationshipDynamicsEngine: Classifies contact familiarity (VIP, friend, acquaintance, stranger) and adapts style rules

export class RelationshipDynamicsEngine {
    static evaluate({ chatId, pushName, history = [] }) {
        let familiarity = 'ACQUAINTANCE'; // Default
        
        // 1. Hardcoded VIP / Owner classification
        const isVIP = chatId.includes('165145904984105') || chatId.includes('236322690191595');
        
        // 2. Dynamic classification based on history turns
        if (isVIP) {
            familiarity = 'CLOSE_FRIEND';
        } else if (history.length > 20) {
            familiarity = 'FRIEND';
        } else if (history.length <= 3) {
            familiarity = 'STRANGER';
        }

        const directives = [];
        directives.push(`- RELATIONSHIP FAMILIARITY: ${familiarity}`);

        if (familiarity === 'CLOSE_FRIEND') {
            directives.push(`- ATURAN HUBUNGAN: Sangat akrab (Teman Dekat). Gunakan gaya santai, bahasa Jawa ngoko campur Indonesia akrab, boleh bercanda/banter ringan secara bersahabat.`);
        } else if (familiarity === 'STRANGER') {
            directives.push(`- ATURAN HUBUNGAN: Orang Baru. Jaga kesopanan, ramah, to-the-point, JANGAN sok akrab, dan hindari penggunaan slang kasar/akrab.`);
        } else {
            directives.push(`- ATURAN HUBUNGAN: Kenalan/Teman Biasa. Gunakan gaya santai wajar, komunikatif, ramah.`);
        }

        return {
            familiarity,
            directive: `=== RELATIONSHIP DYNAMICS ENGINE ===\n${directives.join('\n')}\n====================================`
        };
    }
}
