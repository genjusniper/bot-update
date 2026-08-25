// src/agent/PersonalAIOS.mjs — TRUSTED UNIVERSAL PERSONAL AI RUNTIME (V7.5 / V8.0)

import { BoundedRecoveryFleet } from '../fleet/BoundedRecoveryFleet.mjs';
import { LightweightRouter } from '../fleet/LightweightRouter.mjs';
import { AdaptiveModelRouter } from '../fleet/AdaptiveModelRouter.mjs';
import { ProviderHealthMatrix } from '../fleet/ProviderHealthMatrix.mjs';

import { ContextBudgetManager } from '../context/ContextBudgetManager.mjs';
import { StyleDNA } from '../communication/StyleDNA.mjs';
import { StyleLearningEngine } from '../communication/StyleLearningEngine.mjs';

import { ConversationStateEngine } from '../conversation/ConversationStateEngine.mjs';
import { TurnTakingEngine } from '../conversation/TurnTakingEngine.mjs';
import { StoryThreadTracker } from '../conversation/StoryThreadTracker.mjs';

import { TopicGraphEngine } from '../topics/TopicGraphEngine.mjs';
import { AdvancedHumorEngine } from '../humor/AdvancedHumorEngine.mjs';
import { CallbackRegistry } from '../humor/CallbackRegistry.mjs';
import { HumorTimingDetector } from '../humor/HumorTimingDetector.mjs';

import { SocialMemoryOS } from '../social/SocialMemoryOS.mjs';
import { EmotionalCalibrationEngine } from '../social/EmotionalCalibrationEngine.mjs';
import { CurhatEngine } from '../social/CurhatEngine.mjs';
import { OpenLoopEngine } from '../communication/OpenLoopEngine.mjs';
import { AntiRepetitionEngine } from '../communication/AntiRepetitionEngine.mjs';

import { MemoryOS } from '../memory/MemoryOS.mjs';
import { RelevanceMemoryRetrieval } from '../memory/RelevanceMemoryRetrieval.mjs';
import { MemoryConsolidationPipeline } from '../memory/MemoryConsolidationPipeline.mjs';

import { ConversationQualityGate } from '../quality/ConversationQualityGate.mjs';
import { GroupChatPolicyEngine } from '../group/GroupChatPolicyEngine.mjs';
import { CapabilitySecurityEngine } from '../security/CapabilitySecurityEngine.mjs';
import { SecretVault } from '../security/SecretVault.mjs';
import { ReplayStudio } from '../eval/ReplayStudio.mjs';

import { loadMemory, saveMemory } from '../memory/MemoryStore.mjs';
import { MemoryManager } from '../memory/MemoryManager.mjs';

export class PersonalAIOS {
    constructor() {
        this.fleet = new BoundedRecoveryFleet();
        this.memoryManager = new MemoryManager(this.fleet);
    }

