// src/sales/AutonomousSalesPlanner.mjs
// AutonomousSalesPlanner — Terjemahkan target → rencana kerja konkret

import { LeadCRM } from './LeadCRM.mjs';
import { RevenuePredictor } from './RevenuePredictor.mjs';
import { LeadScoringEngineV2 } from './LeadScoringEngineV2.mjs';
import { ProductKnowledgeBase } from './ProductKnowledgeBase.mjs';

export class AutonomousSalesPlanner {
    /**
     * Buat rencana kerja dari target omzet
     * @param {Object} target - { revenueTarget, timeframeWeeks, city, businessTypes }
     * @returns {Object} { plan, steps, estimatedLeadsNeeded, currentPipelineValue }
     */
    static createPlan(target = {}) {
        const {
            revenueTarget   = 5000000,  // Rp target
            timeframeWeeks  = 1,
            city            = 'Surabaya',
            businessTypes   = ['CATERING', 'WARUNG'],
        } = target;

        // Ambil semua lead aktif
        const allLeads = LeadCRM.getAll ? LeadCRM.getAll() : [];
        const activeLeads = Object.values(allLeads).filter(l => !['LOST'].includes(l.status));

        // Hitung pipeline value saat ini
        const currentPipelineValue = RevenuePredictor.estimatePipelineValue(activeLeads);
        const gap = Math.max(0, revenueTarget - currentPipelineValue);

        // Estimasi: rata-rata revenue per lead yang convert
        const product = ProductKnowledgeBase.findProduct('santan segar 1L');
        const avgOrderLiters = 20; // rata-rata order grosir
        const avgRevenuePerLead = avgOrderLiters * product.priceWholesale * 4; // 4 minggu
        const conversionRate = 0.15; // asumsi 15% dari lead yang dikontak → order

        const leadsNeededForGap = Math.ceil(gap / (avgRevenuePerLead * conversionRate));
        const discoveryTarget = Math.ceil(leadsNeededForGap / 0.60); // 60% lolos QualityGate

        // Buat langkah-langkah
        const steps = [];

        // HOT leads — prioritas utama
        const hotLeads = activeLeads
            .filter(l => ['INTERESTED', 'ASKED_PRICE'].includes(l.status))
            .sort((a, b) => LeadScoringEngineV2.calculate(b).dynamicScore - LeadScoringEngineV2.calculate(a).dynamicScore);
        if (hotLeads.length > 0) {
            steps.push({
                priority: 1,
                action: 'CLOSE_HOT_LEADS',
                description: `Tutup ${hotLeads.length} hot lead aktif. Ini cara tercepat menuju target.`,
                leads: hotLeads.slice(0, 5).map(l => l.businessName),
                estimatedRevenue: RevenuePredictor.estimatePipelineValue(hotLeads),
            });
        }

        // Follow-up pending
        const pendingFU = activeLeads.filter(l => ['THINKING', 'FOLLOW_UP'].includes(l.status));
        if (pendingFU.length > 0) {
            steps.push({
                priority: 2,
                action: 'FOLLOW_UP_WARM',
                description: `Follow-up ${pendingFU.length} lead yang sedang mempertimbangkan.`,
                count: pendingFU.length,
                estimatedRevenue: RevenuePredictor.estimatePipelineValue(pendingFU) * 0.3,
            });
        }

        // Perlu discovery baru
        if (gap > 0 && leadsNeededForGap > 0) {
            steps.push({
                priority: 3,
                action: 'DISCOVER_NEW_LEADS',
                description: `Cari ${discoveryTarget} lead baru di ${city} (target tipe: ${businessTypes.join(', ')}).`,
                city,
                businessTypes,
                discoveryTarget,
                estimatedRevenue: leadsNeededForGap * avgRevenuePerLead * conversionRate,
            });
        }

        const plan = {
            revenueTarget,
            timeframeWeeks,
            currentPipelineValue: Math.round(currentPipelineValue),
            gap: Math.round(gap),
            leadsNeededForGap,
            discoveryTarget,
            steps,
            summary: this._formatSummary({ revenueTarget, currentPipelineValue, gap, steps, timeframeWeeks }),
        };

        return plan;
    }

    static _formatSummary({ revenueTarget, currentPipelineValue, gap, steps, timeframeWeeks }) {
        const rp = (n) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;
        const lines = [
            `🎯 Target: ${rp(revenueTarget)} dalam ${timeframeWeeks} minggu`,
            `📊 Pipeline saat ini: ${rp(currentPipelineValue)}`,
            gap > 0 ? `⚡ Gap yang perlu diisi: ${rp(gap)}` : `✅ Pipeline sudah cukup untuk target!`,
            ``,
            `📋 Rencana (${steps.length} langkah):`,
            ...steps.map((s, i) => `${i + 1}. [P${s.priority}] ${s.description}`),
        ];
        return lines.join('\n');
    }

    /**
     * Parse perintah target dari operator
     * "target 5 juta minggu ini" → { revenueTarget: 5000000, timeframeWeeks: 1 }
     */
    static parseTargetCommand(text) {
        const lower = text.toLowerCase();
        const result = {};

        // Parse angka target
        const jutaMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*juta/);
        const ribMatch  = lower.match(/(\d+(?:[.,]\d+)?)\s*ribu/);
        if (jutaMatch) result.revenueTarget = parseFloat(jutaMatch[1].replace(',', '.')) * 1e6;
        else if (ribMatch) result.revenueTarget = parseFloat(ribMatch[1].replace(',', '.')) * 1e3;

        // Parse timeframe
        if (lower.includes('minggu ini') || lower.includes('minggu depan')) result.timeframeWeeks = 1;
        else if (lower.includes('bulan ini') || lower.includes('sebulan')) result.timeframeWeeks = 4;

        // Parse kota
        const kotaMatch = lower.match(/(?:di|daerah|area|kota)\s+(\w+)/);
        if (kotaMatch) result.city = kotaMatch[1].charAt(0).toUpperCase() + kotaMatch[1].slice(1);

        return result;
    }

    /**
     * Cek apakah pesan adalah perintah target dari operator
     */
    static isTargetCommand(text) {
        return /target\s+\d+/.test((text || '').toLowerCase());
    }
}
