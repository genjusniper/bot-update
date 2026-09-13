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
import { MoodEnergyMatcher } from '../behavior/MoodEnergyMatcher.mjs';
import { ConversationEndingDetector } from '../behavior/ConversationEndingDetector.mjs';
import { PersonalitySpectrumEngine } from '../behavior/PersonalitySpectrumEngine.mjs';
import { ConversationDirector } from '../behavior/ConversationDirector.mjs';
import { ConversationMomentumEngine } from '../behavior/ConversationMomentumEngine.mjs';
import { QuestionPressureEngine } from '../behavior/QuestionPressureEngine.mjs';
import { HumanUncertaintyEngine } from '../behavior/HumanUncertaintyEngine.mjs';
import { RelationshipDynamicsEngine } from '../behavior/RelationshipDynamicsEngine.mjs';
import { CoolSocialPersonaEngine } from '../behavior/CoolSocialPersonaEngine.mjs';
import { SocialEnergyEngine } from '../behavior/SocialEnergyEngine.mjs';
import { BehaviorDecisionOS } from '../behavior/BehaviorDecisionOS.mjs';
import { ConversationStateSnapshot } from '../behavior/ConversationStateSnapshot.mjs';
import { ResponseRepetitionGuard } from '../behavior/ResponseRepetitionGuard.mjs';
import { AgentBrain } from '../agent/AgentBrain.mjs';
import { WebSearchTool } from '../tools/web/WebSearchTool.mjs';
import { ObserverAdapter } from '../core/signals/ObserverAdapter.mjs';
import { SignalFusion } from '../core/signals/SignalFusion.mjs';
import { SignalTelemetry } from '../core/signals/SignalTelemetry.mjs';
import { CanonicalMessage } from '../core/ingress/CanonicalMessage.mjs';
import { PersonalSimulationKernel } from '../core/kernel/PersonalSimulationKernel.mjs';
import { PersonalLifeGraphEngine } from '../cognitive/PersonalLifeGraphEngine.mjs';
import { SituationAwarenessEngine } from '../cognitive/SituationAwarenessEngine.mjs';
import { EpistemicPartitionEngine } from '../core/reasoning/EpistemicPartitionEngine.mjs';
import { StyleTransformer } from '../core/style/StyleTransformer.mjs';
import { BehavioralFirewall } from '../core/firewall/BehavioralFirewall.mjs';
import { ConversationTextureEngine } from '../core/style/ConversationTextureEngine.mjs';
import { HumorBudgetEngine } from '../core/interaction/HumorBudgetEngine.mjs';
import { UniversalCapabilityFabric } from '../core/whatsapp/UniversalCapabilityFabric.mjs';
import { GlobalCommandDetector } from '../core/control/GlobalCommandDetector.mjs';
import { GlobalControlPlane } from '../core/control/GlobalControlPlane.mjs';
import { RealityGroundingLayer } from '../core/fabric/RealityGroundingLayer.mjs';
import { FactEvidenceComparator } from '../core/fabric/FactEvidenceComparator.mjs';

import { RecommendationEngine } from '../behavior/RecommendationEngine.mjs';
import { LifeBrain } from '../subsystems/life/LifeBrain.mjs';
import { LifeCompanionEngine } from '../subsystems/life/LifeCompanionEngine.mjs';
import { SocialBrain } from '../subsystems/social/SocialBrain.mjs';
import { HumanUXEngine } from '../subsystems/ux/HumanUXEngine.mjs';
import { ConversationDebugger } from '../subsystems/observability/ConversationDebugger.mjs';

import { LightweightRouter } from '../fleet/LightweightRouter.mjs';
import { ContextBudgetManager } from '../context/ContextBudgetManager.mjs';
import { StyleDNA } from '../communication/StyleDNA.mjs';
import { NaturalConversationEnhancer } from '../communication/NaturalConversationEnhancer.mjs';
import { ContextualConversationIntelligence } from '../communication/ContextualConversationIntelligence.mjs';
import { ConversationalLogicEngine } from '../communication/ConversationalLogicEngine.mjs';

