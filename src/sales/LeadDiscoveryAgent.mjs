// src/sales/LeadDiscoveryAgent.mjs
// LeadDiscoveryAgent — Cari bisnis kuliner relevan via Google/WebSearchTool
// Output: RawLead[] → masuk LeadQualificationEngine → LeadCRM

import { WebSearchTool } from '../tools/web/WebSearchTool.mjs';
import { LeadQualificationEngine } from './LeadQualificationEngine.mjs';
import { LeadCRM } from './LeadCRM.mjs';

// Target bisnis untuk dicari
const SEARCH_TARGETS = [
    'katering harian',
    'warung nasi padang',
    'kedai soto',
    'warung makan',
    'usaha catering',
    'rumah makan',
    'nasi uduk',
    'warteg',
    'warung ayam',
    'pabrik kue basah',
];

// Regex untuk mengekstrak nomor WA/telepon dari teks
const WA_PATTERNS = [
    /(?:wa|whatsapp|hub|hubungi|kontak|telp?|hp)[:\s]?\+?62[\s-]?(\d[\d\s-]{8,13})/gi,
    /\+62[\s-]?(\d[\d\s-]{8,13})/g,
    /0[\s-]?8[\d\s-]{8,12}/g,
];

export class LeadDiscoveryAgent {
    /**
     * Jalankan discovery untuk satu kota
     * @param {Object} opts - { city: 'Surabaya', maxLeads: 20, minScore: 'HIGH' }
     * @returns {Array} QualifiedLead[]
     */
    static async discover({ city = 'Surabaya', maxLeads = 20, minScore = 'HIGH' } = {}) {
        console.log(`[LeadDiscovery] 🔍 Mulai mencari lead di: ${city} (max: ${maxLeads}, minScore: ${minScore})`);

        const rawLeads = [];
        const seenPhones = new Set();

        // Ambil beberapa jenis bisnis kuliner
        const targetsToSearch = SEARCH_TARGETS.slice(0, 5); // batasi 5 query per run
        for (const target of targetsToSearch) {
            if (rawLeads.length >= maxLeads * 2) break;

            const query = `${target} ${city} nomor WhatsApp`;
            console.log(`[LeadDiscovery]   → Query: "${query}"`);

            try {
                const res = await WebSearchTool.execute({ query });
                const results = res.results || [];

                for (const r of results) {
                    const text = `${r.title || ''} ${r.snippet || ''} ${r.url || ''}`;
                    const phones = this._extractPhones(text);

                    for (const phone of phones) {
                        if (seenPhones.has(phone)) continue;
                        seenPhones.add(phone);

                        rawLeads.push({
                            name: this._extractName(r.title || ''),
                            businessName: this._extractBusinessName(r.title || ''),
                            description: `${target} — ${(r.snippet || '').slice(0, 150)}`,
                            phone: this._normalizePhone(phone),
                            location: city,
                            source: 'GOOGLE',
                            sourceUrl: r.url || '',
                        });
                    }
                }
            } catch (err) {
                console.warn(`[LeadDiscovery]   ⚠️  Query gagal: ${err.message}`);
            }

            // Jeda antar query supaya tidak terlalu agresif
            await new Promise(r => setTimeout(r, 1500));
        }

        // Kualifikasi & filter
        const qualified = LeadQualificationEngine.qualifyBatch(rawLeads, { minScore })
            .slice(0, maxLeads);

        console.log(`[LeadDiscovery] ✅ Ditemukan ${qualified.length} lead (dari ${rawLeads.length} raw)`);

        // Simpan ke CRM (skip yang sudah ada)
        let created = 0;
        for (const lead of qualified) {
            if (lead.phone && !LeadCRM.isSalesLead(lead.phone)) {
                LeadCRM.create(lead);
                created++;
            }
        }

        console.log(`[LeadDiscovery] 💾 ${created} lead baru disimpan ke CRM`);
        return qualified;
    }

    /**
     * Ekstrak semua nomor telepon/WA dari teks
     */
    static _extractPhones(text) {
        const phones = new Set();
        for (const pattern of WA_PATTERNS) {
            let match;
            const re = new RegExp(pattern.source, pattern.flags);
            while ((match = re.exec(text)) !== null) {
                const raw = match[0].replace(/[^0-9+]/g, '');
                if (raw.length >= 9) phones.add(raw);
            }
        }
        return [...phones];
    }

    /**
     * Normalisasi nomor ke format internasional 628xxx
     */
    static _normalizePhone(raw) {
        const digits = raw.replace(/\D/g, '');
        if (digits.startsWith('62')) return `${digits}@s.whatsapp.net`;
        if (digits.startsWith('0')) return `62${digits.slice(1)}@s.whatsapp.net`;
        return `62${digits}@s.whatsapp.net`;
    }

    /**
     * Ekstrak nama dari judul hasil pencarian
     */
    static _extractName(title) {
        return title.replace(/\s*[-|]\s*.*/g, '').trim().slice(0, 60);
    }

    /**
     * Ekstrak nama bisnis (prioritaskan tanda kutip atau huruf besar beruntun)
     */
    static _extractBusinessName(title) {
        const quoted = title.match(/["']([^"']{3,40})["']/);
        if (quoted) return quoted[1];
        return title.split(/[-|]/)[0].trim().slice(0, 60);
    }

    /**
     * Kirim pesan pertama ke semua lead baru (status NEW)
     * @param {Function} sendMessageFn - async (phone, text) => void
     * @param {number} maxOutreach - batas per run
     */
    static async runOutreach(sendMessageFn, { maxOutreach = 10 } = {}) {
        const newLeads = LeadCRM.getByStatus('NEW').slice(0, maxOutreach);
        console.log(`[LeadDiscovery] 📤 Outreach ke ${newLeads.length} lead baru...`);

        for (const lead of newLeads) {
            const message = LeadQualificationEngine.generateOpeningMessage(lead);
            try {
                await sendMessageFn(lead.phone, message);
                LeadCRM.updateStatus(lead.phone, 'CONTACTED', 'Pesan pertama terkirim');
                LeadCRM.addContactEntry(lead.phone, { direction: 'OUT', message });
                console.log(`[LeadDiscovery]   ✅ Pesan dikirim ke: ${lead.businessName} (${lead.phone})`);
            } catch (err) {
                console.warn(`[LeadDiscovery]   ⚠️  Gagal kirim ke ${lead.phone}: ${err.message}`);
            }
            await new Promise(r => setTimeout(r, 3000)); // jeda 3 detik antar pesan
        }
    }
}
