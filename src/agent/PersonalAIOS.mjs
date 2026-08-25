// src/agent/PersonalAIOS.mjs — UNIVERSAL PERSONAL AI OS (V6.3 ADVANCED CONVERSATION INTELLIGENCE)

import { AIResourceManager2 } from '../fleet/AIResourceManager2.mjs';
import { LightweightRouter } from '../fleet/LightweightRouter.mjs';
import { AdaptiveModelRouter } from '../fleet/AdaptiveModelRouter.mjs';
import { ProviderHealthMatrix } from '../fleet/ProviderHealthMatrix.mjs';

import { ContextBudgetManager } from '../context/ContextBudgetManager.mjs';
import { StyleDNA } from '../communication/StyleDNA.mjs';
import { ConversationStateEngine } from '../conversation/ConversationStateEngine.mjs';
import { TopicGraphEngine } from '../topics/TopicGraphEngine.mjs';
import { AdvancedHumorEngine } from '../humor/AdvancedHumorEngine.mjs';
import { CallbackRegistry } from '../humor/CallbackRegistry.mjs';
import { CurhatEngine } from '../social/CurhatEngine.mjs';
import { OpenLoopEngine } from '../communication/OpenLoopEngine.mjs';
import { ConversationContinuation } from '../conversation/ConversationContinuation.mjs';
import { ResponseLengthController } from '../communication/ResponseLengthController.mjs';
import { AntiRepetitionEngine } from '../communication/AntiRepetitionEngine.mjs';
import { BubbleComposer } from '../communication/BubbleComposer.mjs';

import { MemoryOS } from '../memory/MemoryOS.mjs';
import { RelevanceMemoryRetrieval } from '../memory/RelevanceMemoryRetrieval.mjs';
import { SecretVault } from '../security/SecretVault.mjs';
import { MemoryFirewall } from '../security/MemoryFirewall.mjs';
import { ReplayStudio } from '../eval/ReplayStudio.mjs';

import { ConversationRepair } from '../communication/ConversationRepair.mjs';
import { RelationshipProfile } from '../communication/RelationshipProfile.mjs';

import { loadMemory, saveMemory } from '../memory/MemoryStore.mjs';
import { MemoryManager } from '../memory/MemoryManager.mjs';

export class PersonalAIOS {
    constructor() {
        this.fleet = new AIResourceManager2();
        this.memoryManager = new MemoryManager(this.fleet);
    }

