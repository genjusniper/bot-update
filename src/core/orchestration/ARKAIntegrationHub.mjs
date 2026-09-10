// src/core/orchestration/ARKAIntegrationHub.mjs
// Master End-to-End 20-Stage Pipeline — ARKA Personal AI OS V15.1
// Stage 13 now supports real LLM via injected aiGateway.
// Stage 7 now runs WebSearchEngine when depth requires research.
// PersistentMemoryGraph replaces in-memory-only CognitiveMemoryGraph.

import { universalCommandDispatcher2 } from '../commands/UniversalCommandDispatcher2.mjs';
import { promptShieldEngine } from '../security/PromptShieldEngine.mjs';
import { semanticIntentCache } from '../cache/SemanticIntentCache.mjs';
import { dynamicRateLimiter, RateTier } from '../rate/DynamicRateLimiter.mjs';
import { researchDepthController, ResearchDepthLevel } from '../cognition/ResearchDepthController.mjs';
import { persistentMemoryGraph } from '../memory/PersistentMemoryGraph.mjs';
import { personalOntology } from '../memory/PersonalOntology.mjs';
import { knowledgeFreshnessEngine } from '../memory/KnowledgeFreshnessEngine.mjs';
import { multiAgentFabric, AgentRole } from '../fabric/MultiAgentFabric.mjs';
import { agentDelegationEngine } from '../autonomy/AgentDelegationEngine.mjs';
import { contextWindowOptimizer } from '../context/ContextWindowOptimizer.mjs';
import { cognitiveBiasAuditor } from '../governance/CognitiveBiasAuditor.mjs';
import { coolnessGovernor2 } from '../personality/CoolnessGovernor2.mjs';
import { dynamicTextureEngine } from '../interaction/DynamicTextureEngine.mjs';
import { multiChannelSyncEngine, ChannelType, SyncScope } from '../sync/MultiChannelSyncEngine.mjs';
import { whatsAppSessionGuardian } from '../whatsapp/WhatsAppSessionGuardian.mjs';
import { incidentAutoHealer } from '../observability/IncidentAutoHealer.mjs';
import { backgroundTaskHarvester } from '../autonomy/BackgroundTaskHarvester.mjs';
import { EpistemicPartitionEngine } from '../reasoning/EpistemicPartitionEngine.mjs';
import { UncertaintyEngine } from '../reasoning/UncertaintyEngine.mjs';
import { CausalReasoningEngine } from '../reasoning/CausalReasoningEngine.mjs';
import { CognitivePlanner } from '../reasoning/CognitivePlanner.mjs';
import { SignalTelemetry } from '../signals/SignalTelemetry.mjs';
import { webSearchEngine } from '../research/WebSearchEngine.mjs';

export class ARKAIntegrationHub {
    constructor(options = {}) {
        this.commandDispatcher = options.commandDispatcher || universalCommandDispatcher2;
        this.promptShield      = options.promptShield || promptShieldEngine;
        this.semanticCache     = options.semanticCache || semanticIntentCache;
        this.rateLimiter       = options.rateLimiter || dynamicRateLimiter;
        this.researchDepth     = options.researchDepth || researchDepthController;
        this.memoryGraph       = options.memoryGraph || persistentMemoryGraph;
        this.ontology          = options.ontology || personalOntology;
        this.freshness         = options.freshness || knowledgeFreshnessEngine;
        this.multiAgentFabric  = options.multiAgentFabric || multiAgentFabric;
        this.agentDelegation   = options.agentDelegation || agentDelegationEngine;
        this.contextOptimizer  = options.contextOptimizer || contextWindowOptimizer;
        this.biasAuditor       = options.biasAuditor || cognitiveBiasAuditor;
        this.coolnessGovernor  = options.coolnessGovernor || coolnessGovernor2;
        this.dynamicTexture    = options.dynamicTexture || dynamicTextureEngine;
        this.syncEngine        = options.syncEngine || multiChannelSyncEngine;
        this.sessionGuardian   = options.sessionGuardian || whatsAppSessionGuardian;
        this.autoHealer        = options.autoHealer || incidentAutoHealer;
        this.taskHarvester     = options.taskHarvester || backgroundTaskHarvester;
        this.epistemicEngine   = options.epistemicEngine || EpistemicPartitionEngine;
        this.uncertaintyEngine = options.uncertaintyEngine || UncertaintyEngine;
        this.causalEngine      = options.causalEngine || CausalReasoningEngine;
        this.planner           = options.planner || CognitivePlanner;
        this.signalTelemetry   = options.signalTelemetry || SignalTelemetry;
        this.webSearch         = options.webSearch || webSearchEngine;

        // AIGateway — injected at boot from index or provided via options
        // null = use llmExecutor callback / stub fallback
        this.aiGateway = options.aiGateway || null;

        this.metrics = {
            totalIncoming: 0, commandsExecuted: 0, cacheHits: 0,
            securityBlocks: 0, rateThrottled: 0, delegatedExecutions: 0,
            llmExecutions: 0, epistemicPartitions: 0, searchesTriggered: 0,
            startedAt: Date.now()
        };
    }

