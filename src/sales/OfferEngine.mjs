// src/sales/OfferEngine.mjs
// OfferEngine — Memilih dan menampilkan penawaran yang tepat berdasarkan kondisi lead

export const OfferType = {
    TRIAL:         'TRIAL',        // Paket percobaan untuk first-order
    WEEKLY_GROSS:  'WEEKLY_GROSS', // Harga grosir untuk pelanggan rutin
    ECO_PACK:      'ECO_PACK',     // Paket ekonomis untuk price-sensitive
    B2B_NEGOTIATE: 'B2B_NEGOTIATE',// Volume besar, negosiasi langsung
    REPEAT:        'REPEAT',       // Penawaran untuk pelanggan berulang
};

// Katalog produk santan (bisa dikustomisasi)
const PRODUCT_CATALOG = {
    santan_segar: {
        name: 'Santan Segar',
        unit: 'liter',
        priceRetail: 20000,      // harga eceran per liter
        priceWholesale: 15000,   // harga grosir per liter (>20L)
        priceB2B: 12000,         // harga B2B (>100L/minggu)
        minOrderTrial: 3,        // minimum liter untuk paket trial
        minOrderGross: 20,       // minimum liter untuk grosir
        minOrderB2B: 100,        // minimum liter untuk B2B
    },
};

const OFFER_TEMPLATES = {
    TRIAL: (cat) => ({
        type: 'TRIAL',
        headline: `Paket Coba Pertama`,
        detail: `${cat.minOrderTrial} liter santan segar — Rp ${(cat.minOrderTrial * cat.priceRetail).toLocaleString('id-ID')} (gratis ongkir area terdekat)`,
        hook: `kalau cocok, bisa langsung lanjut ke paket mingguan`,
        ctaDirective: `Tawarkan paket trial. Sebutkan bahwa tidak ada komitmen jangka panjang, coba dulu saja.`,
    }),
    WEEKLY_GROSS: (cat) => ({
        type: 'WEEKLY_GROSS',
        headline: `Paket Grosir Mingguan`,
        detail: `Mulai ${cat.minOrderGross}L/minggu — Rp ${cat.priceWholesale.toLocaleString('id-ID')}/liter (hemat ${Math.round((1 - cat.priceWholesale/cat.priceRetail) * 100)}% dari harga eceran)`,
        hook: `pengiriman terjadwal tiap minggu, bisa disesuaikan`,
        ctaDirective: `Tawarkan paket grosir mingguan. Tekankan kemudahan supply rutin dan penghematan harga.`,
    }),
    ECO_PACK: (cat) => ({
        type: 'ECO_PACK',
        headline: `Paket Ekonomis`,
        detail: `${cat.minOrderTrial}–${cat.minOrderGross}L dengan harga Rp ${cat.priceRetail.toLocaleString('id-ID')}/liter, fleksibel frekuensi`,
        hook: `cocok buat yang kebutuhannya belum terlalu rutin`,
        ctaDirective: `Tawarkan fleksibilitas. Lead price-sensitive perlu merasa tidak terikat komitmen besar dulu.`,
    }),
    B2B_NEGOTIATE: (cat) => ({
        type: 'B2B_NEGOTIATE',
        headline: `Harga Khusus Volume Besar`,
        detail: `Untuk kebutuhan di atas ${cat.minOrderB2B}L/minggu — harga bisa mulai dari Rp ${cat.priceB2B.toLocaleString('id-ID')}/liter, bisa negosiasi`,
        hook: `langsung dihandle tim kami`,
        ctaDirective: `Ini kandidat B2B — TRIGGER HUMAN HANDOFF. Bot cukup bilang "oke, saya teruskan ke tim kami ya untuk detail harganya".`,
    }),
    REPEAT: (cat) => ({
        type: 'REPEAT',
        headline: `Stok Ulang`,
        detail: `Hei, gimana stok santannya kak? Kalau mau ulang tinggal bilang — langsung kita proses`,
        hook: `pelanggan setia ada poin loyalitas juga hehe`,
        ctaDirective: `Lead ini pelanggan berulang. Sambut hangat, proses pesanan dengan cepat tanpa basa-basi berlebihan.`,
    }),
};

export class OfferEngine {
    /**
     * Pilih tipe penawaran yang tepat berdasarkan lead
     * @param {Object} lead - data lead dari CRM
     * @param {Object} opts - override manual
     * @returns {Object} { offerType, offer, directive }
     */
    static evaluate(lead, opts = {}) {
        const cat = PRODUCT_CATALOG.santan_segar;
        let offerType = opts.offerType || this._selectOfferType(lead);

        const templateFn = OFFER_TEMPLATES[offerType];
        const offer = templateFn ? templateFn(cat) : OFFER_TEMPLATES.TRIAL(cat);

        // Simpan offer type ke CRM
        if (lead?.phone) {
            const { LeadCRM } = require('./LeadCRM.mjs');
            LeadCRM.update(lead.phone, { offerType }).catch?.(() => {});
        }

        const directive = `=== OFFER ENGINE ===\nTipe penawaran: ${offerType}\n${offer.ctaDirective}\nDetail offer: ${offer.detail}\nHook: "${offer.hook}"\n====================`;

        return { offerType, offer, directive };
    }

    /**
     * Seleksi otomatis tipe penawaran berdasarkan skor & status lead
     */
    static _selectOfferType(lead) {
        if (!lead) return OfferType.TRIAL;

        if (lead.status === 'REPEAT') return OfferType.REPEAT;

        if (lead.score === 'VERY_HIGH') {
            // Katering besar → langsung B2B negotiation
            return OfferType.B2B_NEGOTIATE;
        }

        if (lead.status === 'ASKED_PRICE' || lead.status === 'INTERESTED') {
            if (lead.score === 'HIGH') return OfferType.WEEKLY_GROSS;
            return OfferType.ECO_PACK;
        }

        // Apakah price-sensitive? (sudah komplain harga)
        const history = lead.contactHistory || [];
        const hasPriceObjection = history.some(h =>
            h.message && (h.message.includes('mahal') || h.message.includes('kemahalan'))
        );
        if (hasPriceObjection) return OfferType.ECO_PACK;

        // Default: trial untuk first-order
        return OfferType.TRIAL;
    }

    /**
     * Format teks penawaran singkat untuk WhatsApp
     */
    static formatShortOffer(offerType) {
        const cat = PRODUCT_CATALOG.santan_segar;
        const templates = {
            TRIAL: `coba dulu ${cat.minOrderTrial}L — Rp ${(cat.minOrderTrial * cat.priceRetail).toLocaleString('id-ID')}, gratis ongkir`,
            WEEKLY_GROSS: `grosir mingguan mulai ${cat.minOrderGross}L — Rp ${cat.priceWholesale.toLocaleString('id-ID')}/L`,
            ECO_PACK: `fleksibel, mulai ${cat.minOrderTrial}L — Rp ${cat.priceRetail.toLocaleString('id-ID')}/L`,
            B2B_NEGOTIATE: `volume besar mulai ${cat.minOrderB2B}L/minggu — harga khusus, bisa negosiasi`,
            REPEAT: `stok ulang langsung — tinggal konfirmasi jumlah`,
        };
        return templates[offerType] || templates.TRIAL;
    }
}