    async process(chatId, message, correlationId = null) {
        const startTime = Date.now();
        const corrId = correlationId || `conv_${chatId}_${Date.now()}`;
        const trace = { correlationId: corrId, chatId, message };

        // 1. COMPLEXITY ROUTER & LOCAL FAST PATH
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

        // 2. MULTI-DIMENSIONAL CONVERSATION STATE & PHASE
        const convState = ConversationStateEngine.evaluateState(message);
        const curhatMode = CurhatEngine.detectMode(message);
        const repairCheck = ConversationRepair.detectMisunderstanding(message);

        trace.intent = convState.isQuestion ? 'question' : 'statement';
        trace.phase = convState.phase;
        trace.mode = curhatMode.mode;

        // 3. TOPIC GRAPH & ASSOCIATIVE CONTINUITY
        const topicGraph = await TopicGraphEngine.updateGraph(chatId, message);
        const topicDirectives = TopicGraphEngine.formatDirectives(topicGraph);
        const openLoops = await OpenLoopEngine.getLoops(chatId);
        const maturedLoops = OpenLoopEngine.getMaturedLoops(openLoops);
        const loopDirective = maturedLoops.length > 0 
            ? `- Rencana/Janji Tertunda: "${maturedLoops[0].statement}". Singgung jika relevan.` 
            : '';

        trace.topic = topicGraph.currentTopic;

        // 4. CONTEXTUAL CALLBACK HUMOR & HUMOR ENGINE
        const callbackEvents = await CallbackRegistry.getEvents(chatId);
        const matchedCallback = CallbackRegistry.findMatchingCallback(message, callbackEvents);
        const humorDecision = AdvancedHumorEngine.evaluate(message, convState, matchedCallback);

        trace.humorMode = humorDecision.mode;

        // 5. RELATIONSHIP & STYLE DNA (Authentic Jawa/Indonesian blend)
        const relationship = await RelationshipProfile.updateProfile(chatId);
        const dna = StyleDNA.getProfile(relationship.familiarity);
        const isJawa = Boolean(message.match(/(yo|ki|to|wae|lha|ngopo|piye|mangan|kue|kowe|opo|ora|ra|wis|wes|dadi)/i));
        const styleDirectives = StyleDNA.compileDirectives(dna, isJawa);

        // 6. CONTINUATION & LENGTH CONTROL
        const continuation = ConversationContinuation.evaluate(message, curhatMode.mode);
        const lengthBudget = ResponseLengthController.getLengthBudget(message, curhatMode.mode);

        // 7. MEMORY OS RETRIEVAL 2.0 (Scored relevance selection)
        let memOSData = await MemoryOS.getMemory(chatId);
        memOSData = MemoryOS.applyDecay(memOSData);

        const allFacts = [
            ...(memOSData.L2_semantic || []),
            ...(memOSData.L1_episodic || []).map(e => ({ predicate: 'kejadian', object: e.summary, importance: e.importance }))
        ];
        const relevantMemories = RelevanceMemoryRetrieval.retrieveTopMemories(allFacts, message, topicGraph.currentTopic, 3);
        const memoryPromptStr = relevantMemories.length > 0
            ? "=== MEMORI RELEVAN (RELEVANCE 2.0) ===\n" + relevantMemories.map(m => `- ${m.predicate}: ${m.object}`).join('\n')
            : '';

        // 8. WORKING MEMORY & CONTEXT BUDGET ALLOCATION (~2000 token limit)
        let memData = await loadMemory(chatId);
        if (!memData.working_memory) memData.working_memory = [];

        memData.working_memory = memData.working_memory.filter(m => 
            !m.text.includes('nge-lag') && !m.text.includes('offline')
        );

        const { history: budgetedHistory, estimatedTokens } = ContextBudgetManager.fitToBudget(memData.working_memory, 8);
        trace.tokensEstimated = estimatedTokens;

        // 9. MASTER SYSTEM INSTRUCTION
        const masterPrompt = `Kamu adalah teman ngobrol / asisten WhatsApp pribadi yang sangat asik, cerdas, santai, dan seru.

${styleDirectives}

${convState.directive}

=== MODE: ${curhatMode.mode} ===
${curhatMode.directive}
${lengthBudget.directive}
${continuation.suggestedBounce ? `[MOMENTUM]: ${continuation.suggestedBounce}` : ''}
${repairCheck.directive ? `[KOREKSI]: ${repairCheck.directive}` : ''}
${humorDecision.directive ? `${humorDecision.directive}` : ''}

${topicDirectives}
${loopDirective}
${memoryPromptStr}

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

        const cleanPrompt = SecretVault.sanitizePrompt(masterPrompt);

        // 10. MULTI-TURN PAYLOAD
        const contents = [];
        for (const item of budgetedHistory) {
            if (item.role === 'user') {
                contents.push({ role: 'user', parts: [{ text: item.text }] });
            } else if (item.role === 'assistant') {
                contents.push({ role: 'model', parts: [{ text: item.text }] });
            }
        }
        contents.push({ role: 'user', parts: [{ text: message }] });

        // 11. HEALTH-AWARE FLEET GENERATION
        const targetModel = ProviderHealthMatrix.getOptimalModel();
        let rawDraft = "";
        try {
            rawDraft = await this.fleet.generateText(cleanPrompt, contents);
            trace.modelUsed = targetModel;
            ProviderHealthMatrix.recordMetric(targetModel, true, Date.now() - startTime);
        } catch (e) {
            console.error('[PersonalAIOS Error]', e);
            rawDraft = "Bentar, agak nge-lag tadi jaringannya. Coba ulangi lagi ya!";
            trace.modelUsed = 'OFFLINE_FALLBACK';
            ProviderHealthMatrix.recordMetric(targetModel, false, Date.now() - startTime);
        }

        // 12. ANTI-REPETITION & REFINEMENT
        let refinedOutput = StyleDNA.formatOutput(rawDraft, dna);
        const recentResponses = await AntiRepetitionEngine.getRecentResponses(chatId);

        if (AntiRepetitionEngine.isRepetitive(refinedOutput, recentResponses)) {
            refinedOutput = AntiRepetitionEngine.applyControlledVariance(refinedOutput);
        }

        trace.finalMessage = refinedOutput;
        trace.latencyMs = Date.now() - startTime;

        // 13. RECORD TELEMETRY & REPLAY TRACE
        ReplayStudio.recordTrace(corrId, trace).catch(() => {});
        AntiRepetitionEngine.recordResponse(chatId, refinedOutput).catch(() => {});

        // 14. PERSIST CLEAN WORKING MEMORY & EVENT REGISTRATION
        if (!refinedOutput.includes('nge-lag') && !refinedOutput.includes('offline')) {
            memData.working_memory.push({ role: 'user', text: message, timestamp: Date.now() });
            memData.working_memory.push({ role: 'assistant', text: refinedOutput, timestamp: Date.now() });
            if (memData.working_memory.length > 20) {
                memData.working_memory = memData.working_memory.slice(-20);
            }
            await saveMemory(chatId, memData);

            this.memoryManager.extractAndStore(chatId, `${message}\n${refinedOutput}`).catch(() => {});

            // Auto-register funny callback event if humor detected
            if (message.match(/(diet|salah kirim|nabrak|apes|lucu)/i)) {
                CallbackRegistry.registerFunnyEvent(chatId, {
                    triggerKeyword: message.match(/(diet|salah kirim|nabrak|apes)/i)?.[0] || 'kejadian',
                    description: message.slice(0, 80)
                }).catch(() => {});
            }

            if (message.match(/(besok mau|nanti mau|rencananya mau|pengen nyoba)/i)) {
                OpenLoopEngine.registerLoop(chatId, {
                    topic: topicGraph.currentTopic,
                    statement: message.slice(0, 100)
                }).catch(() => {});
            }
        }

        return refinedOutput;
    }
}
