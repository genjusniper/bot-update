// src/agent/PersonalAIOS.mjs — UNIVERSAL PERSONAL ASSISTANT OS (V13.6 LINK & MAPS MASTER)

import { AIGatewayObservable } from '../resilience/AIGatewayObservable.mjs';
import { CircuitBreakerHardened } from '../resilience/CircuitBreakerHardened.mjs';
import { KeyHealthRegistry } from '../resilience/KeyHealthRegistry.mjs';
import { EmergencyBrainExpanded } from '../resilience/EmergencyBrainExpanded.mjs';
import { DuplicateResponseGuard } from '../resilience/DuplicateResponseGuard.mjs';
import { MessageLifecycleTracker } from '../telemetry/MessageLifecycleTracker.mjs';
import { ProductionTelemetry72h } from '../metrics/ProductionTelemetry72h.mjs';

// V13 Personal Number Co-Pilot & Safety Layer
import { PersonalCoPilotGuard } from '../security/copilot/PersonalCoPilotGuard.mjs';

import { DeepIntentRouter } from '../multimodal/DeepIntentRouter.mjs';
import { VoiceIntelligenceEngine } from '../multimodal/VoiceIntelligenceEngine.mjs';
import { LinkIntelligenceEngine } from '../multimodal/LinkIntelligenceEngine.mjs';
import { SemanticCache } from '../multimodal/SemanticCache.mjs';
import { AttachmentFactExtractor } from '../multimodal/AttachmentFactExtractor.mjs';

import { TaskPromiseTracker } from '../tasks/TaskPromiseTracker.mjs';
import { DeviceServerMonitor } from '../monitor/DeviceServerMonitor.mjs';
import { LocalCalculatorEngine } from '../utility/LocalCalculatorEngine.mjs';
import { PersonalSearchEngine } from '../memory/PersonalSearchEngine.mjs';
import { ProactiveMemoryGraph } from '../memory/ProactiveMemoryGraph.mjs';
import { ProductLocationAdvisor } from '../advisor/ProductLocationAdvisor.mjs';

// V12 Social Intelligence Subsystem
import { ConversationTemperatureEngine } from '../social/v12/ConversationTemperatureEngine.mjs';
import { DontOverhelpEngine } from '../social/v12/DontOverhelpEngine.mjs';
import { ConversationRepairEngine } from '../social/v12/ConversationRepairEngine.mjs';
import { VisualConversationContinuity } from '../social/v12/VisualConversationContinuity.mjs';

// Multi-Person Context Isolation & Profiles
import { PerContactMemoryNamespace } from '../social/multiperson/PerContactMemoryNamespace.mjs';
import { ContactProfileStore } from '../social/multiperson/ContactProfileStore.mjs';

// Behavioral & HIPE
import { HumanInteractionPolicy } from '../behavior/HumanInteractionPolicy.mjs';
import { TimeAwarenessPersona } from '../behavior/TimeAwarenessPersona.mjs';
import { ResponseBudgetEngine } from '../behavior/ResponseBudgetEngine.mjs';
import { ConversationEndingDetector } from '../behavior/ConversationEndingDetector.mjs';

import { LifeBrain } from '../subsystems/life/LifeBrain.mjs';
import { LifeCompanionEngine } from '../subsystems/life/LifeCompanionEngine.mjs';
import { SocialBrain } from '../subsystems/social/SocialBrain.mjs';
import { HumanUXEngine } from '../subsystems/ux/HumanUXEngine.mjs';
import { ConversationDebugger } from '../subsystems/observability/ConversationDebugger.mjs';

import { LightweightRouter } from '../fleet/LightweightRouter.mjs';
import { ContextBudgetManager } from '../context/ContextBudgetManager.mjs';
import { StyleDNA } from '../communication/StyleDNA.mjs';
import { NaturalConversationEnhancer } from '../communication/NaturalConversationEnhancer.mjs';

