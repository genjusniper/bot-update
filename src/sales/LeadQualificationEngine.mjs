// src/sales/LeadQualificationEngine.mjs
// LeadQualificationEngine — Menilai potensi setiap bisnis sebagai pembeli santan

export const QualificationScore = {
    VERY_HIGH: 'VERY_HIGH',   // katering, pabrik kue, rumah makan besar
    HIGH:      'HIGH',        // warung nasi, warung padang, kedai soto, warteg
    MEDIUM:    'MEDIUM',      // kantin, toko sembako, warung jajanan
    LOW:       'LOW',         // kafe kopi, restoran western/pizza
    IGNORE:    'IGNORE',      // laundry, toko HP, bengkel, salon, dll
};

const BUSINESS_RULES = [
    // VERY_HIGH — hampir pasti butuh santan rutin & volume besar
    { patterns: ['katering', 'catering', 'pabrik kue', 'bakery besar', 'dapur produksi', 'snack factory', 'kue basah', 'jasa boga', 'catering harian'], score: 'VERY_HIGH', type: 'CATERING', volume: '50-200L/minggu' },

    // HIGH — warung & kedai yang pasti masak pakai santan
    { patterns: ['warung nasi', 'warung padang', 'rumah makan padang', 'kedai soto', 'warung soto', 'warung mie', 'nasi uduk', 'nasi gurih', 'warung ayam', 'lalapan', 'warteg', 'warung tegal', 'nasi liwet', 'warung opor', 'kedai gulai', 'kedai rendang', 'dapur santan'], score: 'HIGH', type: 'WARUNG', volume: '10-50L/minggu' },

    // MEDIUM — kemungkinan pakai santan, tapi tidak pasti
    { patterns: ['kantin', 'toko sembako', 'warung kue', 'toko kue', 'warung jajanan', 'snack', 'kedai', 'kios makanan', 'gorengan', 'warung campuran', 'mini market'], score: 'MEDIUM', type: 'MIXED', volume: '5-20L/minggu' },

    // LOW — kemungkinan kecil pakai santan
    { patterns: ['kafe', 'coffee shop', 'restoran western', 'pizza', 'burger', 'steak', 'japanese', 'korean', 'sushi', 'ramen', 'pasta'], score: 'LOW', type: 'NON_COCONUT', volume: '0-5L/minggu' },

    // IGNORE — tidak relevan sama sekali
    { patterns: ['laundry', 'bengkel', 'salon', 'toko hp', 'toko handphone', 'toko elektronik', 'apotek', 'klinik', 'toko baju', 'boutique', 'barbershop', 'cuci motor', 'cuci mobil', 'fotocopy', 'percetakan'], score: 'IGNORE', type: 'IRRELEVANT', volume: '0' },
];

export class LeadQualificationEngine {
    /**
     * Kualifikasi satu lead berdasarkan nama bisnis & deskripsi
     * @param {Object} rawLead - { name, businessName, description, phone, location }
     * @returns {Object} QualifiedLead
     */
    static qualify(rawLead) {
        const text = `${rawLead.businessName || ''} ${rawLead.description || ''} ${rawLead.name || ''}`.toLowerCase();

        let matched = null;
        for (const rule of BUSINESS_RULES) {
            if (rule.patterns.some(p => text.includes(p))) {
                matched = rule;
                break;
            }
        }

        // Default kalau tidak cocok dengan rule apapun
        if (!matched) {
            matched = { score: 'MEDIUM', type: 'UNKNOWN', volume: '5-15L/minggu' };
        }

        return {
            phone: rawLead.phone || '',
            name: rawLead.name || 'Unknown',
            businessName: rawLead.businessName || rawLead.name || 'Unknown',
            businessType: matched.type,
            score: matched.score,
            potentialVolume: matched.volume,
            location: rawLead.location || '',
            source: rawLead.source || 'GOOGLE',
            notes: rawLead.description ? rawLead.description.slice(0, 200) : '',
            qualifiedAt: new Date().toISOString(),
        };
    }

    /**
     * Kualifikasi batch lead, filter yang IGNORE
     * @param {Array} rawLeads
     * @param {Object} opts - { minScore: 'HIGH' } untuk filter minimum score
     * @returns {Array} QualifiedLead[]
     */
    static qualifyBatch(rawLeads, { minScore = null } = {}) {
        const scoreOrder = ['IGNORE', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];
        const minIdx = minScore ? scoreOrder.indexOf(minScore) : 1; // default skip IGNORE

        return rawLeads
            .map(l => this.qualify(l))
            .filter(l => scoreOrder.indexOf(l.score) >= minIdx)
            .sort((a, b) => scoreOrder.indexOf(b.score) - scoreOrder.indexOf(a.score));
    }

    /**
     * Generate pesan pembuka yang sesuai jenis bisnis
     * @param {Object} qualifiedLead
     * @returns {string}
     */
    static generateOpeningMessage(qualifiedLead) {
        const name = qualifiedLead.businessName || qualifiedLead.name;
        const type = qualifiedLead.businessType;

        if (type === 'CATERING') {
            return `Halo kak, ini dari santan [nama usaha]. Biasanya katering butuh santan berapa liter per hari ya? Lagi nyari supplier yang bisa rutin nggak?`;
        }
        if (type === 'WARUNG') {
            return `Halo kak, kebetulan kami lagi supply santan segar ke warung-warung sekitar sini. Biasanya sehari masak pakai santan berapa banyak kak?`;
        }
        if (type === 'MIXED') {
            return `Halo kak, lagi nyari santan yang fresh nggak? Kami bisa supply rutin ke ${name} kalau memang butuh.`;
        }
        // Generic
        return `Halo kak, kami lagi supply santan segar ke usaha-usaha makanan sekitar sini. Kebetulan ada kebutuhan santan rutin nggak kak?`;
    }

    /**
     * Estimasi pendapatan potensial per minggu (harga santan ~ Rp 15.000/L)
     */
    static estimateRevenuePotential(qualifiedLead) {
        const volStr = qualifiedLead.potentialVolume || '0-0L/minggu';
        const match = volStr.match(/(\d+)-(\d+)/);
        if (!match) return 0;
        const avg = (parseInt(match[1]) + parseInt(match[2])) / 2;
        return avg * 15000; // Rp/minggu
    }
}
