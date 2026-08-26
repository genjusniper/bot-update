// src/conversation/ConversationRepairEngine.mjs
// Misunderstanding & Conversation Repair Engine: Detects correction signals and adapts context state

export class ConversationRepairEngine {
    static evaluate({ text, chatId }) {
        const lower = (text || '').trim().toLowerCase();

        // Misunderstanding indicators
        const isCorrection = Boolean(
            lower.match(/\b(bukan itu|salah|kok malah|bukan gitu|gak gitu|ga gitu|maksudku|salah nangkep|ora ngono|salah ketik|salah paham)\b/i) ||
            lower.match(/^(bukan|salah|ga|gak|ora)$/i)
        );

        if (isCorrection) {
            return {
                detected: true,
                directive: `- CONVERSATION REPAIR DETECTED: Lawan bicara merasa kamu salah paham ("bukan itu", "salah", "kok malah"). 
  👉 MANDAT: Akui kesalahanmu secara santai (contoh: "ohh maap-maap salah nangkep aku wkwk", "oalah salah nangkep aku, maksudmu sing pie?"). Tanya kembali bagian mana yang mereka maksud secara ramah tanpa mempertahankan argumen sebelumnya.`
            };
        }

        return { detected: false, directive: '' };
    }
}