import { ConversationStateEngine } from '../conversation/ConversationStateEngine.mjs';
import { ConversationContinuityLock } from '../conversation/ConversationContinuityLock.mjs';
import { ConversationOutcomeTracker } from '../conversation/ConversationOutcomeTracker.mjs';
import { HumanRhythmEngine } from '../conversation/HumanRhythmEngine.mjs';
import { TurnTakingEngine } from '../conversation/TurnTakingEngine.mjs';
import { StoryThreadTracker } from '../conversation/StoryThreadTracker.mjs';
import { ConversationalReactionEngine } from '../conversation/ConversationalReactionEngine.mjs';
import { ConversationContinuityEngine } from '../conversation/ConversationContinuityEngine.mjs';
import { StoryBrain } from '../conversation/StoryBrain.mjs';

import { TopicGraphEngine } from '../topics/TopicGraphEngine.mjs';
import { TopicTransitionEngine } from '../topics/TopicTransitionEngine.mjs';
import { ConversationRepairEngine as ConversationRepairEngineNew } from '../conversation/ConversationRepairEngine.mjs';
import { CallbackEngine } from '../conversation/CallbackEngine.mjs';
import { SocialContextEngine } from '../subsystems/social/SocialContextEngine.mjs';
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

// ========================
// VIRTUAL SALES OS MODULES (PHASE 5)
// ========================
import { SalesExecutionOS } from '../sales/SalesExecutionOS.mjs';
import { CognitivePersonaLayer } from '../os/cognition/CognitivePersonaLayer.mjs';


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

        const isSelfChat = Boolean(
            chatId === '236322690191595@lid' ||
            chatId.includes('236322690191595') ||
            mediaOptions.isOwner ||
            mediaOptions.isSelfChat ||
            (ownerJid && chatId.replace(/\D/g, '').includes(ownerJid.split(':')[0].split('@')[0]))
        );

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

        // Phase 27 & 28: Universal Capability Fabric & Multimodal Processing Ingress
        let fabricBundle = null;
        try {
            fabricBundle = UniversalCapabilityFabric.processEvent(rawMessage || { key: { remoteJid: chatId } }, {
                chatId,
                senderId: effectiveSender,
                senderName: pushName,
                text: inputSnippet,
                isGroup,
                hasImage: hasImages,
                hasAudio,
                images,
                audio,
                quotedContext
            });
            console.log(`[CapabilityFabric] 🌐 Event processed [Type: ${fabricBundle.canonicalEvent.eventType} | Modality: ${fabricBundle.multimodalContent?.type} | ID: ${fabricBundle.fabricId}]`);
        } catch (fabErr) {
            console.warn('[CapabilityFabric] ⚠️ Ingress warning:', fabErr.message);
        }

        // Phase 28A: Global Command & Control Plane (Universal Chat-Agnostic Interceptor)
        const controlDetect = GlobalCommandDetector.detect(inputSnippet);
        if (controlDetect.isControlCommand) {
            console.log(`[GlobalControlPlane] ⚡ Command detected: ${controlDetect.intent} from ${effectiveSender} in ${chatId}`);
            const controlResult = await GlobalControlPlane.execute({
                action: controlDetect.intent,
                args: controlDetect.args,
                senderId: effectiveSender,
                chatId,
                waGateway: mediaOptions.waGateway || null
            });
            if (controlResult.output) {
                return { text: controlResult.output, options: {} };
            }
            if (controlResult.requiresExit) {
                return null;
            }
        }

        // 0. SALES COMMAND OS (Interceptor) - Check if Mas Agus sent a command
        if (rawText.startsWith('!') && mediaOptions.fromMe) {
            const { SalesCommandOS } = await import('../sales/SalesCommandOS.mjs');
            const targetPhone = isGroup ? null : chatId; // fallback
            const cmdRes = SalesCommandOS.execute(rawText, targetPhone);
            return { text: cmdRes, options: {} };
        }

        // [NEW] PHASE 8: ORDER FULFILLMENT INTERCEPTOR
        try {
            const { OrderFulfillmentOS } = await import('../sales/OrderFulfillmentOS.mjs');
            const orderReply = await OrderFulfillmentOS.processIncomingMessage(chatId, inputSnippet, pushName);
            if (orderReply) {
                await MessageLifecycleTracker.logPhase(lifecycleId, 'ORDER_FULFILLED_AUTO', { action: 'SENT_INVOICE' });
                return { text: orderReply }; // Bypass seluruh AI ngobrol, langsung kirim rekapan
            }
        } catch (e) {
            console.error('[PersonalAIOS] ❌ Gagal mengeksekusi OrderFulfillmentOS:', e.message);
        }

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

        // 16. LOAD & CONSOLIDATE MEMORY (HARD ISOLATED BY CHATID)
        let memData = await loadMemory(chatId);
        if (!memData.working_memory) memData.working_memory = [];
        memData.working_memory = memData.working_memory.filter(m => 
            !m.text.includes('nge-lag') && !m.text.includes('offline')
        );

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

        // PHASE 2: BEHAVIOR SIGNAL FUSION ARCHITECTURE
        let fusedSnapshot = null;
        try {
            const canonicalInput = new CanonicalMessage({
                id: lifecycleId,
                chatId,
                senderId: effectiveSender,
                pushName,
                text: inputSnippet,
                isGroup,
                groupSubject,
                fromMe: mediaOptions.fromMe || false
            });
            const extractedSignals = await ObserverAdapter.collectAll(canonicalInput, { chatId });
            fusedSnapshot = SignalFusion.fuse(extractedSignals, { chatId, senderId: effectiveSender, pushName });
            SignalTelemetry.record(fusedSnapshot);
            console.log(`[SignalFusion] 🧬 Snapshot ${fusedSnapshot.snapshotId} [Intent: ${fusedSnapshot.dimensions.intent} | Emotion: ${fusedSnapshot.dimensions.emotionValence} (${fusedSnapshot.dimensions.emotionalIntensity}) | Humor: ${fusedSnapshot.dimensions.humorPermission}]`);
        } catch (sigErr) {
            console.warn('[SignalFusion] ⚠️ Signal fusion error:', sigErr.message);
        }

        // 13.4. PERSONAL DIGITAL TWIN SIMULATION KERNEL (PHASE 3)
        let personalContract = null;
        let personalDirective = '';
        if (fusedSnapshot) {
            try {
                personalContract = PersonalSimulationKernel.synthesize(fusedSnapshot, { 
                    text: inputSnippet,
                    senderJid: effectiveSender,
                    senderName: pushName,
                    chatId,
                    isGroup,
                    isOwner: isSelfChat
                });
                personalDirective = PersonalSimulationKernel.formatContractForPrompt(personalContract);
                console.log(`[SimulationKernel] 🧠 Strategy: ${personalContract.what.strategy} | Tone: ${personalContract.how.tone} | MaxWords: ${personalContract.how.maxWords} | CogMode: ${personalContract.cognitive?.mode}`);
            } catch (kErr) {
                console.warn('[SimulationKernel] ⚠️ Kernel synthesis error:', kErr.message);
            }
        }

        // 13.5. AGENT BRAIN PIPELINE (CommandInterpreter, ToolRouter & TaskStateMemory)
        let agentContext = '';
        const interpretedCmd = AgentBrain.interpret(inputSnippet, memData.working_memory);
        if (interpretedCmd.intent !== 'NONE') {
            console.log(`[AgentPipeline] 🤖 Command detected: ${interpretedCmd.intent} -> ${interpretedCmd.query || ''}`);
            const execRes = await AgentBrain.execute(chatId, interpretedCmd);
            if (execRes.success) {
                agentContext = execRes.context;
            }
        }

        let agentDirectives = `=== AGENT DIRECTIVES ===\n- RESPONSE MODE: ${interpretedCmd.responseMode}\n`;
        if (interpretedCmd.isAmbiguous) {
            agentDirectives += `- AMBIGUITY CLARIFICATION REQUIRED: Tanyakan klarifikasi ini ke user secara langsung: "${interpretedCmd.ambiguityClarification}"\n`;
        }
        agentDirectives += `========================`;

        // 13.6. VIRTUAL SALES OS PIPELINE (DELEGATED TO SalesExecutionOS)
        let salesDirective = '';
        try {
            const execRes = await SalesExecutionOS.processIncoming(chatId, inputSnippet, memData.working_memory);
            if (execRes && execRes.isSales) {
                if (execRes.action === 'SILENT') {
                    await MessageLifecycleTracker.logPhase(lifecycleId, 'SALES_OS_BLOCKED_SILENT', { reason: 'Blocked by Governor/ExecutionOS' });
                    return null; // SILENT
                }
                salesDirective = execRes.directive || '';
            }
        } catch (salesErr) {
            console.warn(`[PersonalAIOS] ⚠️ SalesExecutionOS error: ${salesErr.message}`);
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
        const responseBudget = ResponseBudgetEngine.calculateBudget(inputSnippet, moodState, { hasImage: hasImages, hasAudio }, isSelfChat);

        trace.socialMode = socialDynamics.mode;
        trace.energy = socialDynamics.energy;
        trace.budgetTier = responseBudget.tier;

        if (memData.working_memory.length > 15) {
            MemoryConsolidationPipeline.consolidateWorkingMemory(chatId, memData.working_memory).catch(() => {});
        }

        // 17. CONVERSATION STATE & CONTINUITY LOCK
        const convState = ConversationStateEngine.evaluateState(inputSnippet);
        const emotionalCalibration = EmotionalCalibrationEngine.calibrate(inputSnippet);
        const turnTaking = TurnTakingEngine.evaluateTurn(inputSnippet, memData.working_memory, 1, isSelfChat);
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
            const hasPdf = images.some(img => img.mimeType === 'application/pdf' || img.isDocument);
            if (hasPdf) {
                multimodalDirective = `PANDUAN DOKUMEN PDF: User mengirimkan file dokumen PDF kepada kamu! Analisis, baca, dan pahami seluruh teks, tabel, serta angka di dalam dokumen PDF ini secara cermat, akurat, dan solutif. Berikan jawaban atau ringkasan yang jelas dan to-the-point sesuai kebutuhan user.`;
            } else {
                multimodalDirective = `PANDUAN MULTI-FOTO / SLIDE / VISION: User mengirim ${images.length} foto/slide ke kamu! Analisis seluruh sudut/slide foto secara komprehensif, santai, dan to-the-point.\n${ProductLocationAdvisor.getProductDirective()}\n${ProductLocationAdvisor.getLocationDirective()}`;
            }
        } else if (hasAudio) {
            multimodalDirective = "PANDUAN VOICE NOTE: User mengirim rekaman suara ke kamu! Pahami maksud dan suasananya, lalu balas secara hangat dan akrab.";
        }

        const roleIdentity = isSelfChat
            ? `Kamu adalah SALIM, Personal AI Co-Pilot, Sparring Partner, & Sahabat Sejati milik Bos Agus Salim (panggil: Bos / Gus).
IDENTITAS & PRINSIP TUGAS:
1. SAHABAT CERDAS, HUMORIS, & ENAK DIAJAK NGOBROL:
   - Bicaralah santai, hidup, hangat, dan luwes (bahasa Indonesia santai, sesekali celetukan Jawa Semarangan yang pas).
   - Humoris, lucu, dan menghibur secara natural (ceng-cengan akrab, wit tajam, tidak kaku seperti robot kantor).
2. PARTNER TUMBUH BERSAMA (BIKIN BOS MAKIN PINTAR & DEWASA):
   - Gunakan lensa berpikir cerdas (Mental Models): *First Principles* (akar masalah), *Pareto 80/20* (20% aksi hasil 80%), dan *Stoikisme* (fokus hanya ke apa yang bisa dikontrol).
   - Ajarkan wawasan psikologi manusia praktis (cara membaca situasi, negosiasi win-win, menghadapi orang manipulatif/defensif).
   - PENDUKUNG KEDEWASAAN: Bantu Bos mengelola stres, kurangi overthinking, dan dorong ketenangan emosional saat situasi rumit.
3. PEMECAH MASALAH REALISTIS & ANTI "YES-MAN":
   - JANGAN JADI PENJILAT ("Yes-Man"). Kalau rencana Bos punya celah atau berisiko, katakan sejujurnya secara logis, lalu sodorkan alternatif terbaik.
   - Orientasi tindakan: Setiap masalah rumit dipecah jadi 1-2-3 langkah realistis yang bisa dieksekusi detik ini.
   - MEMPERMUDAH URUSAN: Jika Bos butuh komunikasi dengan rekan kerja/atasan/vendor, langsung buatkan draf kalimat siap copy-paste!
4. PANDUAN TEKNIS, KERJA, & HOBI:
   - Jika Bos minta bantuan teknis, coding, masalah HP/PC, urusan shift kerja, atau outdoor/gunung: Jelaskan secara terstruktur, jelas, dan tuntas sampai beres.
5. FORMAT OUTPUT:
   - Gunakan format rapi, poin-poin jelas, dan bahasa santai agar nyaman dibaca di layar WhatsApp HP.`
            : `IDENTITAS MUTLAK: Kamu adalah AGUS (panggilan akrab: Agus / Mas Agus). Kamu adalah pemilik asli nomor WhatsApp ini.
- Bicaralah selalu sebagai AGUS SALIM / AGUS (orang pertama: aku / kulo / gue), BUKAN asisten, BUKAN pihak ketiga, BUKAN bot, BUKAN AI.
- JANGAN PERNAH mengaku atau menyebut kata 'bot', 'AI', 'asisten', atau 'sistem'. Jika ada yang bercanda 'Kie bot po?', tolak santai: 'Lha sopo maneh wkwk, yo aku Agus to'.

KARAKTER & SIKAP (COOL, LUCU, SANTAI, GAK SOK ASIK):
1. JANGAN SOK ASIK & JANGAN LEBAY: Bicara santai, tenang, percaya diri, dan wajar layaknya orang beneran. Jangan memaksakan lelucon garing atau sok akrab berlebihan.
2. DILARANG KERAS DIKIT-DIKIT NYURUH NGOPI / NGAJAK NGOPI! Kata 'ngopi', 'kurang ngopi', 'mlipir ngopi' itu klise murahan dan garing. HINDARI kata ngopi kecuali lawan bicaramu yang duluan mengajak ngopi secara eksplisit.
3. HUMOR YANG KEREN, DEADPAN & NATURAL:
   - Tanggapi LANGSUNG topik yang sedang dibahas lawan bicara dengan celetukan pas, sedikit sarkas halus atau ceng-cengan akrab tapi tetap cool.
   - Contoh saat teman bahas motor bore-up: tanggapi urusan motor/kantongnya ("nek jebol yo nangis kowe nif", "bore up mung nggo tuku lombok po piye"), BUKAN malah dialihkan suruh ngopi!
4. ADAPTASI GAYA LAWAN BICARA:
   - Dengan teman akrab cowok (Hanif, dll.): Gunakan bahasa Jawa Semarangan santai, ceplas-ceplos akrab (contoh: "lha piye to", "rasah neko-neko", "santai wae").
   - Dengan cewek (Cindy, dll.): Bahasa Indonesia santai, ramah, hangat, dan wajar.

ATURAN FORMAT WHATSAPP:
1. SUPER SINGKAT & PADAT (3 - 10 kata per kalimat). JANGAN menulis esai panjang lebar!
2. DILARANG menggunakan tanda seru (!) atau tanda titik (.) di akhir pesan. Biarkan ujung kalimat santai tanpa tanda baca kaku.
3. BALAS BERUNTUN: Jika ada reaksi + jawaban, pisahkan dengan 1 baris baru (\n) agar terkirim sebagai 2 bubble chat pendek beruntun.
4. BERSIH & NO TOXIC: DILARANG KERAS menggunakan kata-kata kotor/toxic (seperti cok, cuk, asu, matamu, ndasmu, anjing, goblok, pantek). Selalu berbicara santai, bersih, dan beradab.
5. BATASI TAWA: Maksimal gunakan tawa (wkwk/haha) satu kali saja jika relevan. Jangan ketawa-ketawa garing sendiri!`;

        const outcomeData = await ConversationOutcomeTracker.loadOutcome(chatId);
        const outcomeDirectives = ConversationOutcomeTracker.formatDirectives(outcomeData);
        const naturalEnhancement = NaturalConversationEnhancer.evaluate({ text: inputSnippet, chatId, pushName });
        const contextualIntelligence = ContextualConversationIntelligence.evaluate({ text: inputSnippet, hasAudio, hasImages, quotedContext, chatId });
        const moodEvaluation = MoodEnergyMatcher.evaluate(inputSnippet);
        const conversationalLogic = ConversationalLogicEngine.evaluate({ text: inputSnippet, pushName, chatId });
        const reactionEngineDirective = ConversationalReactionEngine.evaluate({ text: inputSnippet, chatId, pushName, history: memData.working_memory });
        const personalitySpectrum = PersonalitySpectrumEngine.evaluate({ text: inputSnippet, chatId, pushName, conversationState: convState.phase, history: memData.working_memory });
        const continuityEngineDirective = await ConversationContinuityEngine.evaluate({ text: inputSnippet, chatId, outcomeTrackerData: outcomeData });
        const storyBrainDirective = await StoryBrain.evaluate({ text: inputSnippet, chatId, pushName, history: memData.working_memory });

        const repairRes = ConversationRepairEngineNew.evaluate({ text: inputSnippet, chatId });
        const callbackRes = CallbackEngine.evaluate({ text: inputSnippet, chatId, outcomeData });
        const socialCtxRes = SocialContextEngine.evaluate({ text: inputSnippet, chatId, pushName });

        const snapshot = ConversationStateSnapshot.create({ text: inputSnippet, chatId, pushName, history: memData.working_memory, currentMode: convState.phase });
        const behaviorOSRes = BehaviorDecisionOS.evaluate({ text: inputSnippet, chatId, snapshot, history: memData.working_memory });
        const recommendRes = RecommendationEngine.evaluate({ text: inputSnippet, chatId, searchContext: agentContext, history: memData.working_memory });

        let lifeGraphDirective = '';
        let situationDirective = '';
        let epistemicDirective = '';
        let cognitivePersonaDirective = '';
        let verifiedGroundFacts = [];
        if (isSelfChat) {
            try {
                cognitivePersonaDirective = CognitivePersonaLayer.evaluate({
                    text: inputSnippet,
                    chatId,
                    isSelfChat: true,
                    history: memData.working_memory
                });
            } catch (cpErr) {
                console.warn('[PersonalAIOS] ⚠️ CognitivePersonaLayer error:', cpErr.message);
            }
            lifeGraphDirective = PersonalLifeGraphEngine.formatContextDirective(inputSnippet);
            const situationSnapshot = SituationAwarenessEngine.evaluate({ text: inputSnippet });
            situationDirective = SituationAwarenessEngine.formatDirective(situationSnapshot);

            // Epistemic Partitioning: Grounded Facts vs Inferences vs Predictions
            try {
                verifiedGroundFacts = PersonalLifeGraphEngine.getFacts(inputSnippet);
                const inferences = [];
                const predictions = [];
                if (situationSnapshot.intentImplication) {
                    inferences.push(`Tersirat: ${situationSnapshot.intentImplication.implied}`);
                    inferences.push(`Tujuan utama Bos: ${situationSnapshot.intentImplication.goal}`);
                    predictions.push(`Langkah efisien berikutnya: ${situationSnapshot.intentImplication.nextProbableAction}`);
                }
                if (situationSnapshot.hasUrgency) {
                    inferences.push(`Kondisi mendesak, utamakan efisiensi kognitif Bos.`);
                }

                const partitionRecord = EpistemicPartitionEngine.partition({
                    facts: verifiedGroundFacts,
                    inferences,
                    predictions
                });
                epistemicDirective = EpistemicPartitionEngine.formatForPrompt(partitionRecord);
            } catch (epErr) {
                console.warn('[PersonalAIOS] ⚠️ EpistemicPartition error:', epErr.message);
            }
        }

        const masterPrompt = isSelfChat
            ? `${roleIdentity}

${cognitivePersonaDirective}
${personalDirective ? `\n${personalDirective}\n` : ''}
${epistemicDirective}
${lifeGraphDirective}
${situationDirective}
${agentDirectives}
${multimodalDirective}
${linkContext}
${agentContext}
${memoryPromptStr}

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`
            : `${roleIdentity}

${personaLock}
${personalDirective ? `\n${personalDirective}\n` : ''}
${contactDirectives}
${outcomeDirectives}
${continuityEngineDirective}
${storyBrainDirective}
${repairRes.directive}
${callbackRes.directive}
${socialCtxRes}
${behaviorOSRes.directive}
${recommendRes.directive}
${agentDirectives}
${naturalEnhancement}
${contextualIntelligence}
${visualContinuity}
${timeCtx.directive}
${styleDirectives}
${multimodalDirective}

${linkContext}
${agentContext}
${salesDirective}
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
            if (isSelfChat && verifiedGroundFacts.length > 0) {
                const antiHallucination = EpistemicPartitionEngine.enforceAntiHallucination(rawDraft, verifiedGroundFacts);
                if (!antiHallucination.passed) {
                    console.log(`[Epistemic] 🛡️ Sanitized draft from ungrounded certainty:`, antiHallucination.flaggedClaims);
                    rawDraft = antiHallucination.sanitizedText;
                }
            }
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
            isOwner: isSelfChat,
            maxWords: isSelfChat ? 400 : Math.min(turnTaking.maxWords, responseBudget.maxWords)
        });

        // 26.5 MESSAGE RISK GUARD (SALES ONLY) - DELEGATED TO SalesExecutionOS
        try {
            const isValid = SalesExecutionOS.validateOutgoing(chatId, qualityVerdict.sanitizedText, memData.working_memory);
            if (!isValid) {
                console.warn(`[PersonalAIOS] 🛑 SalesExecutionOS blocked outgoing message. Staying SILENT.`);
                await MessageLifecycleTracker.logPhase(lifecycleId, 'SALES_OS_BLOCKED_SILENT', { reason: 'Blocked by SalesExecutionOS' });
                return null;
            }
        } catch (e) {
            console.warn(`[PersonalAIOS] SalesExecutionOS outgoing check error: ${e.message}`);
        }

        let sanitizedOutput = StyleDNA.formatOutput(qualityVerdict.sanitizedText, dna);
        if (!isSelfChat) {
            sanitizedOutput = sanitizedOutput.replace(/!+/g, ''); // 100% strip exclamation marks for casual WhatsApp style
        }
        sanitizedOutput = sanitizedOutput.replace(/\b(cok|cuk|asu|matamu|ndasmu|pantek|anjing|bangsat|goblok|babi|kontol|memek|jembut)\b/gi, ''); // 100% strip toxic/profanities
        
        // Anti-Laughter Overload (No duplicate wkwk/haha, max one)
        if (sanitizedOutput.toLowerCase().includes('wkwk') && sanitizedOutput.toLowerCase().includes('haha')) {
            sanitizedOutput = sanitizedOutput.replace(/\b(haha|hahaha)\b/gi, '');
        }
        const wkwkMatches = sanitizedOutput.match(/wkwk/gi);
        if (wkwkMatches && wkwkMatches.length > 1) {
            sanitizedOutput = sanitizedOutput.replace(/wkwk/gi, (match, offset, string) => {
                return offset === string.toLowerCase().indexOf('wkwk') ? 'wkwk' : '';
            });
        }

        sanitizedOutput = sanitizedOutput.replace(/\s{2,}/g, ' ').trim();
        sanitizedOutput = sanitizedOutput.replace(/\.+$/, ''); // 100% strip any trailing periods at the end of the message!
        sanitizedOutput = HumanUXEngine.contextualizeEmojis(sanitizedOutput, socialDynamics.energy);
        const transformedResult = StyleTransformer.transform(sanitizedOutput, personalContract);
        sanitizedOutput = transformedResult.fullText || sanitizedOutput;
        sanitizedOutput = CognitivePersonaLayer.calibrateOutput(sanitizedOutput, isSelfChat);

        // 26.6 BEHAVIORAL FIREWALL (PHASE 13)
        if (personalContract) {
            const firewallVerdict = BehavioralFirewall.validate(sanitizedOutput, personalContract, {
                chatId,
                isGroup: Boolean(chatId.endsWith('@g.us'))
            });
            if (!firewallVerdict.isValid) {
                console.log(`[BehavioralFirewall] 🛡️ Violations: ${firewallVerdict.violations.join(', ')} -> Action: ${firewallVerdict.action}`);
            }
            sanitizedOutput = firewallVerdict.sanitizedText;

            // 26.7 CONVERSATION TEXTURE & WHATSAPP BUBBLE CALIBRATION (PHASE 14)
            if (personalContract.interaction) {
                const textureResult = ConversationTextureEngine.apply(sanitizedOutput, personalContract.interaction);
                sanitizedOutput = textureResult.fullText || sanitizedOutput;

                if (sanitizedOutput.toLowerCase().includes('wkwk') || sanitizedOutput.toLowerCase().includes('haha')) {
                    HumorBudgetEngine.recordHumorUsed(chatId);
                }
            }
        }

        // 26.8 REALITY GROUNDING & FACT COMPARATOR (PHASE 31)
        try {
            const factVerdict = FactEvidenceComparator.compareDraft({
                draftResponse: sanitizedOutput,
                groundTruths: [
                    { subject: 'Agus Salim', predicate: 'IS_OWNER', truthValue: true }
                ],
                systemFacts: {
                    isOnline: true,
                    hasDatabase: true
                }
            });
            if (!factVerdict.isValid) {
                console.warn(`[FactEvidenceComparator] 🛡️ Contradictions detected:`, factVerdict.contradictions.map(c => c.type).join(', '));
                if (factVerdict.requiresRejection) {
                    console.warn(`[FactEvidenceComparator] 🛑 Dropping contradictory hallucinated draft. Staying SILENT.`);
                    return null;
                }
            }
        } catch (fecErr) {
            console.warn('[FactEvidenceComparator] ⚠️ Comparison warning:', fecErr.message);
        }

        await MessageLifecycleTracker.logPhase(lifecycleId, 'QUALITY_CHECKED', { score: qualityVerdict.qualityScore });


        // 27. ANTI-REPETITION & DUPLICATE RESPONSE GUARD
        const recentResponses = await AntiRepetitionEngine.getRecentResponses(chatId);
        if (AntiRepetitionEngine.isRepetitive(sanitizedOutput, recentResponses)) {
            sanitizedOutput = AntiRepetitionEngine.applyControlledVariance(sanitizedOutput);
        }
        sanitizedOutput = ResponseRepetitionGuard.checkAndDiversify(sanitizedOutput, memData.working_memory);

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

        // 30. ORCHESTRATE FINAL PLAN VIA CONVERSATION DIRECTOR (REPLY/REACT/SILENT/PACING)
        const deliveryPlan = ConversationDirector.orchestrate({
            text: inputSnippet,
            chatId,
            pushName,
            rawResponse: sanitizedOutput,
            conversationState: convState.phase,
            topicOutcome: outcomeData,
            isOwner: isSelfChat,
            socialDynamics: {
                ...socialDynamics,
                history: memData.working_memory
            }
        });

        return deliveryPlan;
    }
}
