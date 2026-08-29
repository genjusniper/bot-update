// src/sales/AutonomousPipelinePlanner.mjs
// Planner otonom yang mengejar "Outcome", bukan sekadar "Aktivitas"

import { LeadCRM } from './LeadCRM.mjs';
import { PipelineGapAnalyzer } from './PipelineGapAnalyzer.mjs';
import { DealForecastEngine } from './DealForecastEngine.mjs';
import { ConversationRecoveryEngine } from './ConversationRecoveryEngine.mjs';
import { SalesEventLedger } from './SalesEventLedger.mjs';

export class AutonomousPipelinePlanner {
    
    /**
     * Mengevaluasi pipeline dan mengeluarkan instruksi operasional untuk AI
     */
    static generateStrategicPlan(targetRevenue = 5000000) {
        // 1. Dapatkan semua lead yang aktif (belum LOST / ORDER / DO_NOT_CONTACT)
        const activeLeads = LeadCRM.getByStatus(null).filter(l => 
            !['LOST', 'ORDER', 'DO_NOT_CONTACT'].includes(l.status) && !l.blacklist
        );

        // 2. Analisis Revenue & Gap
        const gap = PipelineGapAnalyzer.analyze(targetRevenue, activeLeads);
        
        // 3. Proyeksi Pipeline
        let pipelineForecasts = [];
        for (const lead of activeLeads) {
            const forecast = DealForecastEngine.forecast(lead);
            pipelineForecasts.push({ 
                lead, 
                probability: forecast.probability, 
                expectedValue: forecast.expectedValue 
            });
        }
        
        // Urutkan dari probability terbesar
        pipelineForecasts.sort((a, b) => b.probability - a.probability);

        const plan = {
            target: gap.targetRevenue,
            currentRevenue: gap.confirmedRevenue,
            gap: gap.gap,
            decisions: [],
            estimatedRequiredNewLeads: 0
        };

        // 4. Pengambilan Keputusan Strategis (Decision Engine)

        // Prioritas 1: Prospek Probabilitas Tinggi (>= 60%)
        const hotLeads = pipelineForecasts.filter(f => f.probability >= 60);
        for (const f of hotLeads) {
            plan.decisions.push({
                priority: 1,
                action: 'PRIORITIZE',
                target: f.lead.phone,
                name: f.lead.businessName,
                reason: `Probabilitas closing ${f.probability}% (${f.lead.status}) — Potensi Rp ${f.expectedValue.toLocaleString()}`
            });
        }

        // Prioritas 2: Prospek Probabilitas Sedang (30% - 59%)
        const warmLeads = pipelineForecasts.filter(f => f.probability >= 30 && f.probability < 60);
        for (const f of warmLeads) {
            if (f.lead.status === 'NEGOTIATION' || f.lead.status === 'ASKED_PRICE') {
                plan.decisions.push({
                    priority: 2,
                    action: 'NEGOTIATE_OR_VALUE',
                    target: f.lead.phone,
                    name: f.lead.businessName,
                    reason: `Pipeline macet di harga/nego. Fokuskan ke value produk.`
                });
            } else {
                plan.decisions.push({
                    priority: 2,
                    action: 'FOLLOW_UP',
                    target: f.lead.phone,
                    name: f.lead.businessName,
                    reason: `Giring pelan-pelan ke penawaran.`
                });
            }
        }

        // Prioritas 3: Recovery Leads (Ghosting)
        const ghostLeads = pipelineForecasts.filter(f => 
            f.probability < 30 && ['CONTACTED', 'REPLIED', 'NEW'].includes(f.lead.status)
        );
        for (const f of ghostLeads) {
            const recovery = ConversationRecoveryEngine.evaluate(f.lead, []);
            if (recovery.action.startsWith('RECOVER')) {
                plan.decisions.push({
                    priority: 3,
                    action: 'RECOVERY',
                    target: f.lead.phone,
                    name: f.lead.businessName,
                    reason: `Terdeteksi ghosting. Gunakan strategi: ${recovery.strategy}`
                });
            } else if (recovery.action === 'MARK_LOST') {
                plan.decisions.push({
                    priority: 5,
                    action: 'DROP',
                    target: f.lead.phone,
                    name: f.lead.businessName,
                    reason: `Lead sudah basi. Hapus dari fokus pipeline.`
                });
            }
        }

        // Prioritas 4: Menutup GAP dengan Opportunity Hunter (Eksplorasi)
        if (gap.gap > 0) {
            // Asumsi rata-rata conversion rate 5%, rata-rata order Rp 300.000
            // Untuk dapat Rp 3.000.000, butuh 10 closing. 10 closing / 5% = 200 leads.
            const requiredLeads = Math.ceil(gap.gap / 300000 / 0.05);
            plan.estimatedRequiredNewLeads = requiredLeads;
            
            plan.decisions.push({
                priority: 4,
                action: 'HUNT_NEW_OPPORTUNITIES',
                target: 'OpportunityHunter',
                reason: `Pipeline Gap Rp ${gap.gap.toLocaleString()}. Butuh hunting sekitar ${requiredLeads} prospek baru (estimasi 5% conversion rate).`
            });
        }

        // Log Plan ke Ledger (Untuk dipelajari oleh Learning Engine)
        SalesEventLedger.record('PipelinePlanner', 'SYSTEM', 'PLAN_GENERATED', { gap: gap.gap });

        return plan;
    }
}
