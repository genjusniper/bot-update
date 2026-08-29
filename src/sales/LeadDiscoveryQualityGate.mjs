// src/sales/LeadDiscoveryQualityGate.mjs
// LeadDiscoveryQualityGate — Filter lead dengan sistem scoring 0-100
// Hanya lead dengan skor >= PASS_THRESHOLD yang masuk pipeline outreach

import { BlacklistManager } from './BlacklistManager.mjs';
import { LeadCRM } from './LeadCRM.mjs';

const PASS_THRESHOLD = 60; // Minimum skor untuk lolos

// ── Dimensi 1: Relevansi Bisnis (max 40 poin) ─────────────────
const BUSINESS_RELEVANCE = [
    { patterns: ['katering', 'catering', 'jasa boga', 'pabrik kue', 'dapur produksi'], score: 40 },
    { patterns: ['warung nasi', 'warung padang', 'nasi uduk', 'warteg', 'soto', 'gulai', 'rendang', 'opor'], score: 35 },
    { patterns: ['warung makan', 'rumah makan', 'kedai', 'resto', 'lalapan', 'ayam goreng'], score: 30 },
    { patterns: ['bakery', 'toko kue', 'kue basah', 'snack', 'warung jajanan'], score: 25 },
    { patterns: ['kantin', 'toko sembako', 'warung campuran', 'kios'], score: 18 },
    { patterns: ['kafe', 'coffee shop'], score: 10 },
    // Bisnis tidak relevan
    { patterns: ['laundry', 'bengkel', 'salon', 'toko hp', 'apotek', 'klinik', 'toko baju'], score: 0 },
];

// ── Dimensi 2: Kualitas Kontak (max 30 poin) ──────────────────
// Dievaluasi dari format nomor & sumber
const CONTACT_QUALITY = {
    wa_verified:   30, // nomor WA yang terverifikasi (bisa dicek live)
    wa_likely:     20, // format nomor WA tapi belum verified
    phone_only:    10, // cuma telepon biasa
    no_contact:     0, // tidak ada kontak
};

// ── Dimensi 3: Coverage Area (max 20 poin) ────────────────────
// Diisi saat scoring berdasarkan targetCity dari discovery
const COVERAGE = {
    exact_match: 20, // kota sama persis
    nearby:      10, // kota tetangga / dalam 50km
    out_of_area:  0, // di luar area target
};

// ── Dimensi 4: Kelengkapan Data (max 10 poin) ─────────────────
const completenessScore = (rawLead) => {
    let s = 0;
    if (rawLead.businessName && rawLead.businessName.length > 3) s += 4;
    if (rawLead.description && rawLead.description.length > 20) s += 3;
    if (rawLead.location) s += 2;
    if (rawLead.sourceUrl) s += 1;
    return s;
};

export class LeadDiscoveryQualityGate {
    /**
     * Evaluasi satu lead dan kembalikan skor + keputusan
     * @param {Object} rawLead - { businessName, description, phone, location, sourceUrl }
     * @param {Object} opts - { targetCity, verifiedWA }
     * @returns {Object} { score, pass, breakdown, reason }
     */
    static evaluate(rawLead, opts = {}) {
        const text = `${rawLead.businessName || ''} ${rawLead.description || ''}`.toLowerCase();
        const targetCity = (opts.targetCity || '').toLowerCase();
        const location = (rawLead.location || '').toLowerCase();

        // ── 1. Cek blacklist dulu (hard block) ──────────────────
        if (rawLead.phone && BlacklistManager.isBlacklisted(rawLead.phone)) {
            return { score: 0, pass: false, reason: 'Blacklisted', breakdown: {} };
        }

        // ── 2. Cek duplikat di CRM ───────────────────────────────
        if (rawLead.phone && LeadCRM.load(rawLead.phone)) {
            return { score: 0, pass: false, reason: 'Duplikat — sudah ada di CRM', breakdown: {} };
        }

        // ── 3. Skor relevansi bisnis ─────────────────────────────
        let relevance = 15; // default medium jika tidak cocok
        for (const rule of BUSINESS_RELEVANCE) {
            if (rule.patterns.some(p => text.includes(p))) {
                relevance = rule.score;
                break;
            }
        }

        // ── 4. Skor kualitas kontak ──────────────────────────────
        let contact = CONTACT_QUALITY.no_contact;
        if (rawLead.phone) {
            const digits = rawLead.phone.replace(/\D/g, '');
            // Format 628xxx atau 08xxx yang valid (panjang 10-13 digit)
            if (digits.length >= 10 && digits.length <= 13) {
                contact = opts.verifiedWA ? CONTACT_QUALITY.wa_verified : CONTACT_QUALITY.wa_likely;
            } else {
                contact = CONTACT_QUALITY.phone_only;
            }
        }

        // ── 5. Skor coverage area ─────────────────────────────────
        let coverage = COVERAGE.out_of_area;
        if (!targetCity || location.includes(targetCity) || targetCity.includes(location)) {
            coverage = COVERAGE.exact_match;
        }

        // ── 6. Skor kelengkapan ───────────────────────────────────
        const completeness = completenessScore(rawLead);

        const score = relevance + contact + coverage + completeness;
        const pass = score >= PASS_THRESHOLD && relevance > 0;

        return {
            score,
            pass,
            reason: pass ? 'Lolos quality gate' : `Skor ${score} < threshold ${PASS_THRESHOLD}`,
            breakdown: { relevance, contact, coverage, completeness },
        };
    }

    /**
     * Filter batch lead — kembalikan hanya yang lolos gate
     * @param {Array} rawLeads
     * @param {Object} opts
     * @returns {Array} { lead, score, breakdown }[]
     */
    static filterBatch(rawLeads, opts = {}) {
        const results = rawLeads
            .map(lead => ({ lead, ...this.evaluate(lead, opts) }))
            .filter(r => r.pass)
            .sort((a, b) => b.score - a.score); // skor tertinggi duluan

        const skipped = rawLeads.length - results.length;
        console.log(`[QualityGate] ✅ ${results.length} lolos, ${skipped} di-skip dari ${rawLeads.length} total`);
        return results;
    }

    /**
     * Laporan skor untuk debugging
     */
    static explain(rawLead, opts = {}) {
        const res = this.evaluate(rawLead, opts);
        return [
            `Lead: ${rawLead.businessName}`,
            `Skor Total : ${res.score}/100 → ${res.pass ? '✅ LOLOS' : '❌ SKIP'}`,
            `  Relevansi : ${res.breakdown.relevance}/40`,
            `  Kontak    : ${res.breakdown.contact}/30`,
            `  Coverage  : ${res.breakdown.coverage}/20`,
            `  Kelengkapan: ${res.breakdown.completeness}/10`,
            `  Alasan    : ${res.reason}`,
        ].join('\n');
    }
}
