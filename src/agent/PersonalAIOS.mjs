// src/agent/PersonalAIOS.mjs — MILESTONE V6.1 (CONVERSATION INTELLIGENCE LAYER)

import { AIResourceManager2 } from '../fleet/AIResourceManager2.mjs';
import { LightweightRouter } from '../fleet/LightweightRouter.mjs';
import { StyleDNA } from '../communication/StyleDNA.mjs';
import { TopicGraph } from '../topics/TopicGraph.mjs';
import { HumorEngine } from '../humor/HumorEngine.mjs';
import { CallbackMemory } from '../humor/CallbackMemory.mjs';
import { CurhatEngine } from '../social/CurhatEngine.mjs';
import { OpenLoopEngine } from '../communication/OpenLoopEngine.mjs';
import { ConversationContinuation } from '../conversation/ConversationContinuation.mjs';
import { ResponseLengthController } from '../communication/ResponseLengthController.mjs';
import { BubbleComposer } from '../communication/BubbleComposer.mjs';

import { ContextCompressor } from '../context/ContextCompressor.mjs';
import { SecretVault } from '../security/SecretVault.mjs';
import { MemoryFirewall } from '../security/MemoryFirewall.mjs';
import { ReplayDebugger } from '../eval/ReplayDebugger.mjs';

import { ConversationPerception } from '../perception/ConversationPerception.mjs';
import { MomentumTracker } from '../perception/MomentumTracker.mjs';
import { EmotionalState } from '../communication/EmotionalState.mjs';
import { ConversationRepair } from '../communication/ConversationRepair.mjs';
import { RelationshipProfile } from '../communication/RelationshipProfile.mjs';
import { MemoryEvolution } from '../communication/MemoryEvolution.mjs';

import { loadMemory, saveMemory } from '../memory/MemoryStore.mjs';
import { MemoryManager } from '../memory/MemoryManager.mjs';

export class PersonalAIOS {
    constructor() {
        this.fleet = new AIResourceManager2();
        this.memoryManager = new MemoryManager(this.fleet);
    }

    async process(chatId, message, correlationId = null) {
        const corrId = correlationId || `conv_${chatId}_${Date.now()}`;
        const trace = { correlationId: corrId, chatId, message, steps: {} };

        // 1. FAST LIGHTWEIGHT ROUTER (Zero API quota on trivial single words)
        const lightResult = LightweightRouter.route(message);
        if (lightResult.handled) {
            trace.steps.source = 'LIGHTWEIGHT_ROUTER';
            ReplayDebugger.recordTrace(corrId, trace).catch(() => {});
            return lightResult.response;
        }

        // 2. CONVERSATION PERCEPTION & CURHAT / MODE DETECTION
        const perception = ConversationPerception.analyze(message);
        const curhatMode = CurhatEngine.detectMode(message);
        const repairCheck = ConversationRepair.detectMisunderstanding(message);
        const momentum = await MomentumTracker.updateState(chatId, perception);
        const emotionalState = EmotionalState.evaluate(message, perception, momentum);

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

        // 5. HUMOR & CALLBACK MEMORY
        const jokes = await CallbackMemory.getJokes(chatId);
        const matchedJoke = CallbackMemory.findMatchingJoke(chatId, message, jokes);
        const humorDecision = HumorEngine.evaluate(message, relationship.familiarity, matchedJoke);

        // 6. CONVERSATION CONTINUATION & LENGTH CONTROL
        const continuation = ConversationContinuation.evaluate(message, curhatMode.mode);
        const lengthBudget = ResponseLengthController.getLengthBudget(message, curhatMode.mode);

        // 7. MEMORY RETRIEVAL & FIREWALL
        let memData = await loadMemory(chatId);
        if (!memData.working_memory) memData.working_memory = [];
        if (!memData.facts) memData.facts = [];

        // Purge any contaminated error strings
        memData.working_memory = memData.working_memory.filter(m => 
            !m.text.includes('nge-lag') && !m.text.includes('offline')
        );

        memData.facts = MemoryEvolution.evolveFacts(memData.facts);
        const isolatedFacts = MemoryFirewall.filterForContact(memData.facts, chatId, chatId);
        const relevantFacts = MemoryEvolution.filterContextualFacts(isolatedFacts, message);
        const factsSummary = relevantFacts.length > 0
            ? relevantFacts.map(f => `- ${f.predicate || 'fakta'}: ${f.object}`).join('\n')
            : '';

        // 8. CONTEXT COMPRESSION
        const { summary, recentHistory } = ContextCompressor.compress(memData.working_memory, 8);

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
${factsSummary ? `Memori orang ini:\n${factsSummary}` : ''}

Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

        const cleanPrompt = SecretVault.sanitizePrompt(masterPrompt);

        // 10. MULTI-TURN CONTENTS
        const contents = [];
        for (const item of recentHistory) {
            if (item.role === 'user') {
                contents.push({ role: 'user', parts: [{ text: item.text }] });
            } else if (item.role === 'assistant') {
                contents.push({ role: 'model', parts: [{ text: item.text }] });
            }
        }
        contents.push({ role: 'user', parts: [{ text: message }] });

        // 11. SUB-SECOND FLEET GENERATION
        let rawDraft = "";
        try {
            rawDraft = await this.fleet.generateText(cleanPrompt, contents);
        } catch (e) {
            console.error('[PersonalAIOS Error]', e);
            rawDraft = "Bentar, agak nge-lag tadi jaringannya. Coba ulangi lagi ya!";
        }

        let refinedOutput = StyleDNA.formatOutput(rawDraft, dna);

        // 12. RECORD TRACE
        trace.steps = {
            mode: curhatMode.mode,
            humor: humorDecision.mode,
            topic: topicGraph.currentTopic,
            finalMessage: refinedOutput
        };
        ReplayDebugger.recordTrace(corrId, trace).catch(() => {});

        // 13. PERSIST CLEAN WORKING MEMORY
        if (!refinedOutput.includes('nge-lag') && !refinedOutput.includes('offline')) {
            memData.working_memory.push({ role: 'user', text: message, timestamp: Date.now() });
            memData.working_memory.push({ role: 'assistant', text: refinedOutput, timestamp: Date.now() });
            if (memData.working_memory.length > 20) {
                memData.working_memory = memData.working_memory.slice(-20);
            }
            await saveMemory(chatId, memData);
            this.memoryManager.extractAndStore(chatId, `${message}\n${refinedOutput}`).catch(() => {});

            // Register open loop if promising future activity
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
