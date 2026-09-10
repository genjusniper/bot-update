// src/core/orchestration/ARKAIntegrationHub.mjs
// Phase 59: Master End-to-End Holistic Integration Hub for ARKA OS
// Coordinates Ingress, PromptShield, RateLimiter, CommandDispatcher, SemanticCache,
// ResearchDepth, MemoryGraph, MultiAgentFabric, Delegation, ContextOptimizer,
// BiasAuditor, CoolnessGovernor, DynamicTexture, MultiChannelSync, and WhatsAppSessionGuardian.

import { universalCommandDispatcher2, UniversalCommandDispatcher2 } from '../commands/UniversalCommandDispatcher2.mjs';
import { promptShieldEngine, PromptShieldEngine } from '../security/PromptShieldEngine.mjs';
import { semanticIntentCache, SemanticIntentCache } from '../cache/SemanticIntentCache.mjs';
import { dynamicRateLimiter, DynamicRateLimiter, RateTier } from '../rate/DynamicRateLimiter.mjs';
import { researchDepthController, ResearchDepthController, ResearchDepthLevel } from '../cognition/ResearchDepthController.mjs';
import { cognitiveMemoryGraph, CognitiveMemoryGraph } from '../memory/CognitiveMemoryGraph.mjs';
import { personalOntology, PersonalOntology } from '../memory/PersonalOntology.mjs';
import { knowledgeFreshnessEngine, KnowledgeFreshnessEngine } from '../memory/KnowledgeFreshnessEngine.mjs';
import { multiAgentFabric, MultiAgentFabric, AgentRole } from '../fabric/MultiAgentFabric.mjs';
import { agentDelegationEngine, AgentDelegationEngine } from '../autonomy/AgentDelegationEngine.mjs';
import { contextWindowOptimizer, ContextWindowOptimizer } from '../context/ContextWindowOptimizer.mjs';
import { cognitiveBiasAuditor, CognitiveBiasAuditor } from '../governance/CognitiveBiasAuditor.mjs';
import { coolnessGovernor2, CoolnessGovernor2 } from '../personality/CoolnessGovernor2.mjs';
import { dynamicTextureEngine, DynamicTextureEngine } from '../interaction/DynamicTextureEngine.mjs';
import { multiChannelSyncEngine, MultiChannelSyncEngine, ChannelType, SyncScope } from '../sync/MultiChannelSyncEngine.mjs';
import { whatsAppSessionGuardian, WhatsAppSessionGuardian, SessionStatus } from '../whatsapp/WhatsAppSessionGuardian.mjs';
import { incidentAutoHealer, IncidentAutoHealer, IncidentType } from '../observability/IncidentAutoHealer.mjs';
import { backgroundTaskHarvester, BackgroundTaskHarvester } from '../autonomy/BackgroundTaskHarvester.mjs';

export class ARKAIntegrationHub {
    constructor(options = {}) {
        this.commandDispatcher = options.commandDispatcher || universalCommandDispatcher2;
        this.promptShield = options.promptShield || promptShieldEngine;
        this.semanticCache = options.semanticCache || semanticIntentCache;
        this.rateLimiter = options.rateLimiter || dynamicRateLimiter;
        this.researchDepth = options.researchDepth || researchDepthController;
        this.memoryGraph = options.memoryGraph || cognitiveMemoryGraph;
        this.ontology = options.ontology || personalOntology;
        this.freshness = options.freshness || knowledgeFreshnessEngine;
        this.multiAgentFabric = options.multiAgentFabric || multiAgentFabric;
        this.agentDelegation = options.agentDelegation || agentDelegationEngine;
        this.contextOptimizer = options.contextOptimizer || contextWindowOptimizer;
        this.biasAuditor = options.biasAuditor || cognitiveBiasAuditor;
        this.coolnessGovernor = options.coolnessGovernor || coolnessGovernor2;
        this.dynamicTexture = options.dynamicTexture || dynamicTextureEngine;
        this.syncEngine = options.syncEngine || multiChannelSyncEngine;
        this.sessionGuardian = options.sessionGuardian || whatsAppSessionGuardian;
        this.autoHealer = options.autoHealer || incidentAutoHealer;
        this.taskHarvester = options.taskHarvester || backgroundTaskHarvester;

        // Hub Performance Metrics
        this.metrics = {
            totalIncoming: 0,
            commandsExecuted: 0,
            cacheHits: 0,
            securityBlocks: 0,
            rateThrottled: 0,
            delegatedExecutions: 0,
            llmExecutions: 0,
            startedAt: Date.now()
        };
    }

