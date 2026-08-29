// src/sales/LeadVerificationEngine.mjs
// LeadVerificationEngine — verifikasi bisnis sebelum outreach

import { BlacklistManager } from './BlacklistManager.mjs';
import { LeadCRM } from './LeadCRM.mjs';
import { ProductKnowledgeBase } from './ProductKnowledgeBase.mjs';

export const VerificationStatus = {
    VERIFIED:   'VERIFIED',    // lolos semua cek
    SUSPICIOUS: 'SUSPICIOUS',  // lolos tapi ada flag
    SKIP:       'SKIP',        // tidak lolos — jangan kontak
};

// Indikator bisnis tidak relevan atau berisiko
const SKIP_SIGNALS = [
    'laundry', 'bengkel', 'salon', 'barbershop', 'apotek', 'klinik', 'dokter',
    'toko hp', 'konter', 'servis', 'gadget', 'elektronik', 'pakaian', 'fashion',
    'properti', 'notaris', 'travel', 'ekspedisi', 'ojek', 'grab', 'gojek',
];

// Indikator bisnis relevan (menggunakan santan)
const RELEVANT_SIGNALS = [
    'katering', 'catering', 'masakan', 'makanan', 'kuliner', 'restoran', 'warung',
    'kedai', 'kafe', 'bakery', 'kue', 'jajanan', 'kantin', 'dapur', 'nasi',
    'soto', 'gulai', 'opor', 'rendang', 'padang', 'jawa', 'tradisional',
];

export class LeadVerificationEngine {
    /**
     * Verifikasi satu lead secara menyeluruh
     * @param {Object} lead - { phone, businessName, businessType, location, description }
     * @returns {Object} { status, score, riskFlags, coverageOk, recommendation }
     */
    static verify(lead) {
        const riskFlags = [];
        let score = 100; // mulai dari sempurna, lalu dikurangi

        // ── 1. Cek Blacklist (hard fail) ──────────────────────────
        if (BlacklistManager.isBlacklisted(lead.phone)) {
            return { status: VerificationStatus.SKIP, score: 0, riskFlags: ['BLACKLISTED'], coverageOk: false };
        }

        // ── 2. Cek duplikat di CRM ────────────────────────────────
        const existing = LeadCRM.load(lead.phone);
        if (existing) {
            riskFlags.push('DUPLICATE_CRM');
            return { status: VerificationStatus.SKIP, score: 0, riskFlags, coverageOk: false,
                recommendation: 'Lead sudah ada di CRM' };
        }

        // ── 3. Validasi format nomor ──────────────────────────────
        const digits = (lead.phone || '').replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 13) {
            riskFlags.push('INVALID_PHONE_FORMAT');
            score -= 60;
        }
        if (!digits.startsWith('62') && !digits.startsWith('08')) {
            riskFlags.push('NON_INDONESIAN_NUMBER');
            score -= 20;
        }

        // ── 4. Relevansi bisnis ───────────────────────────────────
        const text = `${lead.businessName || ''} ${lead.description || ''}`.toLowerCase();
        const isSkip = SKIP_SIGNALS.some(s => text.includes(s));
        const isRelevant = RELEVANT_SIGNALS.some(s => text.includes(s));

        if (isSkip) {
            return { status: VerificationStatus.SKIP, score: 0, riskFlags: ['IRRELEVANT_BUSINESS'],
                coverageOk: false, recommendation: 'Bisnis tidak relevan dengan produk santan' };
        }
        if (!isRelevant && lead.businessType !== 'CATERING' && lead.businessType !== 'WARUNG') {
            riskFlags.push('LOW_RELEVANCE_SIGNAL');
            score -= 15;
        }

        // ── 5. Coverage area ──────────────────────────────────────
        const coverageOk = ProductKnowledgeBase.coversArea(lead.location || '');
        if (!coverageOk) {
            riskFlags.push('OUT_OF_COVERAGE');
            score -= 25;
        }

        // ── 6. Nama bisnis tidak mencurigakan ─────────────────────
        if (!lead.businessName || lead.businessName.length < 3) {
            riskFlags.push('NO_BUSINESS_NAME');
            score -= 20;
        }

        // ── 7. Tentukan status ────────────────────────────────────
        let status;
        if (score >= 75 && riskFlags.length === 0) {
            status = VerificationStatus.VERIFIED;
        } else if (score >= 50) {
            status = VerificationStatus.SUSPICIOUS;
        } else {
            status = VerificationStatus.SKIP;
        }

        return {
            status,
            score: Math.max(0, score),
            riskFlags,
            coverageOk,
            recommendation: this._buildRecommendation(status, riskFlags, coverageOk),
        };
    }

    static _buildRecommendation(status, flags, coverageOk) {
        if (status === VerificationStatus.VERIFIED) return 'Siap dioutreach';
        if (status === VerificationStatus.SKIP) return `Skip: ${flags.join(', ')}`;
        const notes = [];
        if (!coverageOk) notes.push('di luar area coverage saat ini');
        if (flags.includes('LOW_RELEVANCE_SIGNAL')) notes.push('relevansi rendah, pakai pembuka netral');
        return `Bisa coba tapi perhatikan: ${notes.join(', ')}`;
    }

    /**
     * Filter batch lead — kembalikan yang lolos verifikasi
     */
    static filterBatch(leads) {
        const results = leads.map(l => ({ lead: l, ...this.verify(l) }));
        const verified   = results.filter(r => r.status === VerificationStatus.VERIFIED);
        const suspicious = results.filter(r => r.status === VerificationStatus.SUSPICIOUS);
        const skipped    = results.filter(r => r.status === VerificationStatus.SKIP);

        console.log(`[Verification] ✅ ${verified.length} VERIFIED, ⚠️ ${suspicious.length} SUSPICIOUS, ❌ ${skipped.length} SKIP`);
        return { verified, suspicious, skipped };
    }
}
