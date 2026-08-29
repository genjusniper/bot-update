// src/sales/AdaptiveSalesEngine.mjs
// AdaptiveSalesEngine — Belajar dari hasil outreach, prioritaskan yang efektif

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXP_DIR = path.join(__dirname, '../../data/experiments');

export class AdaptiveSalesEngine {
    static _expFile(experimentId) {
        if (!fs.existsSync(EXP_DIR)) fs.mkdirSync(EXP_DIR, { recursive: true });
        return path.join(EXP_DIR, `${experimentId}.json`);
    }

    static _load(experimentId) {
        const f = this._expFile(experimentId);
        if (!fs.existsSync(f)) return { variants: {}, updatedAt: null };
        try { return JSON.parse(fs.readFileSync(f, 'utf-8')); } catch { return { variants: {} }; }
    }

    static _save(experimentId, data) {
        data.updatedAt = new Date().toISOString();
        fs.writeFileSync(this._expFile(experimentId), JSON.stringify(data, null, 2), 'utf-8');
    }

    /**
     * Catat bahwa sebuah variasi sudah dipakai (impressions)
     * @param {string} experimentId - e.g. 'opening_surabaya_catering'
     * @param {string} variantId - e.g. 'variant_A'
     */
    static recordImpression(experimentId, variantId) {
        const data = this._load(experimentId);
        if (!data.variants[variantId]) data.variants[variantId] = { impressions: 0, replies: 0, interests: 0, orders: 0 };
        data.variants[variantId].impressions++;
        this._save(experimentId, data);
    }

    /**
     * Catat event positif (reply, interest, order)
     * @param {string} eventType - 'reply' | 'interest' | 'order'
     */
    static recordEvent(experimentId, variantId, eventType) {
        const data = this._load(experimentId);
        if (!data.variants[variantId]) return;
        data.variants[variantId][eventType] = (data.variants[variantId][eventType] || 0) + 1;
        this._save(experimentId, data);
    }

    /**
     * Pilih variasi terbaik saat ini (exploit) atau coba baru (explore)
     * Strategi: epsilon-greedy — 80% pilih terbaik, 20% acak
     * @param {string} experimentId
     * @param {string[]} availableVariants
     * @returns {string} variantId yang dipilih
     */
    static selectVariant(experimentId, availableVariants) {
        if (availableVariants.length === 0) return null;
        if (availableVariants.length === 1) return availableVariants[0];

        const data = this._load(experimentId);
        const stats = data.variants || {};

        // Kalau belum cukup data (< 5 impressions per variant), rotate
        const allHaveData = availableVariants.every(v => (stats[v]?.impressions || 0) >= 5);

        // Explore 20% waktu
        if (!allHaveData || Math.random() < 0.20) {
            return availableVariants[Math.floor(Math.random() * availableVariants.length)];
        }

        // Exploit — pilih yang reply rate-nya tertinggi
        let best = availableVariants[0];
        let bestRate = -1;
        for (const v of availableVariants) {
            const s = stats[v] || { impressions: 1, replies: 0 };
            const rate = (s.replies || 0) / (s.impressions || 1);
            if (rate > bestRate) { bestRate = rate; best = v; }
        }
        return best;
    }

    /**
     * Laporan performa semua variasi dalam satu experiment
     */
    static getReport(experimentId) {
        const data = this._load(experimentId);
        const variants = data.variants || {};
        const lines = [`=== A/B Experiment: ${experimentId} ===`];
        let bestRate = -1, bestVariant = null;

        for (const [vid, stats] of Object.entries(variants)) {
            const imp = stats.impressions || 0;
            const rep = stats.replies || 0;
            const rate = imp > 0 ? (rep / imp * 100).toFixed(1) : '–';
            lines.push(`  ${vid}: ${imp} sent, ${rep} replies (${rate}% reply rate)`);
            if (imp > 0 && rep / imp > bestRate) { bestRate = rep / imp; bestVariant = vid; }
        }
        if (bestVariant) lines.push(`→ Best performer: ${bestVariant} (${(bestRate*100).toFixed(1)}% reply rate)`);
        lines.push(`=====================================`);
        return lines.join('\n');
    }

    /**
     * Dapatkan experiment ID berdasarkan konteks outreach
     */
    static getExperimentId(businessType, city) {
        return `opening_${(city || 'unknown').toLowerCase()}_${(businessType || 'default').toLowerCase()}`;
    }

    /**
     * Laporan semua experiment yang ada
     */
    static getAllReports() {
        if (!fs.existsSync(EXP_DIR)) return 'Belum ada data experiment.';
        const files = fs.readdirSync(EXP_DIR).filter(f => f.endsWith('.json'));
        return files.map(f => this.getReport(f.replace('.json', ''))).join('\n\n');
    }
}
