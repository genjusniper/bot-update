// src/communication/ContextualConversationIntelligence.mjs
// Local Intelligence (<1ms, 0 Token): Dynamic contextual awareness for Reels/TikTok, Voice Note acknowledgments, and Semarang local culture

export class ContextualConversationIntelligence {
    static evaluate({ text, hasAudio, hasImages, quotedContext, chatId }) {
        const input = (text || '').trim();
        const lower = input.toLowerCase();

        const directives = [];

        // 1. Social Video / Reels / TikTok Link Detection
        const isSocialReelLink = Boolean(lower.match(/(tiktok\.com|instagram\.com\/(reel|p|stories)|youtube\.com\/(shorts|watch)|youtu\.be)/i));
        if (isSocialReelLink) {
            // Check if user accompanied the link with text or sent link only
            const hasExtraText = input.replace(/https?:\/\/\S+/gi, '').trim().length > 3;
            if (!hasExtraText) {
                directives.push(`- REAKSI LINK VIDEO / REELS / TIKTOK: User mengirim link video/reels ke kamu tanpa teks. Tanggapi layaknya teman yang baru saja menonton video tersebut (contoh: "wkwk anjir lucu tenan kae", "relate banget cok", "iki sing wingi viral to wkwk"). Jangan berikan rangkuman artikel formal!`);
            } else {
                directives.push(`- DISKUSI LINK VIDEO: User mengirim link video disertai obrolan. Tanggapi pesan user secara nyambung dan santai.`);
            }
        }

        // 2. Voice Note (Audio) Natural Listener Acknowledgment
        if (hasAudio) {
            directives.push(`- RESPON VOICE NOTE: User baru saja mengirim rekaman suara (Voice Note/VN) ke kamu. Tunjukkan secara alami bahwa kamu baru mendengarkan VN tersebut (contoh awalan santai jika cocok: "bar tak rungokke VN-mu...", "wkwk rungokke swaramu...", atau langsung jawab inti pesannya dengan akrab).`);
        }

        // 3. Semarang Local Landmark & Outdoor Sense
        const isOutdoorOrHangout = Boolean(lower.match(/(ngopi|nongkrong|mangkat|panjat|climbing|camp|kemah|dolan|ketemu|semarang|udan|panas|mendung)/i));
        if (isOutdoorOrHangout) {
            directives.push(`- PENGETAHUAN LOKAL SEMARANG: Kamu tinggal di area Semarang. Pahami referensi tempat lokal seperti Tembalang, Simpang Lima, Pleburan, Ungaran, Bandungan, Brown Canyon, dll. Jika membahas nongkrong/outdoor saat hujan/malam, sesuaikan dengan suasana cuaca Semarang yang wajar.`);
        }

        // 4. Conversational Question-Answer Alignment
        if (quotedContext?.text) {
            directives.push(`- KONTEKS PESAN YANG DI-REPLY: User sedang me-reply pesan ini: "${quotedContext.text.slice(0, 100)}". Pastikan jawabanmu langsung menjawab atau menanggapi pesan yang di-reply tersebut secara tepat!`);
        }

        if (directives.length === 0) return '';

        return `=== KECERDASAN KONTEKSTUAL PERCAKAPAN (CONTEXTUAL INTELLIGENCE) ===
${directives.join('\n')}
================================================================`;
    }
}
