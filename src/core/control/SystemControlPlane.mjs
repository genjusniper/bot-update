// src/core/control/SystemControlPlane.mjs
// Central operational executor for deterministic system commands (/status, /health, /doctor, /restart, etc.)

import { HealthManager } from './HealthManager.mjs';
import { DoctorEngine } from './DoctorEngine.mjs';
import { FeatureFlags } from './FeatureFlags.mjs';
import { GracefulShutdownManager } from './GracefulShutdownManager.mjs';
import { JobQueue } from '../../queue/JobQueue.mjs';

export class SystemControlPlane {
    /**
     * Executes a system command deterministically without calling LLM
     * @param {string} command - Normalized command name
     * @param {string[]} args - Command arguments
     * @param {Object} context - { waGateway, chatId, senderId, isOwner }
     * @returns {Promise<string>} Output response to send back to user
     */
    static async execute(command, args = [], context = {}) {
        const { waGateway, chatId } = context;

        switch (command) {
            case 'STATUS': {
                const health = await HealthManager.evaluate(waGateway);
                return HealthManager.formatStatusCard(health);
            }

            case 'HEALTH': {
                const health = await HealthManager.evaluate(waGateway);
                return HealthManager.formatHealthCard(health);
            }

            case 'DOCTOR':
            case 'PROBLEMS': {
                const diag = await DoctorEngine.diagnose(waGateway);
                return DoctorEngine.formatDoctorCard(diag);
            }

            case 'SAFE_MODE': {
                const action = (args[0] || '').toLowerCase();
                if (action === 'off' || action === 'disable') {
                    FeatureFlags.disableSafeMode();
                    return `🛡️ *SAFE-MODE DINONAKTIFKAN*
Seluruh subsistem AI dan observasi kembali aktif normal.`;
                }
                FeatureFlags.enableSafeMode();
                return `🛡️ *SAFE-MODE DIAKTIFKAN*
Subsistem berat & eksperimental dinonaktifkan sementara. Sistem berjalan dalam mode esensial (WhatsApp + Basic AI).`;
            }

            case 'QUEUE': {
                const health = await HealthManager.evaluate(waGateway);
                return `📦 *SALIM QUEUE STATUS*
──────────────────
• Status: ${health.queue.pending > 0 ? 'MEMPROSES' : 'BERSIH'}
• Pending (Antre): ${health.queue.pending}
• Processing: ${health.queue.processing}
• Selesai: ${health.queue.completed}
• Dead-Letter (Gagal): ${health.queue.deadLetter}`;
            }

            case 'UPTIME': {
                const health = await HealthManager.evaluate(waGateway);
                return `⏱️ *SALIM UPTIME:* ${health.uptime}`;
            }

            case 'RESTART': {
                // Acknowledge immediately before closing connections
                if (waGateway?.sock && chatId) {
                    await waGateway.sock.sendMessage(chatId, {
                        text: `🔄 *MEMULAI GRACEFUL RESTART...*
• Menyelesaikan antrean aktif
• Commit database SQLite
• Menyimpan snapshot

_Bot akan otomatis online kembali dalam beberapa detik._`
                    }).catch(() => {});
                }

                setTimeout(() => {
                    GracefulShutdownManager.shutdown({
                        reason: 'USER_COMMAND_RESTART',
                        waGateway,
                        timeoutMs: 8000
                    });
                }, 500);

                return null; // Handled asynchronously
            }

            case 'HELP': {
                return `🛠️ *SALIM CONTROL COMMANDS*
──────────────────
• */status* — Ringkasan status bot & koneksi
• */health* — Kondisi kesehatan tiap subsistem
• */doctor* — Diagnosa otomatis & analisis masalah
• */queue* — Cek jumlah antrean pesan
• */uptime* — Cek waktu aktif bot
• */safe-mode [on/off]* — Mode darurat / esensial
• */restart* — Graceful restart tanpa kehilangan pesan

_Perintah kontrol di atas dieksekusi secara deterministik tanpa kuota AI._`;
            }

            default:
                return `⚠️ Perintah "${command}" tidak dikenal. Ketik */help* untuk daftar perintah.`;
        }
    }
}
