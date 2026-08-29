// src/sales/PersonalizedOutreachEngine.mjs
// PersonalizedOutreachEngine — Pesan pembuka yang personal per tipe bisnis
// Tidak ada template generik. Bot harus memahami bisnis sebelum bicara.

import { LeadQualificationEngine } from './LeadQualificationEngine.mjs';

// Template per tipe bisnis — minimal 3 variasi agar tidak monoton
const OPENING_TEMPLATES = {
    CATERING: [
        (b) => `Halo kak, lihat usaha katering ${b.name ? `"${b.name}"` : 'di sini'} — kira-kira sehari masak untuk berapa porsi ya? Lagi cari santan segar yang bisa supply rutin nggak?`,
        (b) => `Halo${b.ownerTitle ? ` ${b.ownerTitle}` : ''}, usahanya katering kan? Biasanya kebutuhan santan sehari ambil berapa? Kami lagi supply ke beberapa katering di ${b.location || 'area sini'}.`,
        (b) => `Halo kak, untuk katering${b.name ? ` ${b.name}` : ''} — santannya selama ini dari mana? Nanya-nanya aja, kalau mau coba alternatif bisa banget cerita dulu.`,
    ],
    WARUNG: [
        (b) => `Halo${b.ownerTitle ? ` ${b.ownerTitle}` : ''}, warungnya ada menu masakan ${b.description?.toLowerCase().includes('padang') ? 'Padang' : 'bersantan'} ya. Biasanya kebutuhan santan ambil harian atau dari supplier rutin?`,
        (b) => `Halo kak, sering lihat warung${b.name ? ` "${b.name}"` : ''} di sini. Santannya biasanya beli di mana? Kami bisa supply santan segar tiap hari kalau memang butuh.`,
        (b) => `Halo${b.ownerTitle ? ` ${b.ownerTitle}` : ''}, buat masakan${b.name ? ` di "${b.name}"` : ''} — biasanya pakai santan berapa liter per hari? Sekadar nanya aja hehe.`,
    ],
    MIXED: [
        (b) => `Halo kak, untuk${b.name ? ` "${b.name}"` : ' usaha'}nya — ada kebutuhan santan segar nggak? Kami lagi supply ke beberapa usaha makanan di ${b.location || 'area sini'}.`,
        (b) => `Halo${b.ownerTitle ? ` ${b.ownerTitle}` : ''}, kalau lagi cari santan yang fresh dan bisa supply rutin, boleh kita ngobrol dulu — nggak harus langsung order.`,
        (b) => `Halo kak, lagi nyari alternatif santan yang lebih terjamin freshnya nggak? Kami bisa supply ke${b.name ? ` ${b.name}` : ' usaha kamu'} — mau tanya kebutuhannya dulu.`,
    ],
    NON_COCONUT: [
        (b) => `Halo kak, untuk${b.name ? ` "${b.name}"` : ''} — ada menu yang butuh santan? Kami supply santan segar, mungkin bisa jadi opsi kalau ada kebutuhan.`,
    ],
    DEFAULT: [
        (b) => `Halo kak, kami lagi supply santan segar ke beberapa usaha makanan di ${b.location || 'area sini'}. Ada kebutuhan rutin nggak? Nggak harus langsung, bisa tanya-tanya dulu.`,
        (b) => `Halo${b.ownerTitle ? ` ${b.ownerTitle}` : ''}, kalau usahanya ada kebutuhan santan — kami bisa bantu supply. Boleh cerita dulu kebutuhannya berapa?`,
    ],
};

// Sapaan berdasarkan indikasi gender/gelar dari nama
const inferTitle = (name = '') => {
    const lower = name.toLowerCase();
    if (lower.includes('pak') || lower.includes('bapak') || lower.includes('mas') || lower.includes('bang')) return 'Pak';
    if (lower.includes('bu') || lower.includes('ibu') || lower.includes('mbak') || lower.includes('kak')) return 'Bu';
    return ''; // netral
};

export class PersonalizedOutreachEngine {
    /**
     * Generate pesan pembuka yang personal
     * @param {Object} lead - data lead (businessName, businessType, location, description, contactHistory)
     * @returns {Object} { message, template_type, personalization_factors }
     */
    static generate(lead) {
        const businessType = lead.businessType || 'DEFAULT';
        const templates = OPENING_TEMPLATES[businessType] || OPENING_TEMPLATES.DEFAULT;

        // Pilih variasi secara tidak urutan — pakai followUpCount sebagai seed
        const idx = (lead.followUpCount || 0) % templates.length;
        const templateFn = templates[idx];

        // Bangun konteks bisnis untuk template
        const context = {
            name: lead.businessName || '',
            location: lead.location || '',
            description: lead.notes || '',
            ownerTitle: inferTitle(lead.name || lead.businessName || ''),
        };

        const message = templateFn(context);

        return {
            message,
            templateType: businessType,
            personalizationFactors: {
                hasBusinessName: !!lead.businessName,
                hasLocation: !!lead.location,
                hasDescription: !!lead.notes,
                ownerTitle: context.ownerTitle || 'generic',
            },
        };
    }

    /**
     * Generate follow-up message yang berbeda dari pembuka
     */
    static generateFollowUp(lead, followUpNumber = 1) {
        const name = lead.businessName || 'kak';
        const messages = [
            `halo lagi${lead.businessName ? ` dari ${lead.businessName}` : ''} — kemarin sempet kirim pesan soal santan, sempat baca nggak? nggak maksa kok, cuma mau mastiin pesannya nyampe`,
            `halo kak, cuma mau tanya kabar — gimana kabar usahanya? kalau ada kebutuhan santan rutin, tinggal bilang ya`,
            `halo${lead.businessName ? ` ke ${lead.businessName}` : ''} — kami masih buka kalau mau coba sample dulu. nggak perlu komitmen apapun`,
        ];
        const msg = messages[(followUpNumber - 1) % messages.length];
        return { message: msg, isFollowUp: true, followUpNumber };
    }

    /**
     * Analisis apakah pesan yang dihasilkan cukup personal
     * (untuk quality check internal)
     */
    static scorePersonalization(message, lead) {
        let score = 0;
        if (lead.businessName && message.includes(lead.businessName)) score += 30;
        if (lead.location && message.includes(lead.location)) score += 20;
        if (message.match(/katering|warung|kedai|bakery|kue/i)) score += 25;
        if (!message.includes('kami menjual') && !message.includes('produk kami')) score += 25;
        return { score, isPersonalized: score >= 50 };
    }
}
