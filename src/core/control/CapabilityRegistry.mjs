// src/core/control/CapabilityRegistry.mjs
// Central capability registry defining all operational commands, required roles, risk levels, and schemas

export class CapabilityRegistry {
    static CAPABILITIES = Object.freeze({
        STATUS: {
            action: 'STATUS',
            requiredRole: 'ADMIN',
            riskLevel: 'LOW',
            description: 'Melihat ringkasan status operasional, koneksi, dan uptime.'
        },
        HEALTH: {
            action: 'HEALTH',
            requiredRole: 'ADMIN',
            riskLevel: 'LOW',
            description: 'Memeriksa kesehatan subsistem (Database, AI Gateway, EventBus).'
        },
        MEMORY: {
            action: 'MEMORY',
            requiredRole: 'ADMIN',
            riskLevel: 'LOW',
            description: 'Memeriksa penggunaan memori RAM (RSS, Heap, External).'
        },
        QUEUE: {
            action: 'QUEUE',
            requiredRole: 'ADMIN',
            riskLevel: 'LOW',
            description: 'Melihat jumlah job dalam antrean (pending, processing, completed).'
        },
        DOCTOR: {
            action: 'DOCTOR',
            requiredRole: 'ADMIN',
            riskLevel: 'LOW',
            description: 'Diagnosa otomatis dan analisa masalah sistem.'
        },
        UPTIME: {
            action: 'UPTIME',
            requiredRole: 'ADMIN',
            riskLevel: 'LOW',
            description: 'Melihat lama bot telah berjalan sejak bootloader terakhir.'
        },
        RESTART: {
            action: 'RESTART',
            requiredRole: 'OWNER',
            riskLevel: 'CRITICAL',
            description: 'Graceful restart daemon tanpa kehilangan antrean atau state.'
        },
        SHUTDOWN: {
            action: 'SHUTDOWN',
            requiredRole: 'OWNER',
            riskLevel: 'CRITICAL',
            description: 'Mematikan proses bot secara aman.'
        },
        SAFE_MODE_ON: {
            action: 'SAFE_MODE_ON',
            requiredRole: 'OWNER',
            riskLevel: 'ELEVATED',
            description: 'Mengaktifkan safe-mode (menonaktifkan fitur eksperimental).'
        },
        SAFE_MODE_OFF: {
            action: 'SAFE_MODE_OFF',
            requiredRole: 'OWNER',
            riskLevel: 'ELEVATED',
            description: 'Menonaktifkan safe-mode dan mengembalikan operasi normal.'
        },
        PAUSE_AUTOMATION: {
            action: 'PAUSE_AUTOMATION',
            requiredRole: 'OWNER',
            riskLevel: 'ELEVATED',
            description: 'Menjeda eksekusi background scheduler dan tugas otonom.'
        },
        RESUME_AUTOMATION: {
            action: 'RESUME_AUTOMATION',
            requiredRole: 'OWNER',
            riskLevel: 'ELEVATED',
            description: 'Melanjutkan kembali tugas otonom dan background scheduler.'
        },
        CAPABILITIES: {
            action: 'CAPABILITIES',
            requiredRole: 'USER',
            riskLevel: 'LOW',
            description: 'Menampilkan daftar perintah dan kemampuan sistem.'
        },
        GOALS: {
            action: 'GOALS',
            requiredRole: 'USER',
            riskLevel: 'LOW',
            description: 'Menampilkan roadmap dan status goal aktif.'
        },
        OPEN_LOOPS: {
            action: 'OPEN_LOOPS',
            requiredRole: 'USER',
            riskLevel: 'LOW',
            description: 'Menampilkan komitmen dan janji yang belum selesai.'
        },
        PING: {
            action: 'PING',
            requiredRole: 'USER',
            riskLevel: 'LOW',
            description: 'Tes latensi dan detak jantung sistem.'
        },
        CPU: {
            action: 'CPU',
            requiredRole: 'ADMIN',
            riskLevel: 'LOW',
            description: 'Melihat statistik beban CPU dan event loop lag.'
        },
        STORAGE: {
            action: 'STORAGE',
            requiredRole: 'ADMIN',
            riskLevel: 'LOW',
            description: 'Melihat kapasitas penyimpanan disk dan ukuran basis data.'
        },
        CONNECTIONS: {
            action: 'CONNECTIONS',
            requiredRole: 'ADMIN',
            riskLevel: 'LOW',
            description: 'Melihat koneksi aktif WhatsApp, WebCockpit, dan EventBus.'
        },
        PROVIDERS: {
            action: 'PROVIDERS',
            requiredRole: 'ADMIN',
            riskLevel: 'LOW',
            description: 'Melihat status provider AI (Gemini, Groq, OpenAI, Local).'
        },
        MODELS: {
            action: 'MODELS',
            requiredRole: 'ADMIN',
            riskLevel: 'LOW',
            description: 'Melihat model AI yang aktif digunakan.'
        },
        TOOLS: {
            action: 'TOOLS',
            requiredRole: 'ADMIN',
            riskLevel: 'LOW',
            description: 'Melihat daftar tool dan subsistem automasi.'
        },
        LOGS: {
            action: 'LOGS',
            requiredRole: 'OWNER',
            riskLevel: 'LOW',
            description: 'Melihat baris log diagnostik terbaru.'
        },
        EVENTS: {
            action: 'EVENTS',
            requiredRole: 'ADMIN',
            riskLevel: 'LOW',
            description: 'Melihat ringkasan telemetry dan event bus.'
        },
        VERSION: {
            action: 'VERSION',
            requiredRole: 'USER',
            riskLevel: 'LOW',
            description: 'Menampilkan versi ARKA Personal AI OS.'
        },
        CONFIG: {
            action: 'CONFIG',
            requiredRole: 'OWNER',
            riskLevel: 'MEDIUM',
            description: 'Melihat konfigurasi aktif sistem.'
        },
        BACKUP: {
            action: 'BACKUP',
            requiredRole: 'OWNER',
            riskLevel: 'MEDIUM',
            description: 'Trigger backup database dan snapshot memori.'
        },
        RESTORE: {
            action: 'RESTORE',
            requiredRole: 'OWNER',
            riskLevel: 'CRITICAL',
            description: 'Restore snapshot database.'
        },
        UPDATE: {
            action: 'UPDATE',
            requiredRole: 'OWNER',
            riskLevel: 'HIGH',
            description: 'Memeriksa atau menerapkan pembaruan sistem.'
        },
        MAINTENANCE: {
            action: 'MAINTENANCE',
            requiredRole: 'OWNER',
            riskLevel: 'MEDIUM',
            description: 'Menjalankan rutinitas maintenance dan vacuum database.'
        },
        HELP: {
            action: 'HELP',
            requiredRole: 'USER',
            riskLevel: 'LOW',
            description: 'Menampilkan menu bantuan dan daftar fitur lengkap.'
        },
        MENU: {
            action: 'MENU',
            requiredRole: 'USER',
            riskLevel: 'LOW',
            description: 'Menampilkan menu perintah dan fitur sistem.'
        },
        LIST: {
            action: 'LIST',
            requiredRole: 'USER',
            riskLevel: 'LOW',
            description: 'Menampilkan daftar perintah dan fitur sistem.'
        },
        INFO: {
            action: 'INFO',
            requiredRole: 'USER',
            riskLevel: 'LOW',
            description: 'Melihat ringkasan informasi dan status bot.'
        }
    });

