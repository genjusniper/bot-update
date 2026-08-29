// src/sales/SalesExecutionOS.mjs
// SalesExecutionOS - The orchestrator of the entire sales funnel

import { LeadCRM } from './LeadCRM.mjs';
import { SalesConversationEngine } from './SalesConversationEngine.mjs';
import { ObjectionIntelligence } from './ObjectionIntelligence.mjs';
import { ProductKnowledgeBase } from './ProductKnowledgeBase.mjs';
import { OfferEngine } from './OfferEngine.mjs';
import { SalesAutopilotGovernor, GovAction } from './SalesAutopilotGovernor.mjs';
import { MessageRiskGuard, RiskLevel } from './MessageRiskGuard.mjs';
import { HumanHandoffEngine } from './HumanHandoffEngine.mjs';
import { SalesEventLedger } from './SalesEventLedger.mjs';
import { SalesTimeline } from './SalesTimeline.mjs';
import { LeadOpportunityScorer } from './LeadOpportunityScorer.mjs';
import { SalesPolicyEngine, PolicyAction } from './SalesPolicyEngine.mjs';
import { OutreachExperimentEngine } from './OutreachExperimentEngine.mjs';
import { ConversationRecoveryEngine } from './ConversationRecoveryEngine.mjs';

export class SalesExecutionOS {

    /**
     * Memproses chat masuk (Dipanggil oleh PersonalAIOS)
     * @returns {Object|null} Directive (string) untuk AI, atau null jika harus SILENT
     */
    static async processIncoming(chatId, inputSnippet, recentHistory = []) {
        try {
            const isSalesChat = LeadCRM.isSalesLead ? LeadCRM.isSalesLead(chatId) : false;
            if (!isSalesChat) return { directive: '', isSales: false };

            const lead = LeadCRM.load(chatId);
            const timeline = SalesTimeline.getAll ? SalesTimeline.getAll(chatId) : [];
            let salesDirective = '';

            console.log(`[SalesExecutionOS] 🛒 Memproses Lead: ${lead.businessName} (${lead.status})`);

            // 1. Deteksi Fase
            const salesEval = SalesConversationEngine.evaluate(inputSnippet, lead);
            
            // 2. Evaluasi Sales Policy (Batch 2)
            const policyDecision = SalesPolicyEngine.evaluate(lead, recentHistory, salesEval.detectedPhase);
            if (policyDecision.action === PolicyAction.SKIP) {
                console.log(`[SalesExecutionOS] 🛑 Policy SKIP: ${policyDecision.reason}`);
                return { directive: '', isSales: true, action: 'SILENT' };
            }
            if (policyDecision.action === PolicyAction.WAIT) {
                console.log(`[SalesExecutionOS] ⏳ Policy WAIT: ${policyDecision.reason}`);
                return { directive: '', isSales: true, action: 'SILENT' };
            }
            if (policyDecision.action === PolicyAction.PRIORITIZE) {
                salesDirective += `[POLICY: PRIORITIZE] Prospek ini dinilai PANAS. Prioritaskan konversi dan jangan sampai lepas.\n`;
            }

            // 3. Conversation Recovery (Jika Tidak Ada Input/Ghosting)
            if (!inputSnippet || inputSnippet.trim() === '') {
                const recoveryDecision = ConversationRecoveryEngine.evaluate(lead, recentHistory);
                if (recoveryDecision.action.startsWith('RECOVER')) {
                    salesDirective += `[CONVERSATION RECOVERY]\n${recoveryDecision.strategy}\n`;
                } else if (recoveryDecision.action === 'MARK_LOST') {
                    LeadCRM.updateStatus(chatId, 'LOST', recoveryDecision.reason);
                    return { directive: '', isSales: true, action: 'SILENT' };
                } else {
                    return { directive: '', isSales: true, action: 'SILENT' }; // WAIT
                }
            }

            // 4. Outreach Experiment (Jika NEW)
            if (lead.status === 'NEW') {
                const expDirective = OutreachExperimentEngine.getDirective(lead);
                if (expDirective) salesDirective += expDirective + '\n';
            }

            // 5. Cek FAQ Produk
            const productDirective = ProductKnowledgeBase.getDirective(inputSnippet);
            if (productDirective) salesDirective += productDirective + '\n';

            // 6. Evaluasi Governor (Legacy/Safety Net)
            const govDecision = SalesAutopilotGovernor.processIncoming(lead, inputSnippet, salesEval.detectedPhase);
            salesDirective += govDecision.directive + '\n';

            // 7. Eksekusi Keputusan Governor
            if (govDecision.action === GovAction.WAIT || 
                govDecision.action === GovAction.SKIP || 
                govDecision.action === GovAction.DO_NOT_CONTACT) {
                
                console.log(`[SalesExecutionOS] 🛑 Governor blocked: ${govDecision.action}`);
                return { directive: '', isSales: true, action: 'SILENT' };
            }

            salesDirective += salesEval.directive + '\n';

            // 5. Cek Keberatan (Objection)
            if (ObjectionIntelligence.isObjection(inputSnippet)) {
                const objection = ObjectionIntelligence.evaluate(inputSnippet, lead);
                salesDirective += objection.directive + '\n';
            }

            // 6. Tawarkan Produk (Jika siap)
            if (['INTERESTED', 'ASKED_PRICE', 'NEGOTIATION'].includes(salesEval.detectedPhase)) {
                const offerEval = OfferEngine.evaluate(lead);
                salesDirective += offerEval.directive + '\n';
            }

            // 7. Human Handoff (Jika closing/butuh negosiasi manusia)
            if (govDecision.action === GovAction.HUMAN_HANDOFF) {
                HumanHandoffEngine.execute(lead, inputSnippet, async (phone, msg) => {
                    console.log(`[SalesExecutionOS] 🔔 HANDOFF → ${phone}: ${msg.slice(0, 60)}...`);
                }).catch(e => console.warn('[SalesExecutionOS] Handoff error:', e.message));
                salesDirective += '\n[PANDUAN: Sampaikan ke prospek bahwa Tim Admin/Mas Agus akan segera mengambil alih untuk proses order.]\n';
            }

            // Catat event reply
            SalesEventLedger.record('SalesExecutionOS', chatId, 'PROCESSED_INCOMING', { phase: salesEval.detectedPhase });

            // Update Dynamic Score berdasarkan Timeline
            const newOpp = LeadOpportunityScorer.score(lead, timeline);
            LeadCRM.update(chatId, { score: newOpp.priorityLabel });

            return { directive: salesDirective, isSales: true, action: 'GENERATE' };

        } catch (e) {
            console.warn(`[SalesExecutionOS] ⚠️ Error processIncoming: ${e.message}`);
            return { directive: '', isSales: false, error: e.message };
        }
    }

