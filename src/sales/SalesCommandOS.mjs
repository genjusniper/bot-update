// src/sales/SalesCommandOS.mjs
// Sistem kontrol manual untuk operator (Mas Agus)

import { LeadCRM } from './LeadCRM.mjs';
import { SalesEventLedger } from './SalesEventLedger.mjs';
import { DealForecastEngine } from './DealForecastEngine.mjs';
import { SalesPolicyEngine } from './SalesPolicyEngine.mjs';

export class SalesCommandOS {
    
    /**
     * Memeriksa apakah pesan masuk adalah command dari admin/owner.
     * (Asumsi: di aplikasi sebenarnya, kita bisa filter berdasarkan sender === OWNER_NUMBER)
     * Untuk sekarang, asumsikan jika pesan dimulai dengan '!', maka itu command.
     */
    static isCommand(text) {
        return text && text.startsWith('!');
    }

    /**
     * Mengeksekusi command dan mengembalikan respon teks untuk operator
     */
    static execute(commandStr, targetPhone = null) {
        const parts = commandStr.trim().split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const phoneArg = parts[1] || targetPhone;

        switch (cmd) {
            case '!pause':
                if (!phoneArg) return '⚠️ Format: !pause <nomor_wa>';
                LeadCRM.updateStatus(phoneArg, 'DO_NOT_CONTACT', 'Di-pause oleh operator');
                SalesEventLedger.record('CommandOS', phoneArg, 'MANUAL_PAUSE');
                return `✅ Bot dihentikan (PAUSE) untuk nomor ${phoneArg}. AI tidak akan membalas.`;

            case '!resume':
                if (!phoneArg) return '⚠️ Format: !resume <nomor_wa>';
                // Kembalikan ke CONTACTED atau biarkan policy re-evaluate
                LeadCRM.updateStatus(phoneArg, 'CONTACTED', 'Di-resume oleh operator');
                SalesEventLedger.record('CommandOS', phoneArg, 'MANUAL_RESUME');
                return `✅ Bot diaktifkan kembali (RESUME) untuk nomor ${phoneArg}.`;

            case '!status':
                if (!phoneArg) return '⚠️ Format: !status <nomor_wa>';
                const lead = LeadCRM.load(phoneArg);
                if (!lead) return `⚠️ Lead ${phoneArg} tidak ditemukan di CRM.`;
                const forecast = DealForecastEngine.forecast(lead);
                const policy = SalesPolicyEngine.evaluate(lead, [], lead.status);
                
                return `📊 *Status Lead: ${lead.businessName || phoneArg}*\n` +
                       `- Status: ${lead.status}\n` +
                       `- Tipe: ${lead.businessType || 'UNKNOWN'}\n` +
                       `- Policy Action: ${policy.action} (${policy.reason})\n` +
                       `- Probabilitas Win: ${forecast.probability}%\n` +
                       `- Est. Value: Rp ${forecast.expectedValue.toLocaleString()}\n` +
                       `- Score: ${lead.score || 'N/A'}`;

            case '!handoff':
                if (!phoneArg) return '⚠️ Format: !handoff <nomor_wa>';
                LeadCRM.updateStatus(phoneArg, 'NEGOTIATION', 'Manual Handoff by Admin');
                SalesEventLedger.record('CommandOS', phoneArg, 'MANUAL_HANDOFF');
                return `✅ Menandai ${phoneArg} ke mode HANDOFF. Silakan ambil alih percakapan.`;

            case '!blacklist':
                if (!phoneArg) return '⚠️ Format: !blacklist <nomor_wa>';
                LeadCRM.update(phoneArg, { blacklist: true });
                LeadCRM.updateStatus(phoneArg, 'LOST', 'Blacklisted');
                SalesEventLedger.record('CommandOS', phoneArg, 'BLACKLISTED');
                return `⛔ Nomor ${phoneArg} masuk daftar hitam permanen.`;

            default:
                return `⚠️ Perintah tidak dikenal: ${cmd}\nGunakan: !pause, !resume, !status, !handoff, !blacklist`;
        }
    }
}
