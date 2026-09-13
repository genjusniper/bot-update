/**
 * BusinessOperatingSystemOrchestrator.mjs
 * 
 * Master Orchestrator for Salim Agentic Business Operating System (Level 2).
 * Unifies all 6 enterprise architectural layers:
 * 1. Cognitive Layer (Intelligence, Memory Graph, Personalization, Temporal, Uncertainty)
 * 2. Decision Layer (Business Goal, Plan Execution, Next Best Action, Lead DNA, Trust Score)
 * 3. Knowledge Layer (Truth/Evidence, Research Agent, Evidence Graph)
 * 4. Agent Layer (Multi-Agent Orchestrator, Agent Identity, Verification, Rollback)
 * 5. Security Layer (Prompt Injection Firewall, Policy Engine, Approval Integrity, Circuit Breaker)
 * 6. Operations Layer (Observability, Cost Intelligence, Outcomes/ROI, Learning Loop)
 * 
 * Principle:
 * "AI boleh berpikir luas, tetapi authority tetap sempit, deterministik, dan terkontrol."
 */

import { BusinessGoalEngine } from '../goal/BusinessGoalEngine.mjs';
import { PlanExecutionEngine } from '../plan/PlanExecutionEngine.mjs';
import { VerificationEngine } from '../verification/VerificationEngine.mjs';
import { RollbackEngine } from '../rollback/RollbackEngine.mjs';
import { PolicyEngine } from '../../security/PolicyEngine.mjs';
import { ApprovalIntegrityEngine } from '../../security/ApprovalIntegrityEngine.mjs';
import { AgentCircuitBreaker } from '../../security/AgentCircuitBreaker.mjs';
import { TrustScoreEngine } from '../trust/TrustScoreEngine.mjs';
import { UncertaintyEngine } from '../uncertainty/UncertaintyEngine.mjs';
import { ResearchAgent } from '../research/ResearchAgent.mjs';
import { EvidenceGraph } from '../truth/EvidenceGraph.mjs';
import { TemporalIntelligenceEngine } from '../temporal/TemporalIntelligenceEngine.mjs';
import { MultiAgentOrchestrator } from '../agent/MultiAgentOrchestrator.mjs';
import { AgentIdentityEngine } from '../agent/AgentIdentityEngine.mjs';
import { BusinessOutcomeEngine } from '../outcome/BusinessOutcomeEngine.mjs';
import { PromptInjectionFirewall } from '../../security/PromptInjectionFirewall.mjs';
import { ConversationIntelligenceEngine } from '../intelligence/ConversationIntelligenceEngine.mjs';
import { NextBestActionEngine } from '../intelligence/NextBestActionEngine.mjs';
import { TruthEvidenceEngine } from '../truth/TruthEvidenceEngine.mjs';
import { ConversationEvaluationEngine } from '../evaluation/ConversationEvaluationEngine.mjs';
import { ConversationMemoryGraph } from '../../memory/ConversationMemoryGraph.mjs';
import { ConversionIntelligenceEngine } from '../conversion/ConversionIntelligenceEngine.mjs';
import { LeadDNAEngine } from '../conversion/LeadDNAEngine.mjs';
import { AIObservabilityEngine } from '../observability/AIObservabilityEngine.mjs';
import { CostIntelligenceEngine } from '../cost/CostIntelligenceEngine.mjs';
import { PersonalizationEngine } from '../personalization/PersonalizationEngine.mjs';
import { NaturalConversationEngine } from '../natural/NaturalConversationEngine.mjs';
import { PersonalityGovernor } from '../personality/PersonalityGovernor.mjs';
import { LearningLoopEngine } from '../learning/LearningLoopEngine.mjs';
import { InboundOnlySalesGuard } from '../../security/InboundOnlySalesGuard.mjs';
import { TenantKnowledgeHub } from '../business/TenantKnowledgeHub.mjs';
import { OrderBookingExtractor } from '../business/OrderBookingExtractor.mjs';
import { PaymentProofVisionEngine } from '../business/PaymentProofVisionEngine.mjs';

