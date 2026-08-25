// src/agent/PersonalAIOS.mjs — PERSONAL COMMUNICATION OS (V6.2 ARCHITECTURE)

import { AIResourceManager2 } from '../fleet/AIResourceManager2.mjs';
import { LightweightRouter } from '../fleet/LightweightRouter.mjs';
import { AdaptiveModelRouter } from '../fleet/AdaptiveModelRouter.mjs';

import { ContextBudgetManager } from '../context/ContextBudgetManager.mjs';
import { StyleDNA } from '../communication/StyleDNA.mjs';
import { TopicGraph } from '../topics/TopicGraph.mjs';
import { HumorEngine } from '../humor/HumorEngine.mjs';
import { CallbackMemory } from '../humor/CallbackMemory.mjs';
import { CurhatEngine } from '../social/CurhatEngine.mjs';
import { OpenLoopEngine } from '../communication/OpenLoopEngine.mjs';
import { ConversationContinuation } from '../conversation/ConversationContinuation.mjs';
import { ResponseLengthController } from '../communication/ResponseLengthController.mjs';
import { AntiRepetitionEngine } from '../communication/AntiRepetitionEngine.mjs';
import { BubbleComposer } from '../communication/BubbleComposer.mjs';

import { MemoryOS } from '../memory/MemoryOS.mjs';
import { SecretVault } from '../security/SecretVault.mjs';
import { MemoryFirewall } from '../security/MemoryFirewall.mjs';
import { ReplayStudio } from '../eval/ReplayStudio.mjs';

import { ConversationPerception } from '../perception/ConversationPerception.mjs';
import { MomentumTracker } from '../perception/MomentumTracker.mjs';
import { EmotionalState } from '../communication/EmotionalState.mjs';
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

        // 1. COMPLEXITY EVALUATION & LIGHTWEIGHT FAST PATH
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

        // 2. CONVERSATION PERCEPTION & MODE DETECTION
        const perception = ConversationPerception.analyze(message);
        const curhatMode = CurhatEngine.detectMode(message);
        const repairCheck = ConversationRepair.detectMisunderstanding(message);
        const momentum = await MomentumTracker.updateState(chatId, perception);
        const emotionalState = EmotionalState.evaluate(message, perception, momentum);

        trace.intent = perception.intent;
        trace.mode = curhatMode.mode;

        // 3. RELATIONSHIP & STYLE DNA
        const relationship = await RelationshipProfile.updateProfile(chatId);
        const dna = StyleDNA.getProfile(relationship.familiarity);
        const isJawa = Boolean(message.match(/(yo|ki|to|wae|lha|ngopo|piye|mangan|kue|kowe|opo|ora|ra|wis|wes|dadi)/i));
        const styleDirectives = StyleDNA.compileDirectives(dna, isJawa);

        // 4. TOPIC GRAPH & OPEN LOOPS
        const topicGraph = await TopicGraph.updateTopic(chatId, message);
        const topicDirectives = TopicGraph.getTopicDirectives(topicGraph);
        const openLoops = await OpenLoopEngine.getLoops(chatId);
        const maturedLoops = OpenLoopEngine.getMaturedLoops(openLoops);
        const loopDirective = maturedLoops.length > 0 
            ? `- Rencana/Topik Tertunda: "${maturedLoops[0].statement}". Boleh di-follow up jika nyambung.` 
            : '';

        trace.topic = topicGraph.currentTopic;

        // 5. HUMOR & CALLBACK MEMORY
        const jokes = await CallbackMemory.getJokes(chatId);
        const matchedJoke = CallbackMemory.findMatchingJoke(chatId, message, jokes);
        const humorDecision = HumorEngine.evaluate(message, relationship.familiarity, matchedJoke);
        trace.humorMode = humorDecision.mode;

        // 6. CONTINUATION & LENGTH CONTROL
        const continuation = ConversationContinuation.evaluate(message, curhatMode.mode);
        const lengthBudget = ResponseLengthController.getLengthBudget(message, curhatMode.mode);

        // 7. MULTI-TIER MEMORY OS (L1-L4 with decay)
        let memOSData = await MemoryOS.getMemory(chatId);
        memOSData = MemoryOS.applyDecay(memOSData);
        const memoryOSContext = MemoryOS.formatPromptContext(memOSData);

        // 8. WORKING MEMORY & CONTEXT BUDGET ALLOCATION
        let memData = await loadMemory(chatId);
        if (!memData.working_memory) memData.working_memory = [];

        // Clean out legacy error strings
        memData.working_memory = memData.working_memory.filter(m => 
            !m.text.includes('nge-lag') && !m.text.includes('offline')
        );

        const { history: budgetedHistory, estimatedTokens } = ContextBudgetManager.fitToBudget(memData.working_memory, 8);
        trace.tokensEstimated = estimatedTokens;

        // 9. MASTER SYSTEM INSTRUCTION
        const masterPrompt = `Kamu adalah teman ngobrol / asisten WhatsApp pribadi yang sangat asik, cerdas, santai, dan seru.

${styleDirectives}

=== MODE PERCAKAPAN: ${curhatMode.mode} ===
${curhatMode.directive}
${lengthBudget.directive}
${continuation.suggestedBounce ? `[MOMENTUM]: ${continuation.suggestedBounce}` : ''}
${repairCheck.directive ? `[KOREKSI]: ${repairCheck.directive}` : ''}
${humorDecision.directive ? `${humorDecision.directive}` : ''}

${topicDirectives}
${loopDirective}
${memoryOSContext}

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

        // 11. FLEET GENERATION
        let rawDraft = "";
        try {
            rawDraft = await this.fleet.generateText(cleanPrompt, contents);
            trace.modelUsed = this.fleet.getHealthyModel();
        } catch (e) {
            console.error('[PersonalAIOS Error]', e);
            rawDraft = "Bentar, agak nge-lag tadi jaringannya. Coba ulangi lagi ya!";
            trace.modelUsed = 'OFFLINE_FALLBACK';
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

        // 14. PERSIST CLEAN MEMORY
        if (!refinedOutput.includes('nge-lag') && !refinedOutput.includes('offline')) {
            memData.working_memory.push({ role: 'user', text: message, timestamp: Date.now() });
            memData.working_memory.push({ role: 'assistant', text: refinedOutput, timestamp: Date.now() });
            if (memData.working_memory.length > 20) {
                memData.working_memory = memData.working_memory.slice(-20);
            }
            await saveMemory(chatId, memData);

            // Background Memory OS Extractors
            this.memoryManager.extractAndStore(chatId, `${message}\n${refinedOutput}`).catch(() => {});

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
