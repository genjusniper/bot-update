// src/subsystems/social/SocialContextEngine.mjs
// SocialContextEngine: Consolidates and structures dynamic social dynamics per contact

export class SocialContextEngine {
    static evaluate({ text, chatId, pushName }) {
        const lower = (text || '').trim().toLowerCase();

        // 1. Determine Relationship Dynamic (baru kenal -> akrab -> teman dekat)
        let dynamic = 'kenal';
        if (chatId.includes('165145904984105') || chatId.includes('236322690191595')) {
            dynamic = 'teman dekat';
        }

        // 2. Format Context Structure
        return `=== SOSIAL CONTEXT ENGINE (DYNAMIC PROFILE) ===
- Nama Lawan Bicara: ${pushName || 'User'}
- Dinamika Hubungan: ${dynamic} (Bicara santai, akrab, tanpa kaku)
==============================================`;
    }
}
