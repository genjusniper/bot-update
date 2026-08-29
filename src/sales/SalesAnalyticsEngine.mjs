// src/sales/SalesAnalyticsEngine.mjs
// SalesAnalyticsEngine — Funnel analytics harian untuk VirtualSalesOS

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LeadCRM } from './LeadCRM.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ANALYTICS_DIR = path.join(__dirname, '../../data/analytics');

export class SalesAnalyticsEngine {
    static _ensureDir() {
        if (!fs.existsSync(ANALYTICS_DIR)) {
            fs.mkdirSync(ANALYTICS_DIR, { recursive: true });
        }
    }

    /**
     * Buat snapshot funnel saat ini dari data CRM
     * @returns {Object} funnel data
     */
    static buildFunnel() {
        const summary = LeadCRM.getSummary();
        const { total, byStatus } = summary;

        const funnel = {
            timestamp: new Date().toISOString(),
            total,
            stages: {
                discovered:   total,
                contacted:    (byStatus.CONTACTED || 0) + (byStatus.REPLIED || 0) + (byStatus.CURIOUS || 0) + (byStatus.INTERESTED || 0) + (byStatus.ASKED_PRICE || 0) + (byStatus.THINKING || 0) + (byStatus.ORDER || 0) + (byStatus.REPEAT || 0) + (byStatus.FOLLOW_UP || 0) + (byStatus.LOST || 0),
                replied:      (byStatus.REPLIED || 0) + (byStatus.CURIOUS || 0) + (byStatus.INTERESTED || 0) + (byStatus.ASKED_PRICE || 0) + (byStatus.THINKING || 0) + (byStatus.ORDER || 0) + (byStatus.REPEAT || 0),
                interested:   (byStatus.INTERESTED || 0) + (byStatus.ASKED_PRICE || 0) + (byStatus.ORDER || 0) + (byStatus.REPEAT || 0),
                asked_price:  (byStatus.ASKED_PRICE || 0) + (byStatus.ORDER || 0) + (byStatus.REPEAT || 0),
                ordered:      (byStatus.ORDER || 0) + (byStatus.REPEAT || 0),
                repeat:       byStatus.REPEAT || 0,
                lost:         byStatus.LOST || 0,
            },
            byStatus,
            conversionRates: {},
        };

        // Hitung conversion rate per tahap
        if (funnel.stages.discovered > 0) {
            const d = funnel.stages;
            funnel.conversionRates = {
                'Discovery → Contacted': this._rate(d.contacted, d.discovered),
                'Contacted → Replied':   this._rate(d.replied, d.contacted),
                'Replied → Interested':  this._rate(d.interested, d.replied),
                'Interested → AskPrice': this._rate(d.asked_price, d.interested),
                'AskPrice → Order':      this._rate(d.ordered, d.asked_price),
                'Order → Repeat':        this._rate(d.repeat, d.ordered),
                'Overall (Lead → Order)': this._rate(d.ordered, d.discovered),
            };
        }

        return funnel;
    }

    /**
     * Simpan snapshot funnel ke file JSON harian
     */
    static saveDailySnapshot() {
        this._ensureDir();
        const funnel = this.buildFunnel();
        const date = new Date().toISOString().split('T')[0];
        const file = path.join(ANALYTICS_DIR, `funnel_${date}.json`);

        let existing = [];
        if (fs.existsSync(file)) {
            try { existing = JSON.parse(fs.readFileSync(file, 'utf-8')); } catch {}
        }
        existing.push(funnel);

        fs.writeFileSync(file, JSON.stringify(existing, null, 2), 'utf-8');
        console.log(`[Analytics] 💾 Snapshot funnel disimpan: ${file}`);
        return funnel;
    }

    /**
     * Format laporan teks ringkas untuk dikirim ke operator via WA
     * @returns {string}
     */
    static formatReport() {
        const funnel = this.buildFunnel();
        const d = funnel.stages;
        const r = funnel.conversionRates;

        const lines = [
            `📊 *SALES FUNNEL REPORT*`,
            `_${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}_`,
            ``,
            `🔍 Total Lead Ditemukan : ${d.discovered}`,
            `📤 Sudah Dikontak       : ${d.contacted} (${r['Discovery → Contacted'] || '0%'})`,
            `💬 Sudah Balas          : ${d.replied} (${r['Contacted → Replied'] || '0%'})`,
            `✨ Tertarik             : ${d.interested} (${r['Replied → Interested'] || '0%'})`,
            `💰 Tanya Harga          : ${d.asked_price} (${r['Interested → AskPrice'] || '0%'})`,
            `🛒 Order                : ${d.ordered} (${r['AskPrice → Order'] || '0%'})`,
            `🔁 Repeat Order         : ${d.repeat}`,
            `❌ Tidak Minat (LOST)   : ${d.lost}`,
            ``,
            `📈 Konversi Keseluruhan : ${r['Overall (Lead → Order)'] || '0%'}`,
        ];

        return lines.join('\n');
    }

    /**
     * Hitung conversion rate sebagai string persentase
     */
    static _rate(numerator, denominator) {
        if (!denominator || denominator === 0) return '0%';
        return `${Math.round((numerator / denominator) * 100)}%`;
    }

    /**
     * Ambil top performing scores untuk laporan insight
     */
    static getTopLeads(n = 5) {
        const scoreOrder = ['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW', 'IGNORE'];
        const all = LeadCRM.getByStatus(null)
            .filter(l => l.status !== 'LOST')
            .sort((a, b) => scoreOrder.indexOf(a.score) - scoreOrder.indexOf(b.score));
        return all.slice(0, n);
    }
}
