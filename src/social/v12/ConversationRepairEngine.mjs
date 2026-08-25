// src/social/v12/ConversationRepairEngine.mjs
// Detects misunderstandings, gracefully acknowledges mistakes and pivots context

export class ConversationRepairEngine {
    static isCorrection(message) {
        const text = (message || '').trim().toLowerCase();
        return Boolean(
            text.match(/^(bukan itu maksud|bukan gitu maksud|salah nangkep|maksud gue bukan|bukan yang itu|salah paham)/i) ||
            text.match(/^(maksudku bukan|dudu kuwi|salah bro|salah maksud)/i)
        );
    }

    static getRepairPromptDirective(userCorrection) {
        return `KOREKSI PERCAKAPAN: User mengoreksi bahwa pemahaman sebelumnya keliru ("${userCorrection}"). 
AKUI DENGAN AKRAB: Katakan dengan santai seperti "ohh wkwk sori gue salah nangkep tadi 😭", lalu langsung jawab sesuai maksud user yang sebenarnya secara tepat!`;
    }
}
