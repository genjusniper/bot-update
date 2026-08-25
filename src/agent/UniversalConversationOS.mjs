// src/agent/UniversalConversationOS.mjs
// UNIVERSAL PERSONAL CONVERSATION RUNTIME (V6.0 - V7.0 Complete Suite)

import { ConversationPerception } from '../perception/ConversationPerception.mjs';
import { MomentumTracker } from '../perception/MomentumTracker.mjs';
import { SocialBrain } from '../social/SocialBrain.mjs';
import { StoryEngine } from '../social/StoryEngine.mjs';
import { VentingEngine } from '../social/VentingEngine.mjs';
import { TopicMemoryGraph } from '../topics/TopicMemoryGraph.mjs';
import { TopicBridge } from '../topics/TopicBridge.mjs';
import { TopicRevival } from '../topics/TopicRevival.mjs';
import { HumorEngine } from '../humor/HumorEngine.mjs';
import { InsideJokeRegistry } from '../humor/InsideJokeRegistry.mjs';
import { RelationshipProfile } from '../communication/RelationshipProfile.mjs';
import { PersonalityEngine } from '../communication/PersonalityEngine.mjs';
import { ResponseStrategy } from '../communication/ResponseStrategy.mjs';
import { ConversationRhythm } from '../communication/ConversationRhythm.mjs';
import { StyleCompiler } from '../communication/StyleCompiler.mjs';
import { NaturalnessChecker } from '../communication/NaturalnessChecker.mjs';
import { FeedbackLearner } from '../communication/FeedbackLearner.mjs';
import { EmotionalState } from '../communication/EmotionalState.mjs';
import { SocialCalibration } from '../communication/SocialCalibration.mjs';
import { ConversationRepair } from '../communication/ConversationRepair.mjs';
import { TopicMomentum } from '../communication/TopicMomentum.mjs';
import { OpenLoopManager } from '../communication/OpenLoopManager.mjs';
import { MemoryEvolution } from '../communication/MemoryEvolution.mjs';
import { ConversationSimulator } from '../communication/ConversationSimulator.mjs';
import { ConversationEvalCI } from '../eval/ConversationEvalCI.mjs';
import { loadMemory, saveMemory } from '../memory/MemoryStore.mjs';
import { MemoryManager } from '../memory/MemoryManager.mjs';

export class UniversalConversationOS {
    constructor(aiGateway) {
        this.aiGateway = aiGateway;
        this.memoryManager = new MemoryManager(aiGateway);
    }

