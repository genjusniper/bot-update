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
        const isAdmin = isOwner || userRole === 'ADMIN';

        let out = `🤖 *SALIM PERSONAL AI OS — MENU & FITUR*\n────────────────────────\n`;
        if (isOwner) {
            out += `👑 *Mode: Owner / Co-Pilot Utama*\n\n`;
            out += `⭐ *FITUR SUPER & CO-PILOT:*
• *Tanya Jawab & Troubleshooting:* Tanya bebas soal error PC, Windows (BCD, CMD, booting, dll). Jawaban runtut & lengkap.
• *Pencarian Web & Google Maps:* Ketik "cari tempat ngopi di Semarang" atau "lokasi bengkel" — langsung disertai link peta.
• *Pengingat Alami:* "Ingatkan besok jam 7 pagi ada meeting" atau "Ingatkan 10 menit lagi angkat jemuran".
• *Catat Keuangan:* "Catat pengeluaran 25rb makan siang" atau "Catat pemasukan 500rb dari proyek".
• *Generate Gambar AI (FLUX 4K):* "Gambar pemandangan senja di gunung format 4k".
• *Kirim Chat Outbound:* \`!chat <Nama/Nomor> <Pesan>\` (Kirim pesan WA lewat nomor bot).

🛡️ *PENGATURAN KEAMANAN & WHITELIST:*
• \`!whitelist\` — Lihat daftar kontak & grup yang diizinkan
• \`!izinkan <nomor/nama/link>\` — Buka izin chat agar dibalas AI
• \`!mute <nomor/nama/link>\` — Kunci/diamkan chat agar AI tidak membalas
• *Web Checklist UI:* Buka http://192.168.0.100:3000 di browser HP/PC untuk ceklis interaktif.

⚙️ *PERINTAH OPERASIONAL SISTEM:*
• */status* / *status* — Cek kondisi bot, socket & antrean
• */health* — Diagnosa kesehatan database, socket & AI
• */memory* / *cek ram* — Cek konsumsi RAM Termux
• */doctor* — Diagnosa kendala bot otomatis
• */ping* — Cek responsivitas bot
• */restart* — Restart bot secara aman
• */shutdown* — Matikan proses bot

_Ketik apa saja langsung atau gunakan perintah di atas!_`;
        } else {
            out += `• *Tanya Info:* Tanya info umum atau panduan
• */ping* — Tes koneksi
• */help* — Bantuan`;
        }

        return out;
    }
}
