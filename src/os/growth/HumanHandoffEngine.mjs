// src/os/growth/HumanHandoffEngine.mjs
// ============================================================================
// SALIM OS - HUMAN HANDOFF & LEAD DISPATCH ENGINE
// Seamlessly routes high-intent prospects to Bos Agus Salim's private chat
// ============================================================================

export class HumanHandoffEngine {
    /**
     * Checks if message explicitly requests human/owner contact
     */
    static isExplicitHandoffRequest(text = '') {
        const lower = text.toLowerCase();
        return /(?:ngobrol\s+sama\s+owner|nomor.*?(?:mas\s+agus|owner)|kontak.*?(?:mas\s+agus|owner)|mau\s+nego|nego\s+harga|mau\s+ketemu|bisa\s+telepon|hubungi\s+saya)/i.test(lower);
    }

    /**
     * Formats the graceful handoff reply for the user
     */
    static getHandoffReplyForUser() {
        return (
            `🤝 *MENGHUBUNGKAN KE MAS AGUS SALIM (OWNER)*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `Biar penyesuaian fitur dan skema biayanya pas dengan kebutuhan tokomu (dan gak ada salah paham teknis), percakapan ini langsung saya teruskan ke Mas Agus Salim ya.\n\n` +
            `Mas Agus akan segera menyapa dan melanjutkan diskusi secara langsung. Terima kasih banyak atas minat dan diskusinya, Kak!`
        );
    }

    /**
     * Dispatches the hot lead summary directly to Bos Agus's WhatsApp
     */
    static async notifyOwner(waGateway, ownerLid, leadDossier) {
        if (!waGateway?.sock || !ownerLid) return;

        const message = 
            `🔔 *NOTIFIKASI PROSPEK BARU (SALIM GROWTH ENGINE)*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `Ada calon klien potensial yang tertarik dengan sistem bot bisnismu:\n\n` +
            `👤 *Kontak:* ${leadDossier.contactName}\n` +
            `📱 *ID/JID:* ${leadDossier.phone}\n` +
            `🏢 *Kebutuhan:* ${leadDossier.painPoint}\n` +
            `⭐ *Skor Peluang:* ${leadDossier.score}/100\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `_Silakan follow-up langsung melalui chat pribadi, Gus!_`;

        try {
            await waGateway.sock.sendMessage(ownerLid, { text: message });
            console.log(`[HumanHandoff] 🚀 Dispatched lead notification to Owner: ${leadDossier.contactName}`);
        } catch (err) {
            console.warn('[HumanHandoff] Failed to notify owner:', err.message);
        }
    }
}
