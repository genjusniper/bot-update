/**
 * TenantKnowledgeHub.mjs
 * 
 * Multi-Tenant Custom Knowledge & Business Profile Hub.
 * Allows Salim to instantly adapt its brain to ANY client business:
 * - Online Shops (E-commerce / Catalog / Stock / Shipping)
 * - Vehicle Rentals (Cars / Bikes / Dates / Requirements)
 * - Clinics & Salons (Services / Booking Slots / Pricing)
 * - Service & Agencies (Consulting / Custom Quote)
 */

export class TenantKnowledgeHub {
    constructor() {
        this.tenants = new Map();
        this._initDefaultTemplates();
    }

    _initDefaultTemplates() {
        // Template 1: Toko Online (E-Commerce)
        this.registerTenant('toko_retail_demo', {
            businessName: 'Berkah Fashion Store',
            businessType: 'RETAIL_SHOP',
            tone: 'FRIENDLY_CASUAL',
            contactOwner: '6281234567890',
            currency: 'IDR',
            paymentAccounts: [
                { bank: 'BCA', accountNumber: '8410928371', holderName: 'Agus Salim' },
                { bank: 'Mandiri', accountNumber: '1370018291029', holderName: 'Agus Salim' },
                { bank: 'QRIS', notes: 'Ketik "minta qris" untuk barcode pembayaran' }
            ],
            catalog: [
                { id: 'PROD_01', name: 'Kemeja Flanel Premium', price: 145000, stock: 25, sizes: ['M', 'L', 'XL'] },
                { id: 'PROD_02', name: 'Celana Chino Slimfit', price: 185000, stock: 15, sizes: ['29', '30', '32', '34'] },
                { id: 'PROD_03', name: 'Kaos Polos Cotton Combed 30s', price: 55000, stock: 100, colors: ['Hitam', 'Putih', 'Navy'] }
            ],
            shippingInfo: {
                originCity: 'Semarang',
                couriers: ['J&T', 'JNE', 'SiCepat'],
                flatRateLocal: 10000
            },
            faqs: [
                { q: 'pengiriman', a: 'Pengiriman setiap hari Senin-Sabtu jam 16:00 WIB dari Semarang.' },
                { q: 'retur', a: 'Bisa tukar ukuran maksimal 2 hari setelah barang sampai, ongkir ditanggung pembeli.' },
                { q: 'alamat toko', a: 'Toko offline kami ada di Jl. Pandanaran No. 45, Semarang (buka jam 09.00 - 21.00).' }
            ]
        });

        // Template 2: Rental Kendaraan
        this.registerTenant('rental_mobil_demo', {
            businessName: 'Garuda Trans Rental',
            businessType: 'RENTAL_SERVICE',
            tone: 'PROFESSIONAL_POLITE',
            contactOwner: '6281234567890',
            currency: 'IDR',
            paymentAccounts: [
                { bank: 'BCA', accountNumber: '8410928371', holderName: 'Agus Salim' }
            ],
            catalog: [
                { id: 'CAR_AVANZA', name: 'Toyota Avanza 2023 (Lepas Kunci)', price: 350000, unit: '24 Jam' },
                { id: 'CAR_INNOVA', name: 'Innova Reborn Diesel + Driver', price: 750000, unit: '12 Jam' },
                { id: 'CAR_HIACE', name: 'Toyota Hiace Commuter 15 Seat + Driver + BBM', price: 1200000, unit: 'Full Day' }
            ],
            requirements: [
                'Foto KTP & SIM A asli yang masih berlaku',
                'Akun media sosial aktif / bukti tiket penerbangan atau reservasi hotel',
                'DP minimal 30% untuk mengunci jadwal armada'
            ],
            faqs: [
                { q: 'syarat lepas kunci', a: 'Syarat lepas kunci: Foto KTP, SIM A, KK/ID Pegawai, dan titip deposit/motor saat serah terima.' },
                { q: 'luar kota', a: 'Pemakaian luar kota dikenakan tambahan Rp 50.000/hari untuk lepas kunci.' }
            ]
        });

        // Template 3: Klinik & Salon Treatment
        this.registerTenant('klinik_salon_demo', {
            businessName: 'Glow Beauty Studio & Clinic',
            businessType: 'APPOINTMENT_SERVICE',
            tone: 'POLITE_WARM',
            catalog: [
                { id: 'SRV_FACIAL', name: 'Deep Cleansing Facial Acne Care', price: 175000, duration: '60 Menit' },
                { id: 'SRV_LASER', name: 'Brightening Laser Treatment', price: 450000, duration: '45 Menit' },
                { id: 'SRV_EYELASH', name: 'Natural Eyelash Extension', price: 120000, duration: '90 Menit' }
            ],
            operationalHours: 'Selasa - Minggu: 10:00 - 19:00 WIB (Senin Tutup)'
        });
    }

    /**
     * Register or update a business tenant profile
     */
    registerTenant(tenantId, config) {
        this.tenants.set(tenantId, {
            tenantId,
            updatedAt: Date.now(),
            ...config
        });
        return this.tenants.get(tenantId);
    }

    /**
     * Retrieve tenant profile
     */
    getTenant(tenantId) {
        return this.tenants.get(tenantId) || null;
    }

    /**
     * Search product or service across catalog
     */
    searchCatalog(tenantId, query) {
        const tenant = this.getTenant(tenantId);
        if (!tenant || !tenant.catalog) return [];

        const cleanQuery = (query || '').toLowerCase().trim();
        return tenant.catalog.filter(item => {
            const nameMatch = item.name.toLowerCase().includes(cleanQuery);
            const idMatch = item.id.toLowerCase().includes(cleanQuery);
            return nameMatch || idMatch;
        });
    }

    /**
     * Match FAQ in tenant knowledge
     */
    matchFaq(tenantId, text) {
        const tenant = this.getTenant(tenantId);
        if (!tenant || !tenant.faqs) return null;

        const clean = (text || '').toLowerCase();
        for (const faq of tenant.faqs) {
            if (clean.includes(faq.q.toLowerCase())) {
                return faq.a;
            }
        }
        return null;
    }

    /**
     * Format prompt context injection for the AI model
     */
    formatSystemPrompt(tenantId) {
        const tenant = this.getTenant(tenantId);
        if (!tenant) return '';

        const catalogStr = (tenant.catalog || [])
            .map(c => `- ${c.name}: Rp ${c.price.toLocaleString('id-ID')} (${c.stock ? 'Stok: ' + c.stock : c.unit || 'Layanan'})`)
            .join('\n');

        const paymentStr = (tenant.paymentAccounts || [])
            .map(p => `- ${p.bank}: ${p.accountNumber || p.notes} a/n ${p.holderName || ''}`)
            .join('\n');

        return `\n[PROFIL BISNIS AKTIF]\n` +
               `Nama Bisnis: ${tenant.businessName} (${tenant.businessType})\n` +
               `Gaya Bahasa: ${tenant.tone}\n` +
               `Daftar Produk / Layanan:\n${catalogStr}\n` +
               (paymentStr ? `Rekening Pembayaran:\n${paymentStr}\n` : '') +
               `Pedoman: Jawab pertanyaan pelanggan dengan ramah, jelas, dan arahkan ke pemesanan/booking rapi.`;
    }
}