    async process(chatId, message, correlationId = null, senderId = null) {
        const startTime = Date.now();
        const corrId = correlationId || `conv_${chatId}_${Date.now()}`;
        const trace = { correlationId: corrId, chatId, message };

        // 1. GROUP CHAT POLICY & SILENCE ENFORCEMENT
        const groupPolicy = GroupChatPolicyEngine.evaluateGroupMessage(chatId, message, senderId);
        if (!groupPolicy.shouldRespond) {
            trace.status = 'GROUP_SILENCE';
            ReplayStudio.recordTrace(corrId, trace).catch(() => {});
            return null; // Stay silent in group
        }

        // 2. COMPLEXITY ROUTER & LOCAL FAST PATH
        const complexity = AdaptiveModelRouter.evaluateComplexity(message);
        trace.complexityTier = complexity.tier;
        trace.routeSelected = complexity.recommendedRoute;

        if (complexity.recommendedRoute === 'LOCAL_FAST_PATH') {
            const lightResult = LightweightRouter.route(message);
            if (lightResult.handled) {
                trace.modelUsed = 'LOCAL_FAST_PATH';
                trace.finalMessage = lightResult.response;
                trace.latencyMs = Date.now() - startTime;
                ReplayStudio.recordTrace(corrId, trace).catch(() => {});
                return lightResult.response;
            }
        }

        // 3. LOAD & CONSOLIDATE MEMORY
        let memData = await loadMemory(chatId);
        if (!memData.working_memory) memData.working_memory = [];
        memData.working_memory = memData.working_memory.filter(m => 
            !m.text.includes('nge-lag') && !m.text.includes('offline')
        );

        // Run background consolidation if working memory grows > 15
        if (memData.working_memory.length > 15) {
            MemoryConsolidationPipeline.consolidateWorkingMemory(chatId, memData.working_memory).catch(() => {});
        }

        // 4. MULTI-DIMENSIONAL CONVERSATION STATE & TURN TAKING
        const convState = ConversationStateEngine.evaluateState(message);
        const emotionalCalibration = EmotionalCalibrationEngine.calibrate(message);
        const turnTaking = TurnTakingEngine.evaluateTurn(message, memData.working_memory, 1);
        const curhatMode = CurhatEngine.detectMode(message);

        trace.phase = convState.phase;
        trace.mode = curhatMode.mode;
        trace.emotionalTone = emotionalCalibration.tone;

        // 5. TOPIC GRAPH & STORY THREADS
        const topicGraph = await TopicGraphEngine.updateGraph(chatId, message);
        const topicDirectives = TopicGraphEngine.formatDirectives(topicGraph);
        const storyThreads = await StoryThreadTracker.getThreads(chatId);
        const activeStories = StoryThreadTracker.getActiveThreads(storyThreads);
        const storyContext = activeStories.length > 0
            ? `- Benang Cerita Aktif: "${activeStories[0].summary}"`
            : '';

        trace.topic = topicGraph.currentTopic;

        // 6. HUMOR TIMING & CALLBACK MATCHING
        const humorTiming = HumorTimingDetector.calculateIntensity(message, emotionalCalibration.tone);
        const callbackEvents = await CallbackRegistry.getEvents(chatId);
        const matchedCallback = CallbackRegistry.findMatchingCallback(message, callbackEvents);
        const humorDecision = AdvancedHumorEngine.evaluate(message, convState, matchedCallback);

        trace.humorMode = humorDecision.mode;

        // 7. SOCIAL MEMORY & STYLE LEARNING
        const socialProfile = await SocialMemoryOS.getProfile(chatId);
        const socialContext = SocialMemoryOS.formatSocialContext(socialProfile);
        const learnedStyle = await StyleLearningEngine.learnFromMessage(chatId, message);
        const dna = StyleDNA.getProfile('CLOSE');
        const isJawa = Boolean(message.match(/(yo|ki|to|wae|lha|ngopo|piye|mangan|kue|kowe|opo|ora|ra|wis|wes|dadi)/i));
        const styleDirectives = StyleDNA.compileDirectives(dna, isJawa);

        // 8. SCORED TOP-K MEMORY RETRIEVAL (RELEVANCE 2.0)
        let memOSData = await MemoryOS.getMemory(chatId);
        memOSData = MemoryOS.applyDecay(memOSData);
        const allFacts = [
            ...(memOSData.L2_semantic || []),
            ...(memOSData.L1_episodic || []).map(e => ({ predicate: 'kejadian', object: e.summary, importance: e.importance }))
        ];
        const relevantMemories = RelevanceMemoryRetrieval.retrieveTopMemories(allFacts, message, topicGraph.currentTopic, 3);
        const memoryPromptStr = relevantMemories.length > 0
            ? "=== MEMORI RELEVAN ===\n" + relevantMemories.map(m => `- ${m.predicate}: ${m.object}`).join('\n')
            : '';

        // 9. CONTEXT BUDGET ALLOCATION (~2000 tokens)
        const { history: budgetedHistory, estimatedTokens } = ContextBudgetManager.fitToBudget(memData.working_memory, 8);
        trace.tokensEstimated = estimatedTokens;

        // 10. MASTER PROMPT
        const masterPrompt = `Kamu adalah teman ngobrol / asisten WhatsApp pribadi yang sangat asik, cerdas, santai, dan seru.

${styleDirectives}

${convState.directive}
${emotionalCalibration.directive}
${turnTaking.directive}
${humorTiming.directive}
${humorDecision.directive ? `${humorDecision.directive}` : ''}

${topicDirectives}
${storyContext}
${socialContext}
${memoryPromptStr}

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

        const cleanPrompt = SecretVault.sanitizePrompt(masterPrompt);

        // 11. MULTI-TURN PAYLOAD
        const contents = [];
        for (const item of budgetedHistory) {
            if (item.role === 'user') {
                contents.push({ role: 'user', parts: [{ text: item.text }] });
            } else if (item.role === 'assistant') {
                contents.push({ role: 'model', parts: [{ text: item.text }] });
            }
        }
        contents.push({ role: 'user', parts: [{ text: message }] });

        // 12. BOUNDED RECOVERY FLEET GENERATION
        const fleetResult = await this.fleet.executeRequest(cleanPrompt, contents);
        let rawDraft = fleetResult.text || "Bentar, agak nge-lag tadi jaringannya. Coba ulangi lagi ya!";
        trace.modelUsed = fleetResult.modelUsed || 'BOUNDED_FALLBACK';

        // 13. CONVERSATION QUALITY GATE (Pre-Send Validation & Hallucination Guard)
        const qualityVerdict = ConversationQualityGate.validateDraft(rawDraft, {
            verifiedFacts: allFacts,
            maxWords: turnTaking.maxWords
        });

        let sanitizedOutput = StyleDNA.formatOutput(qualityVerdict.sanitizedText, dna);

        // 14. ANTI-REPETITION & VARIANCE
        const recentResponses = await AntiRepetitionEngine.getRecentResponses(chatId);
        if (AntiRepetitionEngine.isRepetitive(sanitizedOutput, recentResponses)) {
            sanitizedOutput = AntiRepetitionEngine.applyControlledVariance(sanitizedOutput);
        }

        trace.finalMessage = sanitizedOutput;
        trace.qualityScore = qualityVerdict.qualityScore;
        trace.latencyMs = Date.now() - startTime;

        // 15. RECORD TELEMETRY & REPLAY STUDIO
        ReplayStudio.recordTrace(corrId, trace).catch(() => {});
        AntiRepetitionEngine.recordResponse(chatId, sanitizedOutput).catch(() => {});

        // 16. PERSIST CLEAN WORKING MEMORY & EVENTS
        if (!sanitizedOutput.includes('nge-lag') && !sanitizedOutput.includes('offline')) {
            memData.working_memory.push({ role: 'user', text: message, timestamp: Date.now() });
            memData.working_memory.push({ role: 'assistant', text: sanitizedOutput, timestamp: Date.now() });
            if (memData.working_memory.length > 20) {
                memData.working_memory = memData.working_memory.slice(-20);
            }
            await saveMemory(chatId, memData);

            this.memoryManager.extractAndStore(chatId, `${message}\n${sanitizedOutput}`).catch(() => {});

            if (message.length > 50 || message.match(/(tadi kan|jadi gini|kemarin tuh)/i)) {
                StoryThreadTracker.recordStory(chatId, message, topicGraph.currentTopic).catch(() => {});
            }
        }

        return sanitizedOutput;
    }
}