    /**
     * Gets specification for a capability
     * @param {string} action
     * @returns {Object|null}
     */
    static get(action) {
        if (!action) return null;
        return this.CAPABILITIES[String(action).toUpperCase()] || null;
    }

    /**
     * Lists all registered capabilities
     * @returns {Object[]}
     */
    static listAll() {
        return Object.values(this.CAPABILITIES);
    }

    /**
     * Formats capabilities card for user output
     * @param {string} [userRole='USER']
     * @returns {string}
     */
    static formatCard(userRole = 'USER') {
        const isOwner = userRole === 'OWNER';

        let out = `*SALIM PERSONAL AI OS — MENU & FITUR*\n───────────────────────────────\n`;
        if (isOwner) {
            out += `Mode: Owner & Master Co-Pilot\n\n`;
            out += `[ASISTEN PRIBADI & PRODUKTIVITAS]
- Tanya & Konsultasi: Diskusi ide, problem solving, atau tanya jawab umum.
- Cari Info & Lokasi: "Cari bengkel terdekat" / "Tempat ngopi di Semarang" (link maps).
- Pengingat Alami: "Ingatkan meeting besok jam 9" / "10 menit lagi jemuran".
- Catat Keuangan: "Catat pengeluaran 50rb makan siang" / "Pemasukan 500rb".
- AI Image Generator: "Gambar pemandangan senja cyberpunk format 4k".
- Chat Outbound: !chat <Nomor/Nama> <Pesan> (Kirim WA via nomor bot).

[BISNIS, TOKO & TRANSAKSI]
- /shop atau /katalog: Buka katalog produk & transaksi belanja.
- /wallet atau /saldo: Cek saldo kasir & dana perantara (rekber).
- /topup: Layanan top-up voucher game, pulsa & token PLN.
- /admin: Dashboard eksekutif penjualan & ringkasan omzet.

[MINI-APP & HIBURAN]
- /game atau /rpg: Mini-game petualangan Salim RPG.
- /miniapp: Buka antarmuka WebApp / GUI Webview di browser.

[KONTROL & PRIVASI CHAT]
- !whitelist: Cek daftar kontak & grup yang diizinkan.
- !izinkan / !mute: Buka izin chat atau diamkan kontak tertentu.
- /takeover: Ambil alih chat langsung (AI standby/hening).
- /resume_ai: Aktifkan kembali AI setelah Anda selesai chat.

[STATUS & OPERASIONAL SISTEM]
- /status: Cek kondisi server, koneksi socket WA & antrean pesan.
- /doctor: Diagnosa kendala bot otomatis.
- /memory atau /cek ram: Cek konsumsi memori/RAM.
- /ping: Cek responsivitas bot.
- Web Cockpit UI: http://192.168.0.100:3000

───────────────────────────────
Ketik perintah di atas atau langsung chat santai seperti biasa.`;
        } else {
            out += `Mode: Layanan Pelanggan & Publik\n\n`;
            out += `[BELANJA & PESANAN]
- /shop: Katalog produk & promo belanja.
- /tracking: Lacak status pengiriman kurir.

[DIGITAL & TOP-UP]
- /topup: Top-up voucher game, pulsa & token PLN.
- /wallet: Cek saldo akun & riwayat transaksi.

[HIBURAN & MINI-APP]
- /game: Mainkan mini-game RPG interaktif.
- /miniapp: Buka tampilan WebApp.

[BANTUAN & CS]
- /ticket: Layanan CS & tiket aduan komplain.
- /why: Transparansi alasan bot merekomendasikan produk.
- /rules: Syarat ketentuan, garansi & kebijakan privasi.
- /ping: Tes responsivitas bot.

───────────────────────────────
Tips: Anda juga bisa langsung chat santai seperti biasa:
"Mas mau pesan flanel merah ukuran L" atau "Cek ongkir ke Semarang".`;
        }

        return out;
    }
}
