// src/sales/DailySalesBrief.mjs
// DailySalesBrief — Laporan harian otomatis ke operator (07:00 WIB)

import { SalesAnalyticsEngine } from './SalesAnalyticsEngine.mjs';
import { LeadCRM } from './LeadCRM.mjs';
import { LeadQualificationEngine } from './LeadQualificationEngine.mjs';

const OPERATOR_PHONE = process.env.OPERATOR_PHONE || '';
const BRIEF_HOUR_WIB = parseInt(process.env.DAILY_BRIEF_HOUR || '7'); // jam WIB

export class DailySalesBrief {
    /**
     * Cek apakah sekarang saatnya mengirim laporan harian
     * Dipanggil dari interval/cron di aplikasi utama
     */
    static isDueNow() {
        const now = new Date();
        // WIB = UTC+7
        const wibHour = (now.getUTCHours() + 7) % 24;
        const wibMin  = now.getUTCMinutes();
        // Cek kalau jam tepat dan menit 0–4 (window 5 menit)
        return wibHour === BRIEF_HOUR_WIB && wibMin < 5;
    }

    /**
     * Generate dan kirim laporan ke operator
     * @param {Function} sendMessageFn
     */
    static async send(sendMessageFn) {
        if (!OPERATOR_PHONE) {
            console.warn('[DailySalesBrief] ⚠️  OPERATOR_PHONE tidak diset di .env');
            return;
        }

        const brief = this.generate();
        try {
            await sendMessageFn(OPERATOR_PHONE, brief);
            console.log(`[DailySalesBrief] 📧 Laporan harian terkirim ke operator`);
            SalesAnalyticsEngine.saveDailySnapshot();
        } catch (err) {
            console.error(`[DailySalesBrief] ❌ Gagal kirim laporan: ${err.message}`);
        }
    }

    /**
     * Generate teks laporan harian lengkap
     */
    static generate() {
        const funnel = SalesAnalyticsEngine.buildFunnel();
        const d = funnel.stages;
        const r = funnel.conversionRates;
        const hotLeads = this._getHotLeads();
        const handoffNeeded = LeadCRM.getByStatus('ORDER');
        const pipelineValue = this._estimatePipelineValue();

        const now = new Date();
        const wibDate = new Date(now.getTime() + 7 * 3600000);
        const dateStr = wibDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const lines = [
            `📊 *SALES BRIEF — ${dateStr}*`,
            ``,
            `🔍 Discovery       : ${d.discovered}`,
            `📤 Contacted       : ${d.contacted}`,
            `💬 Replied         : ${d.replied} (${r['Contacted → Replied'] || '0%'})`,
            `✨ Interested      : ${d.interested} (${r['Replied → Interested'] || '0%'})`,
            `🛒 Order           : ${d.ordered}`,
            `🔁 Repeat          : ${d.repeat}`,
            `❌ Lost            : ${d.lost}`,
            ``,
            `📈 Konversi overall: ${r['Overall (Lead → Order)'] || '0%'}`,
            `💰 Estimasi pipeline: Rp ${pipelineValue.toLocaleString('id-ID')}/minggu`,
        ];

        if (hotLeads.length > 0) {
            lines.push(`\n🔥 *Hot Lead hari ini:*`);
            hotLeads.forEach(l => {
                lines.push(`→ ${l.businessName} (${l.location || '-'}) — Status: ${l.status}`);
            });
        }

        if (handoffNeeded.length > 0) {
            lines.push(`\n⚡ *Perlu handoff manual (${handoffNeeded.length}):*`);
            handoffNeeded.slice(0, 3).forEach(l => {
                lines.push(`→ ${l.businessName} — siap order`);
            });
        }

        lines.push(`\nKetik \`laporan\` untuk detail lengkap, atau \`help\` untuk command lain.`);
        return lines.join('\n');
    }

    /**
     * Ambil hot leads (INTERESTED atau ASKED_PRICE dengan skor tinggi)
     */
    static _getHotLeads() {
        const interested = LeadCRM.getByStatus('INTERESTED');
        const askedPrice = LeadCRM.getByStatus('ASKED_PRICE');
        return [...interested, ...askedPrice]
            .filter(l => ['VERY_HIGH', 'HIGH'].includes(l.score))
            .slice(0, 5);
    }

    /**
     * Estimasi total nilai pipeline aktif (dalam Rp/minggu)
     */
    static _estimatePipelineValue() {
        const activePipeline = ['INTERESTED', 'ASKED_PRICE', 'THINKING', 'FOLLOW_UP']
            .flatMap(status => LeadCRM.getByStatus(status));

        return activePipeline.reduce((sum, lead) => {
            const est = LeadQualificationEngine.estimateRevenuePotential(lead);
            return sum + est;
        }, 0);
    }
}
