// src/sales/ProductKnowledgeBase.mjs
// ProductKnowledgeBase — DB produk santan: harga, MOQ, shelf life, dll

// ── PRODUCT CATALOG ────────────────────────────────────────────────────────
const PRODUCTS = [
    {
        id: 'santan_segar_1L',
        name: 'Santan Segar 1 Liter',
        description: 'Santan kelapa asli diperas segar, tanpa pengawet, tanpa campuran air berlebih.',
        priceRetail:    parseInt(process.env.PRICE_RETAIL    || '20000'),
        priceWholesale: parseInt(process.env.PRICE_WHOLESALE || '15000'),
        priceB2B:       parseInt(process.env.PRICE_B2B       || '12000'),
        minOrderRetail:    1,
        minOrderWholesale: 20,
        minOrderB2B:       100,
        unit: 'liter',
        shelfLifeHours: 24,
        storageNote: 'Simpan di kulkas, maksimal 24 jam. Tidak disarankan dibekukan.',
        deliveryLeadTimeHours: 4,
        availableFrom: '05:00',
        availableTo: '11:00',
        tags: ['segar', 'asli', 'tanpa pengawet', '1 liter'],
    },
    {
        id: 'santan_segar_500ml',
        name: 'Santan Segar 500 ml',
        description: 'Versi setengah liter, cocok untuk usaha kecil atau percobaan.',
        priceRetail:    parseInt(process.env.PRICE_RETAIL_500 || '11000'),
        priceWholesale: parseInt(process.env.PRICE_WHOLESALE_500 || '8500'),
        priceB2B:       parseInt(process.env.PRICE_B2B_500    || '7000'),
        minOrderRetail:    2,
        minOrderWholesale: 40,
        minOrderB2B:       200,
        unit: '500ml',
        shelfLifeHours: 24,
        storageNote: 'Sama seperti varian 1L.',
        deliveryLeadTimeHours: 4,
        availableFrom: '05:00',
        availableTo: '11:00',
        tags: ['segar', '500ml', 'kecil', 'trial'],
    },
];

// ── COVERAGE AREAS ──────────────────────────────────────────────────────────
const COVERAGE_AREAS = (process.env.COVERAGE_AREAS || 'Surabaya,Sidoarjo,Gresik')
    .split(',').map(a => a.trim().toLowerCase());

// ── FAQ ─────────────────────────────────────────────────────────────────────
const FAQ = [
    {
        q: ['berapa lama tahan', 'shelf life', 'simpan berapa lama', 'expired', 'kadaluarsa', 'awet berapa'],
        a: 'Santan segar kami tahan 24 jam di kulkas. Kalau lebih dari itu sebaiknya jangan dipakai ya.',
    },
    {
        q: ['ada pengawet', 'pengawet', 'bahan tambahan', 'murni', 'campuran'],
        a: 'Tidak ada pengawet sama sekali. 100% santan asli diperas dari kelapa segar.',
    },
    {
        q: ['jam berapa kirim', 'jam pengiriman', 'antar jam berapa', 'delivery jam'],
        a: 'Pengiriman mulai dari jam 05.00 dan harus selesai sebelum jam 11.00 pagi supaya santan masih segar.',
    },
    {
        q: ['minimal order', 'minimum order', 'moo', 'moq', 'berapa minimal', 'beli minimal'],
        a: 'Minimal untuk eceran 1 liter, untuk grosir minimal 20 liter, dan untuk kontrak B2B minimal 100 liter per minggu.',
    },
    {
        q: ['area pengiriman', 'bisa kirim ke', 'coverage', 'daerah mana', 'jangkauan', 'bisa sampai'],
        a: `Saat ini kami cover area ${COVERAGE_AREAS.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')}.`,
    },
    {
        q: ['harga grosir', 'harga besar', 'harga volume', 'kalau beli banyak'],
        a: `Harga grosir (min. 20L) Rp ${(parseInt(process.env.PRICE_WHOLESALE || '15000')).toLocaleString('id-ID')}/liter. Untuk kontrak mingguan > 100L ada harga khusus yang bisa didiskusikan.`,
    },
    {
        q: ['bisa coba dulu', 'sample', 'trial', 'percobaan'],
        a: 'Bisa banget. Ada paket percobaan 3–5 liter dulu supaya bisa langsung dipakai masak dan dibandingkan kualitasnya.',
    },
    {
        q: ['bisa dibekukan', 'frozen', 'freezer'],
        a: 'Tidak disarankan dibekukan karena bisa mempengaruhi tekstur dan kualitas santannya.',
    },
    {
        q: ['pembayaran', 'bayar', 'transfer', 'cod', 'bayar di tempat'],
        a: 'Bisa transfer bank atau bayar di tempat (COD). Untuk kontrak B2B ada opsi invoice bulanan.',
    },
];

