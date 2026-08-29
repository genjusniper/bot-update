// src/sales/AutonomousSalesPlanner.mjs
// AutonomousSalesPlanner — Terjemahkan target → rencana kerja konkret (UPGRADED PHASE 4)

import { LeadCRM } from './LeadCRM.mjs';
import { PipelineGapAnalyzer } from './PipelineGapAnalyzer.mjs';
import { LeadOpportunityScorer } from './LeadOpportunityScorer.mjs';
import { SalesTimeline } from './SalesTimeline.mjs';
import { SalesEventLedger } from './SalesEventLedger.mjs';

export class AutonomousSalesPlanner {
    
    /**
     * Buat rencana kerja berdasarkan gap analysis dan opportunity scoring
     */
    static createPlan(targetConfig = {}) {
        const {
            revenueTarget   = 5000000, 
            timeframeWeeks  = 1,
            city            = 'Surabaya',
            businessTypes   = ['CATERING', 'WARUNG', 'BAKERY']
        } = targetConfig;

        // 1. Dapatkan active leads
        const activeLeads = LeadCRM.getByStatus(null).filter(l => !['LOST', 'DO_NOT_CONTACT'].includes(l.status));

        // 2. Analisa Gap
        const gapAnalysis = PipelineGapAnalyzer.analyze(revenueTarget, activeLeads);
        
        // 3. Skor Lead menggunakan Opportunity Scorer
        const scoredLeads = activeLeads.map(lead => {
            const tl = SalesTimeline.getAll ? SalesTimeline.getAll(lead.phone) : [];
            const opp = LeadOpportunityScorer.score(lead, tl);
            return { ...lead, oppScore: opp.score, priorityLabel: opp.priorityLabel };
        });

        // 4. Bangun Langkah-langkah (Steps)
        const steps = [];

        // Prioritas 1: Tutup Tier 1 & 2 yang sudah merespons
        const hotProspects = scoredLeads.filter(l => 
            ['TIER_1_ENTERPRISE', 'TIER_2_HIGH_YIELD'].includes(l.priorityLabel) && 
            ['INTERESTED', 'ASKED_PRICE', 'NEGOTIATION'].includes(l.status)
        ).sort((a, b) => b.oppScore - a.oppScore);

        if (hotProspects.length > 0) {
            steps.push({
                priority: 1,
                action: 'CLOSE_HOT_LEADS',
                description: `Tutup ${hotProspects.length} prospek high-yield.`,
                leads: hotProspects.slice(0, 5).map(l => l.businessName)
            });
        }

        // Prioritas 2: Follow up Tier 3 & Tier 4 (Routine)
        const routineProspects = scoredLeads.filter(l => 
            ['TIER_3_STEADY', 'TIER_4_OPPORTUNISTIC'].includes(l.priorityLabel) && 
            ['THINKING', 'FOLLOW_UP'].includes(l.status)
        );

        if (routineProspects.length > 0) {
            steps.push({
                priority: 2,
                action: 'FOLLOW_UP_WARM',
                description: `Follow-up ${routineProspects.length} lead rutin yang butuh waktu pikir.`,
                count: routineProspects.length
            });
        }

        // Prioritas 3: Research & Discovery jika ada Gap
        if (!gapAnalysis.isSafe) {
            steps.push({
                priority: 3,
                action: 'DISCOVER_NEW_LEADS',
                description: `Cari dan research ${gapAnalysis.requiredDiscovery} lead baru di ${city} untuk menutup gap Rp ${gapAnalysis.gap.toLocaleString('id-ID')}.`,
                city,
                businessTypes,
                requiredDiscovery: gapAnalysis.requiredDiscovery
            });
        }

        const plan = {
            target: revenueTarget,
            timeframeWeeks,
            gapAnalysis,
            steps,
            summary: this._formatSummary(revenueTarget, gapAnalysis, steps)
        };

        // Catat ke ledger
        SalesEventLedger.record('AutonomousSalesPlanner', 'SYSTEM', 'PLAN_CREATED', { gap: gapAnalysis.gap, steps: steps.length });

        return plan;
    }

    static _formatSummary(target, gapAnalysis, steps) {
        const rp = (n) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;
        const lines = [
            `🎯 Target: ${rp(target)}`,
            `📊 Pipeline saat ini (Confirmed + Probable): ${rp(gapAnalysis.totalProjected)}`,
            !gapAnalysis.isSafe ? `⚡ Gap yang perlu diisi: ${rp(gapAnalysis.gap)}` : `✅ Pipeline sudah cukup untuk target!`,
            !gapAnalysis.isSafe ? `🔎 Butuh minimal ${gapAnalysis.requiredDiscovery} prospek baru dicari.` : '',
            ``,
            `📋 Rencana Hari Ini:`,
            ...steps.map((s, i) => `${i + 1}. [P${s.priority}] ${s.description}`),
        ];
        return lines.filter(Boolean).join('\n');
    }

    static parseTargetCommand(text) {
        const lower = text.toLowerCase();
        const result = {};

        const jutaMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*juta/);
        const ribMatch  = lower.match(/(\d+(?:[.,]\d+)?)\s*ribu/);
        if (jutaMatch) result.revenueTarget = parseFloat(jutaMatch[1].replace(',', '.')) * 1e6;
        else if (ribMatch) result.revenueTarget = parseFloat(ribMatch[1].replace(',', '.')) * 1e3;

        if (lower.includes('minggu ini') || lower.includes('minggu depan')) result.timeframeWeeks = 1;
        else if (lower.includes('bulan ini') || lower.includes('sebulan')) result.timeframeWeeks = 4;

        const kotaMatch = lower.match(/(?:di|daerah|area|kota)\s+(\w+)/);
        if (kotaMatch) result.city = kotaMatch[1].charAt(0).toUpperCase() + kotaMatch[1].slice(1);

        return result;
    }

    static isTargetCommand(text) {
        return /target\s+\d+/.test((text || '').toLowerCase());
    }
}