import { ConversationStateEngine } from '../conversation/ConversationStateEngine.mjs';
import { ConversationContinuityLock } from '../conversation/ConversationContinuityLock.mjs';
import { ConversationOutcomeTracker } from '../conversation/ConversationOutcomeTracker.mjs';
import { HumanRhythmEngine } from '../conversation/HumanRhythmEngine.mjs';
import { TurnTakingEngine } from '../conversation/TurnTakingEngine.mjs';
import { StoryThreadTracker } from '../conversation/StoryThreadTracker.mjs';

import { TopicGraphEngine } from '../topics/TopicGraphEngine.mjs';
import { AdvancedHumorEngine } from '../humor/AdvancedHumorEngine.mjs';
import { CallbackRegistry } from '../humor/CallbackRegistry.mjs';
import { HumorTimingDetector } from '../humor/HumorTimingDetector.mjs';

import { SocialMemoryOS } from '../social/SocialMemoryOS.mjs';
import { EmotionalCalibrationEngine } from '../social/EmotionalCalibrationEngine.mjs';
import { CurhatEngine } from '../social/CurhatEngine.mjs';
import { AntiRepetitionEngine } from '../communication/AntiRepetitionEngine.mjs';

import { MemoryOS } from '../memory/MemoryOS.mjs';
import { RelevanceMemoryRetrieval } from '../memory/RelevanceMemoryRetrieval.mjs';
import { MemoryConsolidationPipeline } from '../memory/MemoryConsolidationPipeline.mjs';

import { ConversationQualityGate } from '../quality/ConversationQualityGate.mjs';
import { SecretVault } from '../security/SecretVault.mjs';
import { ReplayStudio } from '../eval/ReplayStudio.mjs';

import { loadMemory, saveMemory } from '../memory/MemoryStore.mjs';
import { MemoryManager } from '../memory/MemoryManager.mjs';

export class PersonalAIOS {
    constructor() {
        this.gateway = new AIGatewayObservable();
        this.memoryManager = new MemoryManager(this.gateway);
    }