// ────────────────────────────────────────────────────────────────────────────
export class ProductKnowledgeBase {
    /**
     * Cari semua produk
     */
    static getAllProducts() {
        return PRODUCTS;
    }

    /**
     * Cari produk berdasarkan id atau keyword
     */
    static findProduct(query = '') {
        const q = query.toLowerCase();
        return PRODUCTS.find(p =>
            p.id.includes(q) || p.name.toLowerCase().includes(q) ||
            p.tags.some(t => q.includes(t) || t.includes(q))
        ) || PRODUCTS[0];
    }

    /**
     * Jawab pertanyaan dari FAQ — natural language matching
     * @param {string} question
     * @returns {string|null}
     */
    static answer(question) {
        const q = (question || '').toLowerCase();
        for (const faq of FAQ) {
            if (faq.q.some(kw => q.includes(kw))) return faq.a;
        }
        return null;
    }

    /**
     * Cek apakah area tercover
     */
    static coversArea(location = '') {
        const loc = location.toLowerCase();
        return COVERAGE_AREAS.some(a => loc.includes(a) || a.includes(loc));
    }

    /**
     * Kalkulasi harga berdasarkan volume
     */
    static calcPrice(liters, product = null) {
        const p = product || PRODUCTS[0];
        if (liters >= p.minOrderB2B) {
            return { tier: 'B2B', pricePerLiter: p.priceB2B, total: p.priceB2B * liters };
        }
        if (liters >= p.minOrderWholesale) {
            return { tier: 'WHOLESALE', pricePerLiter: p.priceWholesale, total: p.priceWholesale * liters };
        }
        return { tier: 'RETAIL', pricePerLiter: p.priceRetail, total: p.priceRetail * liters };
    }

    /**
     * Cek apakah pertanyaan adalah FAQ (untuk AI directive)
     */
    static isFAQQuestion(text) {
        const all_kw = FAQ.flatMap(f => f.q);
        const lower = (text || '').toLowerCase();
        return all_kw.some(kw => lower.includes(kw));
    }

    /**
     * Format product sheet singkat untuk AI prompt
     */
    static formatSheet() {
        const p = PRODUCTS[0];
        return [
            '=== PRODUCT KNOWLEDGE ===',
            `Produk: ${p.name}`,
            `Harga Eceran  : Rp ${p.priceRetail.toLocaleString('id-ID')}/L (min. ${p.minOrderRetail}L)`,
            `Harga Grosir  : Rp ${p.priceWholesale.toLocaleString('id-ID')}/L (min. ${p.minOrderWholesale}L)`,
            `Harga B2B     : Rp ${p.priceB2B.toLocaleString('id-ID')}/L (min. ${p.minOrderB2B}L/minggu)`,
            `Shelf Life    : ${p.shelfLifeHours} jam di kulkas`,
            `Pengiriman    : Jam ${p.availableFrom}–${p.availableTo}`,
            `Coverage      : ${COVERAGE_AREAS.join(', ')}`,
            `=========================`,
        ].join('\n');
    }

    /**
     * Directive untuk AI ketika ada pertanyaan produk
     */
    static getDirective(text) {
        const answer = this.answer(text);
        if (answer) {
            return `=== PRODUCT KB ===\nJawab pertanyaan produk dengan info ini:\n${answer}\n==================`;
        }
        if (this.isFAQQuestion(text)) {
            return `=== PRODUCT KB ===\n${this.formatSheet()}\n==================`;
        }
        return '';
    }
}