export class BusinessOperatingSystemOrchestrator {
    constructor() {
        // Operational Engines (Singletons)
        this.memoryGraph = new ConversationMemoryGraph();
        this.conversion = new ConversionIntelligenceEngine();
        this.observability = new AIObservabilityEngine();
        this.cost = new CostIntelligenceEngine();
        this.learningLoop = new LearningLoopEngine();
        this.outcomes = new BusinessOutcomeEngine();
        this.evidenceGraph = new EvidenceGraph();
        this.rollback = new RollbackEngine();
        this.circuitBreaker = new AgentCircuitBreaker();
        this.multiAgent = new MultiAgentOrchestrator();
        this.researchAgent = new ResearchAgent();
        this.tenantHub = new TenantKnowledgeHub();
        this.orderExtractor = OrderBookingExtractor;
        this.paymentVerifier = PaymentProofVisionEngine;
    }

    /**
     * Primary Ingress Processor
     * Orchestrates end-to-end cognitive decision, security, and execution pipeline.
     */
    async process({ chatId, incomingText, isOwner = false, mediaOptions = {} }) {
        const startTime = Date.now();
        const cleanText = (incomingText || '').trim();

        // 1. SECURITY LAYER: Prompt Injection & Untrusted Input Firewall
        if (!isOwner && cleanText) {
            const injection = PromptInjectionFirewall.inspect(cleanText);
            if (!injection.clean && injection.blocked) {
                return {
                    handled: true,
                    deliveryPlan: {
                        text: injection.safeResponse,
                        bubbles: [injection.safeResponse],
                        typingDelays: [800],
                        reactionEmoji: '🛡️',
                        action: 'REPLY'
                    }
                };
            }
        }

        // 2. OWNER WORKFLOW: Natural Language Business Goal Breakdown (Explicit Goals only)
        if (isOwner && cleanText) {
            const parsedGoal = BusinessGoalEngine.parseGoal(cleanText);
            if (parsedGoal.matched) {
                const subgoalsList = parsedGoal.goal.subgoals
                    .map((s, idx) => `${idx + 1}. *${s.objective}* (Tool: \`${s.tool}\`)`)
                    .join('\n');

                const replyText = `🎯 *Rencana Eksekusi Bisnis (Agentic Goal Plan)*\n` +
                                  `📌 *Goal:* ${parsedGoal.goal.name}\n` +
                                  `💡 *Rasional:* ${parsedGoal.rationale}\n\n` +
                                  `*Tahapan Tindakan:*\n${subgoalsList}\n\n` +
                                  `Ketik *"gas jalankan"* untuk mengeksekusi tahapan pertama dengan approval dan verifikasi aman.`;

                this.outcomes.recordOutcome('TASK_AUTOMATED', { minutes: 20 });
                return {
                    handled: true,
                    deliveryPlan: {
                        text: replyText,
                        bubbles: [replyText],
                        typingDelays: [1000],
                        reactionEmoji: '📋',
                        action: 'REPLY'
                    }
                };
            }
            // For normal chat from Owner (e.g. "Oi", "Kenapa coba"), do NOT intercept!
            // Let PersonalAIOS master brain handle it with full persona and memory.
            return { handled: false };
        }

        // 3. EXTERNAL CLIENT / GROUP MENTIONS: Inbound-Only Sales Guard (Door Opened by User)
        if (!isOwner && cleanText) {
            const guard = InboundOnlySalesGuard.evaluate({
                chatId,
                incomingText: cleanText,
                isOutboundTrigger: false,
                isOwner: false
            });

            // A. If user said stop, acknowledge and halt permanently
            if (guard.action === 'STOP_PERMANENTLY' && guard.closingMessage) {
                return {
                    handled: true,
                    deliveryPlan: {
                        text: guard.closingMessage,
                        bubbles: [guard.closingMessage],
                        typingDelays: [800],
                        action: 'REPLY'
                    }
                };
            }

            // B. If NO commercial interest signal detected, DO NOT PITCH!
            // Return handled: false so Salim replies with normal personality via PersonalAIOS / SalimHub.
            if (guard.action === 'DO_NOT_PITCH' || guard.action === 'BLOCK' || guard.action === 'STOP_PERMANENTLY') {
                return { handled: false };
            }

            // C. User opened the door! Proceed as Inbound AI Sales Assistant
            const intel = ConversationIntelligenceEngine.analyze(cleanText);
            const leadDna = LeadDNAEngine.assess({ intel, isOwner: false });
            this.memoryGraph.updateNode(chatId, { intel, incomingText: cleanText });

            const bestAction = NextBestActionEngine.decide({ intel, leadDna });

            // Stop / Don't chase
            if (bestAction.action === 'STOP') {
                return {
                    handled: true,
                    deliveryPlan: {
                        text: 'Siap mas, terima kasih banyak waktunya. Sukses selalu buat usahanya!',
                        bubbles: ['Siap mas, terima kasih banyak waktunya. Sukses selalu buat usahanya!'],
                        typingDelays: [800],
                        action: 'REPLY'
                    }
                };
            }

            // Handoff to Bos Agus
            if (bestAction.action === 'HANDOFF' || guard.action === 'HUMAN_HANDOFF') {
                return {
                    handled: true,
                    deliveryPlan: {
                        text: 'Boleh banget mas, obrolan ini langsung saya teruskan ke Bos Agus ya biar bisa diskusi santai langsung.',
                        bubbles: ['Boleh banget mas, obrolan ini langsung saya teruskan ke Bos Agus ya biar bisa diskusi santai langsung.'],
                        typingDelays: [1000],
                        reactionEmoji: '🤝',
                        action: 'REPLY'
                    }
                };
            }

            // Discovery / Clarify
            if (bestAction.action === 'CLARIFY' || guard.action === 'ALLOW_DISCOVERY' || guard.action === 'ALLOW_CONVERSATION') {
                let clarifyText = 'Bisa banget. Sistemnya bisa disesuaikan dengan kebutuhan alur bisnismu (CS otomatis, rekap order, atau integrasi khusus). Biar pas, rencananya mau dipakai buat operasional apa mas?';
                if (intel.emotionalTone === 'FRUSTRATED') {
                    clarifyText = 'Paham banget kendala operasional kayak gitu memang bikin capek. Kalau boleh tahu, bottleneck paling beratnya di bagian balas chat yang numpuk atau rekap pesanannya?';
                }
                const shape = NaturalConversationEngine.shapeResponse({ incomingText: cleanText, intel });
                clarifyText = NaturalConversationEngine.polishText(clarifyText, shape);

                this.outcomes.recordOutcome('CUSTOMER_SERVED');
                return {
                    handled: true,
                    deliveryPlan: {
                        text: clarifyText,
                        bubbles: [clarifyText],
                        typingDelays: [1000],
                        reactionEmoji: '💡',
                        action: 'REPLY'
                    }
                };
            }

            // Pricing
            if (guard.action === 'ALLOW_PRICING_DISCUSSION') {
                const priceText = 'Bisa dibahas mas. Skema sewa/setup disesuaikan dengan skala kebutuhan—apakah butuh asisten CS otomatis, integrasi stok, atau approval workflow khusus. Usahanya saat ini bergerak di bidang apa mas?';
                return {
                    handled: true,
                    deliveryPlan: {
                        text: priceText,
                        bubbles: [priceText],
                        typingDelays: [1000],
                        reactionEmoji: '📋',
                        action: 'REPLY'
                    }
                };
            }

            // Demo
            if (guard.action === 'ALLOW_DEMO') {
                const demoText = 'Boleh mas! Mau coba tes langsung kemampuannya? Kamu bisa coba tanya stok, minta dibuatkan rencana kerja, atau simulasikan alur CS bisnis.';
                return {
                    handled: true,
                    deliveryPlan: {
                        text: demoText,
                        bubbles: [demoText],
                        typingDelays: [1000],
                        reactionEmoji: '✨',
                        action: 'REPLY'
                    }
                };
            }

            // E. Direct Order & Instant Invoice Generation
            if (this.orderExtractor.isOrderIntent(cleanText)) {
                const activeTenant = this.tenantHub.getTenant('toko_retail_demo');
                const orderData = this.orderExtractor.extractOrder({
                    text: cleanText,
                    catalog: activeTenant.catalog,
                    tenantName: activeTenant.businessName
                });

                if (orderData.hasItems && orderData.formattedInvoice) {
                    this.outcomes.recordOutcome('TRANSACTION_REPRESENTED', { revenueRp: orderData.totalAmount });
                    return {
                        handled: true,
                        deliveryPlan: {
                            text: orderData.formattedInvoice,
                            bubbles: [orderData.formattedInvoice],
                            typingDelays: [1200],
                            reactionEmoji: '🧾',
                            action: 'REPLY'
                        }
                    };
                }
            }
        }

        return { handled: false };
    }
}
