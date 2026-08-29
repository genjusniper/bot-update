// src/sales/AutonomousPipelinePlanner.mjs
// Planner otonom yang mengejar "Outcome" (Expected Revenue), bukan sekadar "Aktivitas"

import { LeadCRM } from './LeadCRM.mjs';
import { PipelineGapAnalyzer } from './PipelineGapAnalyzer.mjs';
import { DealForecastEngine } from './DealForecastEngine.mjs';
import { NextBestActionEngine } from './NextBestActionEngine.mjs';
import { LeadHuntingIntelligence } from './LeadHuntingIntelligence.mjs';
import { SalesEventLedger } from './SalesEventLedger.mjs';

export class AutonomousPipelinePlanner {
    
    /**
     * Mengevaluasi pipeline dan mengeluarkan instruksi operasional untuk AI
     */
    static generateStrategicPlan(targetRevenue = 5000000) {
        const activeLeads = LeadCRM.getByStatus(null).filter(l => 
            !['LOST', 'DO_NOT_CONTACT'].includes(l.status) && !l.blacklist
        );

        const gap = PipelineGapAnalyzer.analyze(targetRevenue, activeLeads);
        
        let pipelineForecasts = [];
        for (const lead of activeLeads) {
            // Abaikan order yang sudah sukses dalam pipeline aktif
            if (lead.status === 'ORDER') continue;

            const forecast = DealForecastEngine.forecast(lead);
            const nba = NextBestActionEngine.getNBA(lead);
            
            pipelineForecasts.push({ 
                lead, 
                probability: forecast.probability, 
                expectedValue: forecast.expectedValue,
                nba
            });
        }
        
        // URUTKAN BERDASARKAN EXPECTED REVENUE TERBESAR (Bukan cuma probability)
        pipelineForecasts.sort((a, b) => b.expectedValue - a.expectedValue);

        const plan = {
            target: gap.targetRevenue,
            currentRevenue: gap.confirmedRevenue,
            gap: gap.gap,
            decisions: [],
            estimatedRequiredNewLeads: 0,
            huntingTarget: null
        };

        let priorityLevel = 1;
        for (const f of pipelineForecasts) {
            if (f.nba === 'WAIT' || f.nba === 'DROP' || f.nba === 'REVIEW_MANUAL') continue;
            
            plan.decisions.push({
                priority: priorityLevel++,
                action: f.nba,
                target: f.lead.phone,
                name: f.lead.businessName,
                expectedValue: f.expectedValue,
                reason: `Expected Revenue Rp ${f.expectedValue.toLocaleString()} (Prob: ${f.probability}%). NBA: ${f.nba}`
            });
        }

        // Jika masih ada gap, alokasikan sisa prioritas untuk Hunting
        if (gap.gap > 0) {
            const requiredLeads = Math.ceil(gap.gap / 300000 / 0.05); // Asumsi 300rb, 5% CV
            plan.estimatedRequiredNewLeads = requiredLeads;
            
            // Tanya hunting intelligence segmen apa yang paling potensial
            const huntingIntel = LeadHuntingIntelligence.getBestHuntingTargets(requiredLeads);
            plan.huntingTarget = huntingIntel.targetType;

            plan.decisions.push({
                priority: priorityLevel,
                action: 'HUNT_NEW_OPPORTUNITIES',
                target: 'OpportunityHunter',
                reason: `Gap Rp ${gap.gap.toLocaleString()}. Targetkan segmen [${huntingIntel.targetType}] karena win-rate tertinggi. Butuh ~${requiredLeads} leads baru.`
            });
        }

        SalesEventLedger.record('PipelinePlanner', 'SYSTEM', 'PLAN_GENERATED', { gap: gap.gap, requiredLeads: plan.estimatedRequiredNewLeads });

        return plan;
    }
}