    /**
     * Inject the AIGateway at runtime (called from index.mjs after gateway is ready)
     * @param {Object} gateway - AIGateway or AIGatewayObservable instance
     */
    setAIGateway(gateway) {
        this.aiGateway = gateway;
        console.log('[ARKAIntegrationHub] AIGateway injected:', gateway?.constructor?.name || 'unknown');
    }

    /**
     * Master 20-Stage pipeline
     * @param {Object} messageContext
     * @param {Function} [llmExecutor] - Optional override (used in tests / PersonalAIOS)
     */
    async processIncomingMessage(messageContext = {}, llmExecutor = null) {
        const startTime = Date.now();
        this.metrics.totalIncoming++;

        // Stage 1: Ingress normalization
        const {
            text = '',
            senderJid = 'user@s.whatsapp.net',
            senderName = 'User',
            chatId = senderJid,
            isGroup = false,
            userTier = isGroup ? RateTier.GROUP : RateTier.NORMAL,
            isOwner = userTier === RateTier.OWNER || userTier === 'OWNER',
            systemPrompt = 'Kamu adalah Salim / Agus Salim, pemilik nomor WhatsApp ini. Jawab santai, cool, deadpan, gaya santai.',
            history = [],
            images = [],
            audio = null,
            quotedContext = null,
            metadata = {},
            waGateway = null
        } = messageContext;

        const cleanRawText = String(text || '').trim();

        // Stage 2: Global Command Pre-emption
        const isControlCmd = this.commandDispatcher.detectCommand(cleanRawText);
        if (isControlCmd) {
            const dispatchRes = await this.commandDispatcher.dispatch(cleanRawText, {
                senderJid, senderName, chatId, isGroup, isOwner, userTier, metadata, waGateway
            });
            if (dispatchRes.handled) {
                this.metrics.commandsExecuted++;
                const output = dispatchRes.response || dispatchRes.output || '';
                const pkg = this.dynamicTexture.packageBubbles(output);
                const bubbles = Array.isArray(pkg) ? pkg : (pkg.bubbles || [output]);
                return {
                    handled: true, stage: 2, status: 'COMMAND_EXECUTED',
                    command: dispatchRes.command,
                    operationType: dispatchRes.operationType || 'READ',
                    output, finalText: output, response: output, bubbles,
                    reaction: '⚡', cached: false, latencyMs: Date.now() - startTime
                };
            }
        }

        // Stage 3: Prompt Shield
        const shieldCheck = this.promptShield.inspectInput(cleanRawText, { senderJid, isGroup });
        if (shieldCheck.verdict === 'BLOCKED' || shieldCheck.blocked) {
            this.metrics.securityBlocks++;
            return {
                handled: true, stage: 3, status: 'SECURITY_BLOCKED',
                reason: shieldCheck.rejectionMessage || shieldCheck.reason || 'Security violation',
                riskScore: shieldCheck.riskScore,
                bubbles: ['Akses ditolak. Input memicu proteksi keamanan.'],
                reaction: '🚫', latencyMs: Date.now() - startTime
            };
        }
        const cleanText = shieldCheck.sanitizedText || cleanRawText;

        // Stage 4: Uncertainty Engine
        const uncertainty = this.uncertaintyEngine.evaluate({ query: cleanText, facts: [], evidence: [] });

        // Stage 5: Rate Limiting
        const rateCheck = this.rateLimiter.consume(senderJid, userTier);
        if (!rateCheck.allowed) {
            this.metrics.rateThrottled++;
            return {
                handled: true, stage: 5, status: 'RATE_LIMITED',
                retryAfterMs: rateCheck.retryAfterMs || 5000,
                bubbles: ['Santai bro, cooldown bentar ya.'],
                reaction: '⏳', latencyMs: Date.now() - startTime
            };
        }

        // Stage 6: Semantic Cache
        const cached = this.semanticCache.get(cleanText);
        if (cached && cached.hit) {
            this.metrics.cacheHits++;
            const pkg = this.dynamicTexture.packageBubbles(cached.response);
            const bubbles = Array.isArray(pkg) ? pkg : (pkg.bubbles || [cached.response]);
            return {
                handled: true, stage: 6, status: 'CACHE_HIT',
                similarity: cached.similarity, finalText: cached.response,
                output: cached.response, bubbles,
                reaction: this.dynamicTexture.recommendReaction(cached.response, cleanText) || '⚡',
                cached: true, latencyMs: Date.now() - startTime
            };
        }

        // Stage 7: Research Depth + WebSearch
        const depth = this.researchDepth.determineDepth({ query: cleanText, context: messageContext });
        let searchContext = '';
        const needsSearch = depth.level === 'L2_SEARCH' || depth.level === 'L3_DEEP' || depth.level === 'L4_FORENSIC'
            || depth.level === ResearchDepthLevel?.SEARCH || depth.level === ResearchDepthLevel?.DEEP;

        if (needsSearch && this.webSearch) {
            try {
                this.metrics.searchesTriggered++;
                const searchResult = await this.webSearch.search(cleanText, { maxResults: 3 });
                if (searchResult && searchResult.summary) {
                    searchContext = '\n\n[WEB SEARCH RESULT]\n' + searchResult.summary;
                    if (searchResult.results?.length > 1) {
                        searchContext += '\n' + searchResult.results.slice(1, 3)
                            .map(r => '• ' + r.snippet).join('\n');
                    }
                }
            } catch (e) {
                console.warn('[ARKAIntegrationHub] Stage 7 search failed:', e.message);
            }
        }

        // Stage 8: Personal Ontology
        let userProfile = null;
        try {
            userProfile = this.ontology.getEntity ? this.ontology.getEntity(senderJid) : null;
        } catch (e) {}

        // Stage 9: Memory Retrieval
        let recalledMemories = [];
        try {
            if (this.memoryGraph && typeof this.memoryGraph.queryNeighbors === 'function') {
                recalledMemories = this.memoryGraph.queryNeighbors(cleanText) || [];
            }
        } catch (e) {}
        const memoryContext = recalledMemories.length > 0
            ? '\n\n[MEMORY]\n' + recalledMemories.slice(0, 3).map(n => n.label || n.id).join(', ')
            : '';

        // Stage 10: Agent Delegation
        const specialist = this.agentDelegation.resolveSpecialist(cleanText);
        let specialistUsed = null;
        if (specialist && depth.level !== 'L0_DIRECT' && depth.level !== ResearchDepthLevel?.INSTANT) {
            specialistUsed = specialist;
            this.metrics.delegatedExecutions++;
        }

        // Stage 11: Cognitive Planning
        let cognitivePlan = null;
        if (depth.level === 'L3_DEEP' || depth.level === 'L4_FORENSIC'
            || depth.level === ResearchDepthLevel?.DEEP || depth.level === ResearchDepthLevel?.FORENSIC) {
            try {
                cognitivePlan = this.planner.plan({ goal: cleanText, context: { senderJid, userTier } });
            } catch (e) {}
        }

        // Stage 12: Causal Reasoning
        let causalCheck = { valid: true };
        try {
            causalCheck = this.causalEngine.analyzeCausality
                ? this.causalEngine.analyzeCausality(cleanText)
                : { valid: true };
        } catch (e) {}

        // Stage 13: LLM Execution (real AIGateway or injected executor)
        const fullContext = cleanText + searchContext + memoryContext;
        let rawResponse = '';

        if (typeof llmExecutor === 'function') {
            // Test/override executor
            this.metrics.llmExecutions++;
            rawResponse = await llmExecutor({ prompt: fullContext, context: { systemPrompt, history }, depthLevel: depth.level, specialist: specialistUsed, senderJid });
        } else if (this.aiGateway) {
            // Real LLM via AIGateway
            this.metrics.llmExecutions++;
            try {
                // Build full system prompt with memory + search context
                const fullSystemPrompt = systemPrompt + (userProfile ? '\nUser profile: ' + JSON.stringify(userProfile) : '');
                const llmResult = await this.aiGateway.generate(fullContext, {
                    systemPrompt: fullSystemPrompt,
                    conversationId: chatId,
                    history: history.map(h => ({ role: h.role || 'user', text: h.content || h.text || '' })),
                    purpose: isOwner ? 'owner_chat' : (isGroup ? 'group_chat' : 'private_chat'),
                    images: images || [],
                    audio: audio || null
                });
                rawResponse = llmResult?.ok ? (llmResult.text || llmResult.content || '') : '';
                if (!rawResponse && llmResult?.error) {
                    console.warn('[ARKAIntegrationHub] LLM error:', llmResult.error);
                }
            } catch (e) {
                console.warn('[ARKAIntegrationHub] Stage 13 LLM failed:', e.message);
                rawResponse = '';
            }
        }

        // Fallback if LLM returned empty
        if (!rawResponse) {
            rawResponse = specialistUsed
                ? 'Selesai dianalisis oleh spesialis ' + specialistUsed + '.'
                : 'Siap, sudah diproses.';
        }

        // Stage 14: Epistemic Partitioning
        const epistemicPartition = this.epistemicEngine.partition({ facts: [cleanText], inferences: [rawResponse] });
        this.metrics.epistemicPartitions++;

        // Stage 15: Bias Audit
        const biasAudit = this.biasAuditor.auditDraft(rawResponse, { query: cleanText });
        const calibratedDraft = biasAudit.correctedDraft || rawResponse;

        // Stage 16: Coolness Governor
        const governed = this.coolnessGovernor.govern(calibratedDraft, { dialect: 'JAKSEL', cadence: 'CONCISE' });
        const finalText = governed.governedText || calibratedDraft;

        // Stage 17: WhatsApp Packaging
        const typingDelayMs = this.dynamicTexture.computeTypingDelay(finalText);
        const reaction = this.dynamicTexture.recommendReaction(finalText, cleanText);
        const pkg = this.dynamicTexture.packageBubbles(finalText);
        const bubbles = Array.isArray(pkg) ? pkg : (pkg.bubbles || [finalText]);

        // Stage 18: Telemetry
        if (this.signalTelemetry && typeof this.signalTelemetry.recordSignal === 'function') {
            this.signalTelemetry.recordSignal('MESSAGE_PROCESSED', {
                senderJid, latencyMs: Date.now() - startTime, tier: userTier, searched: needsSearch
            });
        }

        // Stage 19: Memory Ingestion
        if (!isGroup && cleanText.length > 5 && !cleanText.startsWith('/')) {
            this.semanticCache.set(cleanText, finalText, { ttlMs: 1800000 });
            // Ingest into persistent memory graph
            try {
                if (this.memoryGraph && typeof this.memoryGraph.addNode === 'function') {
                    const nodeId = 'msg_' + senderJid.replace(/[^a-z0-9]/gi, '_') + '_' + Date.now();
                    this.memoryGraph.addNode({ id: nodeId, label: cleanText.slice(0, 80), type: 'CONVERSATION', properties: { senderJid, chatId, response: finalText.slice(0, 200), ts: Date.now() } });
                }
            } catch (e) {}
        }
        try {
            this.syncEngine.recordChannelFact({
                key: 'last_interaction', value: cleanText,
                channel: isGroup ? ChannelType.GROUP : ChannelType.PRIVATE,
                scope: isGroup ? SyncScope.GROUP_LOCAL : SyncScope.PRIVATE_USER,
                userId: senderJid, groupJid: isGroup ? chatId : null
            });
        } catch (e) {}

        // Stage 20: Background Harvesting
        try {
            if (this.taskHarvester && typeof this.taskHarvester.harvest === 'function') {
                this.taskHarvester.harvest();
            }
        } catch (e) {}

        return {
            handled: true, stage: 20, status: 'SUCCESS',
            finalText, output: finalText, response: finalText, bubbles,
            reaction, typingDelayMs,
            epistemicSummary: epistemicPartition.summary,
            depthLevel: depth.level, specialist: specialistUsed,
            searched: needsSearch, cached: false,
            latencyMs: Date.now() - startTime
        };
    }

    getHealthReport() {
        const mem = process.memoryUsage ? process.memoryUsage() : {};
        const rssMB = mem.rss ? parseFloat((mem.rss / (1024 * 1024)).toFixed(2)) : 0;
        const memStats = this.memoryGraph?.getStorageStats ? this.memoryGraph.getStorageStats() : {};
        return {
            status: rssMB < 150 ? 'HEALTHY' : 'WARNING',
            rssMB, memoryCeilingMB: 150,
            uptimeSec: Math.floor((Date.now() - this.metrics.startedAt) / 1000),
            metrics: { ...this.metrics },
            memoryGraph: memStats,
            hasAIGateway: Boolean(this.aiGateway),
            timestamp: Date.now()
        };
    }
}

export const arkaIntegrationHub = new ARKAIntegrationHub();
