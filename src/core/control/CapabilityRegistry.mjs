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
        }
    });

    /**
     * Gets specification for a capability
     * @param {string} action
     * @returns {Object|null}
     */
    static get(action) {
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

        let out = `🛠️ *ARKA CAPABILITY REGISTRY*\n──────────────────\n`;
        out += `👤 Peran Kamu: *${userRole}*\n\n`;

        out += `📋 *Perintah Operasional & Otonom:*\n`;
        out += `• */status* / *cek status* — Status sistem\n`;
        out += `• */health* / *kondisi bot* — Cek kesehatan subsistem\n`;
        out += `• */memory* / *cek ram* — Audit penggunaan memori RAM\n`;
        out += `• */queue* / *antrean* — Cek antrean pesan\n`;
        out += `• */doctor* / *diagnosa bot* — Diagnosa masalah\n`;
        out += `• */uptime* — Lama waktu aktif\n`;
        out += `• */goals* / *roadmap* — Roadmap dan status goals aktif\n`;
        out += `• */open-loops* — Komitmen dan janji pending\n`;


        if (isAdmin) {
            out += `\n⚡ *Perintah Kontrol (Admin/Owner):*\n`;
            out += `• */safe-mode [on/off]* — Mode aman esensial\n`;
            out += `• */pause* / */resume* — Jeda/lanjut automasi\n`;
        }

        if (isOwner) {
            out += `• */restart* / *restart bot* — Graceful restart\n`;
            out += `• */shutdown* / *matikan bot* — Matikan proses\n`;
        }

        out += `\n_Perintah kontrol di atas dieksekusi secara deterministik tanpa kuota LLM._`;
        return out;
    }
}