    /**
     * Memvalidasi respons buatan AI sebelum dikirim (Dipanggil oleh PersonalAIOS)
     * @returns {boolean} true jika boleh dikirim, false jika diblokir
     */
    static validateOutgoing(chatId, draftResponse, recentHistory = []) {
        try {
            const isSalesChat = LeadCRM.isSalesLead ? LeadCRM.isSalesLead(chatId) : false;
            if (!isSalesChat) return true;

            const lead = LeadCRM.load(chatId);
            const risk = MessageRiskGuard.evaluate(draftResponse, lead, recentHistory);
            
            if (risk.riskLevel === RiskLevel.BLOCK) {
                console.warn(`[SalesExecutionOS] 🛑 RiskGuard BLOCK: ${risk.flags.join(', ')}`);
                SalesEventLedger.record('SalesExecutionOS', chatId, 'OUTGOING_BLOCKED', { flags: risk.flags });
                return false;
            } else if (risk.riskLevel === RiskLevel.WARN) {
                console.warn(`[SalesExecutionOS] ⚠️ RiskGuard WARN: ${risk.flags.join(', ')}`);
                SalesEventLedger.record('SalesExecutionOS', chatId, 'OUTGOING_WARNING', { flags: risk.flags });
            }

            SalesEventLedger.record('SalesExecutionOS', chatId, 'OUTGOING_APPROVED', {});
            return true;
        } catch (e) {
            console.warn(`[SalesExecutionOS] ⚠️ Error validateOutgoing: ${e.message}`);
            return true; // Failsafe open
        }
    }
}