    async process(chatId, message, healthStats = {}) {
        // --- 1. FEEDBACK & PREFERENCE LEARNER ---
        await FeedbackLearner.recordFeedback(message);
        const learnedPrefs = (await FeedbackLearner.getPreferences()).map(p => p.rule);

        // --- 2. CONVERSATION PERCEPTION & REPAIR ---
        const perception = ConversationPerception.analyze(message);
        const repairCheck = ConversationRepair.detectMisunderstanding(message);
        const momentum = await MomentumTracker.updateState(chatId, perception);
        const emotionalState = EmotionalState.evaluate(message, perception, momentum);

        // --- 3. RELATIONSHIP & SOCIAL CALIBRATION ---
        const relationship = await RelationshipProfile.updateProfile(chatId);
        const socialCalibration = SocialCalibration.calibrate(relationship, emotionalState);
        const socialMode = SocialBrain.determineMode(perception, momentum, relationship);

        // --- 4. TOPIC INTELLIGENCE & OPEN LOOPS ---
        const topicGraph = await TopicMemoryGraph.getGraph(chatId);
        const bestMomentumTopic = TopicMomentum.selectHighestMomentumTopic(topicGraph);
        const topicRevival = TopicRevival.evaluateRevival(momentum, topicGraph);
        const topicBridge = TopicBridge.findBridge(topicGraph.activeTopic);
        
        const openLoops = await OpenLoopManager.getLoops(chatId);
        const maturedLoops = OpenLoopManager.getMaturedLoops(openLoops);
        const loopDirective = maturedLoops.length > 0
            ? `- Open Loop Matang: "${maturedLoops[0].statement}". Boleh tanyakan follow-up jika obrolan melambat.`
            : '';

        // --- 5. HUMOR & INSIDE JOKE REGISTRY ---
        const jokeRegistry = await InsideJokeRegistry.getRegistry(chatId);
        const matchedJoke = InsideJokeRegistry.findMatchingJoke(chatId, message, jokeRegistry);
        const humorDecision = HumorEngine.evaluate(message, perception, momentum, relationship, matchedJoke);

        // --- 6. STORY & VENTING ENGINES ---
        const stories = await StoryEngine.getStories(chatId);
        const storyArcs = StoryEngine.getActiveStoryArcs(stories);
        const ventingDirectives = VentingEngine.generateDirectives(perception);

        // --- 7. PERSONALITY & RHYTHM CONTROLLER ---
        const traits = PersonalityEngine.getProfile(chatId, relationship);
        const personalityDirectives = PersonalityEngine.compilePersonalityDirectives(traits);
        const strategy = ResponseStrategy.evaluate(message, relationship);
        const rhythm = ConversationRhythm.determineRhythm(message, momentum, emotionalState);

        // --- 8. STYLE COMPILER ---
        const styleDirectives = StyleCompiler.compilePrompt(relationship, strategy, learnedPrefs);
        const emotionDirectives = EmotionalState.formatDirectives(emotionalState);

        // --- 9. CONTEXTUAL FACT FILTERING (Anti-Overpersonalization) ---
        let memData = await loadMemory(chatId);
        if (!memData.working_memory) memData.working_memory = [];
        if (!memData.facts) memData.facts = [];

        // Apply Memory Evolution (Decay & Confidence)
        memData.facts = MemoryEvolution.evolveFacts(memData.facts);
        const relevantFacts = MemoryEvolution.filterContextualFacts(memData.facts, message);
        const factsSummary = relevantFacts.length > 0
            ? relevantFacts.map(f => `- ${f.predicate || 'fakta'}: ${f.object} (conf: ${f.confidence})`).join('\n')
            : '- Tidak ada data spesifik relevan.';

        // --- 10. COMPOSE MASTER SYSTEM INSTRUCTION ---
        const masterPrompt = `Kamu adalah Personal AI Conversation OS yang berinteraksi langsung melalui WhatsApp.
Etika: Alami, cerdas, akrab, solutif, to-the-point, dan tidak berpura-pura menjadi manusia.

=== PANDUAN GAYA & RITME ===
${styleDirectives}
${socialCalibration}
${personalityDirectives}
${rhythm.directive}
${emotionDirectives}

=== MODE SOSIAL: ${socialMode.mode} ===
${socialMode.directive}
${ventingDirectives}
${repairCheck.directive ? `\n[CRITICAL REPAIR]: ${repairCheck.directive}` : ''}

=== STATUS MOMENTUM & TOPIK ===
- Energy: ${Math.round(momentum.energy * 100)}% | Engagement: ${Math.round(momentum.engagement * 100)}%
${bestMomentumTopic ? `- Topik Momentum Tertinggi: "${bestMomentumTopic.name}" (Score: ${bestMomentumTopic.momentumScore}%)` : ''}
${loopDirective}
${humorDecision.directive ? `- Humor: ${humorDecision.directive}` : ''}
${topicRevival.shouldRevive ? `- Revive: ${topicRevival.instruction}` : ''}
${topicBridge ? `- Semantic Bridge: ${topicBridge.suggestion}` : ''}

=== MEMORI RELEVAN ===
${storyArcs ? `Alur Cerita Aktif:\n${storyArcs}\n` : ''}
Fakta Relevan:
${factsSummary}

Waktu Server: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

        // --- 11. MULTI-TURN WORKING MEMORY ---
        const recentHistory = memData.working_memory.slice(-8);
        const contents = [];
        for (const item of recentHistory) {
            if (item.role === 'user') {
                contents.push({ role: 'user', parts: [{ text: item.text }] });
            } else if (item.role === 'assistant') {
                contents.push({ role: 'model', parts: [{ text: item.text }] });
            }
        }
        contents.push({ role: 'user', parts: [{ text: message }] });

        // --- 12. GENERATE DRAFT VIA AI GATEWAY ---
        let rawDraft = "";
        try {
            rawDraft = await this.aiGateway.generateText(masterPrompt, contents);
        } catch (e) {
            console.error('[UniversalOS Error]', e);
            rawDraft = "bentar tadi ada lag dikit euy.";
        }

        // --- 13. CONVERSATION SIMULATOR & CRITIC (Post-Refinement) ---
        let candidate = ConversationSimulator.evaluateAndRefine(rawDraft, message, rhythm, recentHistory);

        // --- 14. ANTI-AI SANITIZER ---
        const finalMessage = NaturalnessChecker.checkAndSanitize(candidate, strategy);

        // --- 15. EVALUATION CI HOOK ---
        const evalScore = ConversationEvalCI.evaluateTurn(message, finalMessage, recentHistory);
        if (!evalScore.passed) {
            console.warn(`[ConversationEvalCI] ⚠️ Score: ${evalScore.overallScore} | Artifacts:`, evalScore.artifacts);
        }

        // --- 16. PERSIST WORKING MEMORY & UPDATE GRAPH ---
        memData.working_memory.push({ role: 'user', text: message, timestamp: Date.now() });
        memData.working_memory.push({ role: 'assistant', text: finalMessage, timestamp: Date.now() });
        if (memData.working_memory.length > 20) {
            memData.working_memory = memData.working_memory.slice(-20);
        }
        await saveMemory(chatId, memData);

        // --- 17. BACKGROUND CONTINUOUS LEARNING ---
        this.memoryManager.extractAndStore(chatId, `${message}\n${finalMessage}`).catch(() => {});
        
        // Auto-register open loop if user states a future intention
        if (message.match(/(besok|nanti|rencananya|mau nyoba|pengen coba|minggu depan)/i)) {
            OpenLoopManager.registerLoop(chatId, {
                topic: topicGraph.activeTopic || 'general',
                statement: message.slice(0, 100),
                delayMs: 12 * 3600000 // 12 hours
            }).catch(() => {});
        }

        // Track topic updates
        const topicMatch = message.match(/(bot|termux|api|game|kerjaan|projek|ngoding|server|pc|blender|jualan|trading)/i);
        if (topicMatch) {
            TopicMemoryGraph.updateTopic(chatId, topicMatch[0].toLowerCase(), { lastOutcome: message.slice(0, 50) }).catch(() => {});
        }

        return finalMessage;
    }
}
