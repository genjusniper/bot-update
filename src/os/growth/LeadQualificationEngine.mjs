// src/os/growth/LeadQualificationEngine.mjs
// ============================================================================
// SALIM OS - LEAD QUALIFICATION ENGINE
// Scores leads objectively and compiles structured briefs for Bos Agus
// ============================================================================

export class LeadQualificationEngine {
    /**
     * Scores a lead based on stated requirements
     */
    static qualifyLead({ contactName, phone, businessType, painPoint, hasBudgetSignal = false }) {
        let score = 50; // baseline for asking

        if (businessType && businessType !== 'UNKNOWN') score += 15;
        if (painPoint && painPoint.length > 10) score += 20;
        if (hasBudgetSignal) score += 15;

        score = Math.min(100, score);

        const dossier = {
            contactName: contactName || 'Calon Klien',
            phone: phone || '-',
            score,
            businessType: businessType || 'UMKM / Online Shop',
            painPoint: painPoint || 'Automasi Operasional Chat',
            urgency: score >= 80 ? 'TINGGI (Hot Lead)' : 'SEDANG',
            qualifiedAt: new Date().toISOString()
        };

        return {
            score,
            dossier,
            summaryCard: `🔥 *HOT LEAD TERKUALIFIKASI (Score: ${score}/100)*\n` +
                         `━━━━━━━━━━━━━━━━━━\n` +
                         `👤 *Nama Kontak:* ${dossier.contactName}\n` +
                         `📱 *Nomor/JID:* ${dossier.phone}\n` +
                         `🏢 *Jenis Bisnis:* ${dossier.businessType}\n` +
                         `🎯 *Masalah Utama:* ${dossier.painPoint}\n` +
                         `⚡ *Urgensi:* ${dossier.urgency}\n` +
                         `━━━━━━━━━━━━━━━━━━\n` +
                         `_Rekomendasi Tindakan: Sapa via WhatsApp pribadi untuk penawaran konsultasi custom._`
        };
    }
}