    async process(chatId, message, correlationId = null, senderId = null, mediaOptions = {}) {
        const startTime = Date.now();
        const corrId = correlationId || `conv_${chatId}_${Date.now()}`;
        const effectiveSender = senderId || chatId;
        const isGroup = chatId.endsWith('@g.us');
        
        const images = mediaOptions.images || (mediaOptions.imageBase64 ? [{ base64: mediaOptions.imageBase64, mimeType: mediaOptions.mimeType }] : []);
        const audio = mediaOptions.audio || (mediaOptions.audioBase64 ? { base64: mediaOptions.audioBase64, mimeType: mediaOptions.mimeType } : null);
        const quotedContext = mediaOptions.quotedContext || null;
        const rawMessage = mediaOptions.rawMessage || null;
        const ownerJid = mediaOptions.ownerJid || null;
        const groupSubject = mediaOptions.groupSubject || '';
        const pushName = mediaOptions.pushName || '';

        const hasImages = images.length > 0;
        const hasAudio = Boolean(audio);
        const rawText = (message || '').trim();

        if (!rawText && !hasImages && !hasAudio) {
            return null; // SILENT: Drop empty protocol/sticker packets with no content
        }

        const inputSnippet = rawText || (hasImages ? `[${images.length} FOTO / SLIDE]` : '[VOICE NOTE]');

        const lifecycleId = await MessageLifecycleTracker.createLifecycle(chatId, inputSnippet);
        const trace = { correlationId: corrId, lifecycleId, chatId, senderId: effectiveSender, pushName, groupSubject, message: inputSnippet, imageCount: images.length, hasAudio };

        ProductionTelemetry72h.increment('messages', 'received').catch(() => {});

        // 1. MASTER PERSONAL NUMBER CO-PILOT GATEKEEPER (V13.6)
        const copilotGate = await PersonalCoPilotGuard.evaluateGatekeeper({
            chatId,
            groupSubject,
            text: inputSnippet,
            fromMe: mediaOptions.fromMe || false,
            isGroup,
            rawMessage,
            ownerJid
        });

        if (!copilotGate.allowAI) {
            trace.status = copilotGate.reason;
            await MessageLifecycleTracker.logPhase(lifecycleId, 'DROPPED', { reason: copilotGate.reason, action: copilotGate.action });
            ProductionTelemetry72h.increment('messages', 'dropped').catch(() => {});
            ReplayStudio.recordTrace(corrId, trace).catch(() => {});
            return null;
        }

        // 3. MULTI-PERSON PROFILE STORE & NAME RECOGNITION (V13.6)
        const contactProfile = await ContactProfileStore.updateFromMessage(effectiveSender, inputSnippet, pushName);
        const contactDirectives = ContactProfileStore.formatDirectives(contactProfile);

        // 11. DEEP INTENT ROUTER (Direct to Gemini AI)
        const intentRoute = DeepIntentRouter.classify(inputSnippet, { hasImage: hasImages, imageCount: images.length, hasAudio });
        trace.intent = intentRoute.intent;
        await MessageLifecycleTracker.logPhase(lifecycleId, 'INTENT_ROUTED', { intent: intentRoute.intent, targetRoute: intentRoute.targetRoute });

        // 12. CONVERSATION TEMPERATURE & REPAIR DIRECTIVES (V12)
        const tempEval = ConversationTemperatureEngine.evaluateTemperature(inputSnippet);
        const isCorrection = ConversationRepairEngine.isCorrection(inputSnippet);
        const repairDirective = isCorrection ? ConversationRepairEngine.getRepairPromptDirective(inputSnippet) : '';
        const visualContinuity = VisualConversationContinuity.getContinuityContext(chatId, inputSnippet);

        trace.temperature = tempEval.temperature;

        // 13. LINK INTELLIGENCE RESOLVER (Google Maps, Websites, Marketplaces)
        let linkContext = '';
        if (intentRoute.intent === 'LINK_ANALYSIS' && intentRoute.url) {
            const linkData = await LinkIntelligenceEngine.resolveUrl(intentRoute.url);
            linkContext = LinkIntelligenceEngine.formatLinkContext(linkData);
            await MessageLifecycleTracker.logPhase(lifecycleId, 'LINK_RESOLVED', { url: intentRoute.url, title: linkData.title, type: linkData.type });
        }

        // 14. TIME AWARENESS & PERSONA DRIFT LOCK
        const timeCtx = TimeAwarenessPersona.getTimeContext();
        const personaLock = TimeAwarenessPersona.getPersonaLock();

        // 15. LIFE BRAIN & SOCIAL BRAIN DYNAMICS
        LifeBrain.recordOpenLoop(chatId, inputSnippet).catch(() => {});
        const lifeData = await LifeBrain.load(chatId);
        const lifeContext = LifeBrain.formatContext(lifeData);
        const socialDynamics = SocialBrain.evaluateSocialDynamics(inputSnippet);
        const moodState = LifeCompanionEngine.detectMood(inputSnippet);
        const responseBudget = ResponseBudgetEngine.calculateBudget(inputSnippet, moodState, { hasImage: hasImages, hasAudio });

        trace.socialMode = socialDynamics.mode;
        trace.energy = socialDynamics.energy;
        trace.budgetTier = responseBudget.tier;

        // 16. LOAD & CONSOLIDATE MEMORY (HARD ISOLATED BY CHATID)
        let memData = await loadMemory(chatId);
        if (!memData.working_memory) memData.working_memory = [];
        memData.working_memory = memData.working_memory.filter(m => 
            !m.text.includes('nge-lag') && !m.text.includes('offline')
        );

        if (memData.working_memory.length > 15) {
            MemoryConsolidationPipeline.consolidateWorkingMemory(chatId, memData.working_memory).catch(() => {});
        }

        // 17. CONVERSATION STATE & CONTINUITY LOCK
        const convState = ConversationStateEngine.evaluateState(inputSnippet);
        const emotionalCalibration = EmotionalCalibrationEngine.calibrate(inputSnippet);
        const turnTaking = TurnTakingEngine.evaluateTurn(inputSnippet, memData.working_memory, 1);
        const rhythm = HumanRhythmEngine.determineRhythm(inputSnippet, convState);

        const continuityLock = await ConversationContinuityLock.updateLock(chatId, {
            currentTopic: convState.phase === 'CURHAT_VENTING' ? 'curhat' : (hasImages ? 'foto_vision' : undefined),
            emotionalTone: emotionalCalibration.tone
        });
        const continuityDirectives = ConversationContinuityLock.formatDirectives(continuityLock);

        trace.phase = convState.phase;

        // 18. TOPIC GRAPH & STORY THREADS
        const topicGraph = await TopicGraphEngine.updateGraph(chatId, inputSnippet);
        const topicDirectives = TopicGraphEngine.formatDirectives(topicGraph);
        const storyThreads = await StoryThreadTracker.getThreads(chatId);
        const activeStories = StoryThreadTracker.getActiveThreads(storyThreads);
        const storyContext = activeStories.length > 0
            ? `- Benang Cerita Aktif: "${activeStories[0].summary}"`
            : '';

        trace.topic = topicGraph.currentTopic;

        // 19. HUMOR TIMING & CALLBACK MATCHING
        const humorTiming = HumorTimingDetector.calculateIntensity(inputSnippet, emotionalCalibration.tone);
        const callbackEvents = await CallbackRegistry.getEvents(chatId);
        const matchedCallback = CallbackRegistry.findMatchingCallback(inputSnippet, callbackEvents);
        const humorDecision = AdvancedHumorEngine.evaluate(inputSnippet, convState, matchedCallback);

        // 20. PROACTIVE GRAPH & ISOLATED MEMORY
        const proactiveGraph = await ProactiveMemoryGraph.getGraph(chatId);
        const proactiveContext = ProactiveMemoryGraph.formatGraphContext(proactiveGraph);

        const dna = StyleDNA.getProfile('CLOSE');
        const isJawa = Boolean(inputSnippet.match(/(yo|ki|to|wae|lha|ngopo|piye|mangan|kue|kowe|opo|ora|ra|wis|wes|dadi)/i));
        const styleDirectives = StyleDNA.compileDirectives(dna, isJawa);

        // 21. SCORED TOP-K MEMORY RETRIEVAL (STRICTLY ISOLATED BY CHATID)
        let memOSData = await MemoryOS.getMemory(chatId);
        memOSData = MemoryOS.applyDecay(memOSData);
        const rawFacts = [
            ...(memOSData.L2_semantic || []),
            ...(memOSData.L1_episodic || []).map(e => ({ predicate: 'kejadian', object: e.summary, importance: e.importance }))
        ];
        const isolatedFacts = PerContactMemoryNamespace.sanitizeIsolatedMemory(rawFacts, chatId);
        const relevantMemories = RelevanceMemoryRetrieval.retrieveTopMemories(isolatedFacts, inputSnippet, topicGraph.currentTopic, 3);
        const memoryPromptStr = relevantMemories.length > 0
            ? "=== MEMORI RELEVAN (ISOLASI PRIVATE) ===\n" + relevantMemories.map(m => `- ${m.predicate}: ${m.object}`).join('\n')
            : '';

        // 22. CONTEXT BUDGET ALLOCATION
        const { history: budgetedHistory, estimatedTokens } = ContextBudgetManager.fitToBudget(memData.working_memory, 8);
        trace.tokensEstimated = estimatedTokens;

        // 23. MULTIMODAL DIRECTIVES
        let multimodalDirective = '';
        if (hasImages) {
            multimodalDirective = `PANDUAN MULTI-FOTO / SLIDE / VISION: User mengirim ${images.length} foto/slide ke kamu! Analisis seluruh sudut/slide foto secara komprehensif, santai, dan to-the-point.\n${ProductLocationAdvisor.getProductDirective()}\n${ProductLocationAdvisor.getLocationDirective()}`;
        } else if (hasAudio) {
            multimodalDirective = "PANDUAN VOICE NOTE: User mengirim rekaman suara ke kamu! Pahami maksud dan suasananya, lalu balas secara hangat dan akrab.";
        }

        const isSelfChat = Boolean(
            chatId === '236322690191595@lid' ||
            (ownerJid && chatId.replace(/\D/g, '').includes(ownerJid.split(':')[0].split('@')[0]))
        );

        const roleIdentity = isSelfChat
            ? `Kamu adalah Personal Co-Pilot & Asisten AI pribadi cerdas milik Bos (Agus / Gus). Bantu Bos dengan sigap, santai, dan cerdas.`
            : `IDENTITAS MUTLAK: Kamu adalah AGUS (panggilan akrab: GUS / Mas Agus). Kamu adalah pemilik asli nomor WhatsApp ini.
- Bicaralah selalu sebagai AGUS / GUS (orang pertama: aku / kulo / gue), BUKAN sebagai pihak ketiga, asisten, atau bot.
- Kamu sedang ngobrol langsung dengan teman/kontakmu di WhatsApp.
- JIKA TEMANMU MEMANGGIL ATAU BERTANYA: "Kie koe pora Gus?", "Gus", "Mas Agus", "Mas", "Bro", langsung akui dan balas secara wajar, akrab, dan santai (contoh: "Iyo iki aku Gus wkwk, kok aneh piye to?").
- JANGAN PERNAH menyangkal bahwa namamu Agus / Gus!
- JANGAN PERNAH mengaku sebagai bot, AI, atau asisten kepada teman/orang lain.
- Gunakan gaya bahasa santai, akrab, luwes, dan bahasa Jawa Semarangan/Indo gaul yang alami.`;

        const outcomeData = await ConversationOutcomeTracker.loadOutcome(chatId);
        const outcomeDirectives = ConversationOutcomeTracker.formatDirectives(outcomeData);
        const naturalEnhancement = NaturalConversationEnhancer.evaluate({ text: inputSnippet, chatId, pushName });

        const masterPrompt = `${roleIdentity}

${personaLock}
${contactDirectives}
${outcomeDirectives}
${naturalEnhancement}
${tempEval.directive}
${repairDirective}
${visualContinuity}
${responseBudget.directive}
${timeCtx.directive}
${styleDirectives}
${socialDynamics.directive}
${multimodalDirective}

${linkContext}
${proactiveContext}
${lifeContext}

${convState.directive}
${emotionalCalibration.directive}
${turnTaking.directive}
${rhythm.directive}
${humorTiming.directive}
${humorDecision.directive ? `${humorDecision.directive}` : ''}

${continuityDirectives}
${topicDirectives}
${storyContext}
${memoryPromptStr}

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

        const cleanPrompt = SecretVault.sanitizePrompt(masterPrompt);

        // 24. MULTI-TURN PAYLOAD
        const contents = [];
        for (const item of budgetedHistory) {
            if (item.role === 'user') {
                contents.push({ role: 'user', parts: [{ text: item.text }] });
            } else if (item.role === 'assistant') {
                contents.push({ role: 'model', parts: [{ text: item.text }] });
            }
        }
        contents.push({ role: 'user', parts: [{ text: inputSnippet }] });

        // 25. OBSERVABLE AI GATEWAY EXECUTION
        let rawDraft = "";
        await MessageLifecycleTracker.logPhase(lifecycleId, 'AI_GATEWAY_ATTEMPT', { 
            model: 'gemini-flash-lite', 
            imageCount: images.length, 
            hasAudio 
        });

        const gatewayRes = await this.gateway.generate(cleanPrompt, contents, corrId, images, quotedContext);

        if (gatewayRes.success) {
            rawDraft = gatewayRes.text;
            trace.modelUsed = gatewayRes.modelUsed;
            await MessageLifecycleTracker.logPhase(lifecycleId, 'AI_GENERATED', { model: gatewayRes.modelUsed, latencyMs: gatewayRes.latencyMs });
            ProductionTelemetry72h.increment('aiGateway', 'geminiSuccess').catch(() => {});
        } else {
            console.warn(`[PersonalAIOS] AI Gateway failed (${gatewayRes.error}). Staying SILENT.`);
            await MessageLifecycleTracker.logPhase(lifecycleId, 'AI_GATEWAY_FAILED_SILENT', { reason: gatewayRes.error });
            ProductionTelemetry72h.increment('conversation', 'aiFailedSilent').catch(() => {});
            return null; // SILENT: Never send robotic/canned templates to WhatsApp!
        }

        // 26. CONVERSATION QUALITY GATE & BUDGET ENFORCEMENT
        const qualityVerdict = ConversationQualityGate.validateDraft(rawDraft, {
            verifiedFacts: isolatedFacts,
            maxWords: Math.min(turnTaking.maxWords, responseBudget.maxWords)
        });

        let sanitizedOutput = StyleDNA.formatOutput(qualityVerdict.sanitizedText, dna);
        sanitizedOutput = HumanUXEngine.contextualizeEmojis(sanitizedOutput, socialDynamics.energy);
        await MessageLifecycleTracker.logPhase(lifecycleId, 'QUALITY_CHECKED', { score: qualityVerdict.qualityScore });

        // 27. ANTI-REPETITION & DUPLICATE RESPONSE GUARD
        const recentResponses = await AntiRepetitionEngine.getRecentResponses(chatId);
        if (AntiRepetitionEngine.isRepetitive(sanitizedOutput, recentResponses)) {
            sanitizedOutput = AntiRepetitionEngine.applyControlledVariance(sanitizedOutput);
        }

        const allowSend = DuplicateResponseGuard.shouldSend(chatId, sanitizedOutput);
        if (!allowSend) {
            console.warn(`[PersonalAIOS] Duplicate response blocked for ${chatId}. Staying SILENT.`);
            await MessageLifecycleTracker.logPhase(lifecycleId, 'DUPLICATE_BLOCKED_SILENT', {});
            return null; // SILENT
        }

        trace.finalMessage = sanitizedOutput;
        trace.qualityScore = qualityVerdict.qualityScore;
        trace.latencyMs = Date.now() - startTime;

        await MessageLifecycleTracker.logPhase(lifecycleId, 'COMPLETED', { outcome: trace.modelUsed, outputText: sanitizedOutput });
        ProductionTelemetry72h.increment('messages', 'generated').catch(() => {});

        // 28. RECORD VISUAL OBSERVATION FOR CONVERSATION CONTINUITY
        if (hasImages) {
            VisualConversationContinuity.recordVisualObservation(chatId, inputSnippet);
        }

        // 29. PERSIST CLEAN WORKING MEMORY (ISOLATED)
        if (!sanitizedOutput.includes('nge-lag') && !sanitizedOutput.includes('offline')) {
            memData.working_memory.push({ role: 'user', text: inputSnippet, timestamp: Date.now() });
            memData.working_memory.push({ role: 'assistant', text: sanitizedOutput, timestamp: Date.now() });
            if (memData.working_memory.length > 20) {
                memData.working_memory = memData.working_memory.slice(-20);
            }
            await saveMemory(chatId, memData);

            this.memoryManager.extractAndStore(chatId, `${inputSnippet}\n${sanitizedOutput}`).catch(() => {});
            ConversationOutcomeTracker.updateFromTurn(chatId, inputSnippet, sanitizedOutput).catch(() => {});

            if (inputSnippet.length > 50 || inputSnippet.match(/(tadi kan|jadi gini|kemarin tuh)/i)) {
                StoryThreadTracker.recordStory(chatId, inputSnippet, topicGraph.currentTopic).catch(() => {});
            }
        }

        // 30. APPLY HUMAN INTERACTION POLICY
        const deliveryPlan = HumanInteractionPolicy.decideDelivery(inputSnippet, sanitizedOutput, { hasMedia: hasImages || hasAudio });

        return {
            ...deliveryPlan,
            text: sanitizedOutput
        };
    }
}