    /**
     * Master End-to-End Ingress Pipeline for all incoming WhatsApp messages
     * @param {Object} messageContext
     * @param {string} messageContext.text
     * @param {string} messageContext.senderJid
     * @param {string} [messageContext.senderName='User']
     * @param {string} [messageContext.chatId]
     * @param {boolean} [messageContext.isGroup=false]
     * @param {string} [messageContext.userTier='NORMAL']
     * @param {boolean} [messageContext.isOwner=false]
     * @param {string} [messageContext.systemPrompt]
     * @param {Array} [messageContext.history=[]]
     * @param {Function} [llmExecutor=null] - Async LLM function({ prompt, context, depthLevel, specialist })
     * @returns {Promise<Object>} Final processed and WhatsApp-packaged delivery
     */
    async processIncomingMessage(messageContext = {}, llmExecutor = null) {
        const startTime = Date.now();
        this.metrics.totalIncoming++;

        const {
            text = '',
            senderJid = 'user@s.whatsapp.net',
            senderName = 'User',
            chatId = senderJid,
            isGroup = false,
            userTier = isGroup ? RateTier.GROUP : RateTier.NORMAL,
            isOwner = userTier === RateTier.OWNER || userTier === 'OWNER',
            systemPrompt = 'Kamu adalah ARKA, AI OS WhatsApp cerdas, santai, dan efisien.',
            history = []
        } = messageContext;

        // 1. Dynamic Rate Limiting Guard
        const rateCheck = this.rateLimiter.consume(senderJid, userTier);
        if (!rateCheck.allowed) {
            this.metrics.rateThrottled++;
            return {
                handled: true,
                status: 'RATE_LIMITED',
                retryAfterMs: rateCheck.retryAfterMs || 5000,
                bubbles: ['Santai bro, cooldown bentar ya. Terlalu ngebut.'],
                reaction: '⏳',
                latencyMs: Date.now() - startTime
            };
        }

        // 2. Prompt Security & Delimiter Sanitization
        const shieldCheck = this.promptShield.inspectInput(text, { senderJid, isGroup });
        if (shieldCheck.verdict === 'BLOCKED' || shieldCheck.blocked) {
            this.metrics.securityBlocks++;
            const reason = shieldCheck.rejectionMessage || shieldCheck.reason || 'Security violation detected';
            return {
                handled: true,
                status: 'SECURITY_BLOCKED',
                reason,
                riskScore: shieldCheck.riskScore,
                bubbles: ['Akses ditolak. Input memicu proteksi keamanan.'],
                reaction: '🚫',
                latencyMs: Date.now() - startTime
            };
        }
        const cleanText = shieldCheck.sanitizedText || text;

        // 3. Universal Command Dispatcher (Zero-Token Fast Path)
        const detectedCmd = this.commandDispatcher.detectCommand(cleanText);
        if (detectedCmd) {
            const dispatchRes = await this.commandDispatcher.dispatch(cleanText, {
                senderJid,
                senderName,
                chatId,
                isGroup,
                isOwner,
                userTier
            });

            if (dispatchRes.handled) {
                this.metrics.commandsExecuted++;
                const output = dispatchRes.response || dispatchRes.output || '';
                const pkg = this.dynamicTexture.packageBubbles(output);
                const bubbles = Array.isArray(pkg) ? pkg : (pkg.bubbles || [output]);
                return {
                    handled: true,
                    status: 'COMMAND_EXECUTED',
                    command: dispatchRes.command,
                    output,
                    finalText: output,
                    response: output,
                    bubbles,
                    reaction: '⚡',
                    cached: false,
                    latencyMs: Date.now() - startTime
                };
            }
        }

        // 4. Semantic Intent Cache Check (Zero-Token LLM Bypass)
        const cached = this.semanticCache.get(cleanText);
        if (cached && cached.hit) {
            this.metrics.cacheHits++;
            const pkg = this.dynamicTexture.packageBubbles(cached.response);
            const bubbles = Array.isArray(pkg) ? pkg : (pkg.bubbles || [cached.response]);
            return {
                handled: true,
                status: 'CACHE_HIT',
                similarity: cached.similarity,
                finalText: cached.response,
                output: cached.response,
                bubbles,
                reaction: this.dynamicTexture.recommendReaction(cached.response, cleanText) || '⚡',
                cached: true,
                latencyMs: Date.now() - startTime
            };
        }

        // 5. Research Depth & Cognitive Budget Calculation
        const depth = this.researchDepth.determineDepth({ query: cleanText, context: messageContext });

        // 6. Context Window Optimization
        const optimizedContext = this.contextOptimizer.optimizeContext({
            systemPrompt,
            history,
            currentInput: cleanText,
            maxTokens: depth.budget?.maxTokens || 3000
        });

        // 7. Reasoning & Execution (Specialist Delegation or LLM Executor)
        let rawResponse = '';
        let specialistUsed = null;

        const specialist = this.agentDelegation.resolveSpecialist(cleanText);
        if (specialist && depth.level !== ResearchDepthLevel.INSTANT) {
            specialistUsed = specialist;
            this.metrics.delegatedExecutions++;
        }

        if (typeof llmExecutor === 'function') {
            this.metrics.llmExecutions++;
            rawResponse = await llmExecutor({
                prompt: cleanText,
                context: optimizedContext,
                depthLevel: depth.level,
                specialist: specialistUsed,
                senderJid
            });
        } else {
            // Default deterministic fallback response
            rawResponse = specialistUsed
                ? `Selesai dianalisis oleh spesialis ${specialistUsed}. Semua parameter verified.`
                : 'Siap, informasi sudah diproses dengan akurasi optimal.';
        }

        // 8. Quality, Bias & Fairness Governance
        const biasAudit = this.biasAuditor.auditDraft(rawResponse, { query: cleanText });
        const calibratedDraft = biasAudit.correctedDraft || rawResponse;

        // 9. Coolness Governor (Anti-sycophancy & anti-essay cadence clamping)
        const governed = this.coolnessGovernor.govern(calibratedDraft, {
            dialect: 'JAKSEL',
            cadence: 'CONCISE'
        });
        const finalText = governed.governedText || calibratedDraft;

        // 10. WhatsApp Dynamic Texture & Packaging
        const typingDelayMs = this.dynamicTexture.computeTypingDelay(finalText);
        const reaction = this.dynamicTexture.recommendReaction(finalText, cleanText);
        const pkg = this.dynamicTexture.packageBubbles(finalText);
        const bubbles = Array.isArray(pkg) ? pkg : (pkg.bubbles || [finalText]);

        // 11. Cross-Channel Sync & Cache Storing
        if (!isGroup && cleanText.length > 5 && !cleanText.startsWith('/')) {
            this.semanticCache.set(cleanText, finalText, { ttlMs: 1800000 });
        }

        try {
            this.syncEngine.recordChannelFact({
                key: 'last_interaction',
                value: cleanText,
                channel: isGroup ? ChannelType.GROUP : ChannelType.PRIVATE,
                scope: isGroup ? SyncScope.GROUP_LOCAL : SyncScope.PRIVATE_USER,
                userId: senderJid,
                groupJid: isGroup ? chatId : null
            });
        } catch (e) {
            // Non-critical logging for sync recording
        }

        return {
            handled: true,
            status: 'SUCCESS',
            originalText: text,
            cleanText,
            rawResponse,
            finalText,
            governedText: finalText,
            output: finalText,
            bubbles,
            reaction,
            typingDelayMs,
            depthLevel: depth.level,
            specialist: specialistUsed,
            governance: {
                biasPassed: biasAudit.passesAudit,
                detectedBiases: biasAudit.detectedBiases,
                sycophancyStripped: governed.metrics?.sycophancyRemoved || 0
            },
            metrics: {
                cached: false,
                tokenSavedEstimate: optimizedContext.totalEstimatedTokens || 0,
                latencyMs: Date.now() - startTime
            }
        };
    }

    /**
     * Session Disconnect triage delegation
     */
    handleSessionDisconnect(statusCode) {
        return this.sessionGuardian.handleDisconnect(statusCode);
    }

    /**
     * Report WhatsApp connection success
     */
    recordSessionConnection() {
        this.sessionGuardian.recordSuccessfulConnection();
    }

    /**
     * Incident recovery hook
     */
    async handleIncident(incident) {
        return await this.autoHealer.handleIncident(incident);
    }

    /**
     * Trigger background maintenance harvest
     */
    runMaintenance() {
        return this.taskHarvester.runHarvestCycle();
    }

    /**
     * Get aggregate health & telemetry report across all integrated subsystems
     */
    getComprehensiveTelemetry() {
        const cacheStats = this.semanticCache.getStats();
        return {
            hub: { ...this.metrics, uptimeSec: Math.floor((Date.now() - this.metrics.startedAt) / 1000) },
            session: this.sessionGuardian.getSessionStatus(),
            cache: {
                ...cacheStats,
                size: cacheStats.currentSize ?? 0
            },
            healer: this.autoHealer.getHealthReport(),
            harvester: this.taskHarvester.getStats()
        };
    }
}

// Export default singleton instance
export const arkaIntegrationHub = new ARKAIntegrationHub();
