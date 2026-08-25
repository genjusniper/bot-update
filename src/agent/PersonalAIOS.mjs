// src/agent/PersonalAIOS.mjs — PROTECTED WORKING MEMORY
import { AIResourceManager } from '../fleet/AIResourceManager.mjs';
import { ContextCompressor } from '../context/ContextCompressor.mjs';
import { SecretVault } from '../security/SecretVault.mjs';
import { MemoryFirewall } from '../security/MemoryFirewall.mjs';
import { ReplayDebugger } from '../eval/ReplayDebugger.mjs';
import { ConversationEvalCI } from '../eval/ConversationEvalCI.mjs';

import { ConversationPerception } from '../perception/ConversationPerception.mjs';
import { MomentumTracker } from '../perception/MomentumTracker.mjs';
import { EmotionalState } from '../communication/EmotionalState.mjs';
import { ConversationRepair } from '../communication/ConversationRepair.mjs';
import { RelationshipProfile } from '../communication/RelationshipProfile.mjs';
import { ResponseStrategy } from '../communication/ResponseStrategy.mjs';
import { ConversationRhythm } from '../communication/ConversationRhythm.mjs';
import { FeedbackLearner } from '../communication/FeedbackLearner.mjs';

import { SocialBrain } from '../social/SocialBrain.mjs';
import { TopicMemoryGraph } from '../topics/TopicMemoryGraph.mjs';
import { OpenLoopManager } from '../communication/OpenLoopManager.mjs';
import { InsideJokeRegistry } from '../humor/InsideJokeRegistry.mjs';
import { MemoryEvolution } from '../communication/MemoryEvolution.mjs';

import { loadMemory, saveMemory } from '../memory/MemoryStore.mjs';
import { MemoryManager } from '../memory/MemoryManager.mjs';

export class PersonalAIOS {
    constructor() {
        this.fleet = new AIResourceManager();
        this.memoryManager = new MemoryManager(this.fleet);
    }

    async process(chatId, message, correlationId = null) {
        const corrId = correlationId || `conv_${chatId}_${Date.now()}`;
        const trace = { correlationId: corrId, chatId, message, steps: {} };

        // 1. FEEDBACK & PREFERENCE LEARNER
        await FeedbackLearner.recordFeedback(message);
        const learnedPrefs = (await FeedbackLearner.getPreferences()).map(p => p.rule);

        // 2. CONVERSATION PERCEPTION & MOMENTUM
        const perception = ConversationPerception.analyze(message);
        const repairCheck = ConversationRepair.detectMisunderstanding(message);
        const momentum = await MomentumTracker.updateState(chatId, perception);
        const emotionalState = EmotionalState.evaluate(message, perception, momentum);

        // 3. RELATIONSHIP
        const relationship = await RelationshipProfile.updateProfile(chatId);
        const strategy = ResponseStrategy.evaluate(message, relationship);
        const rhythm = ConversationRhythm.determineRhythm(message, momentum, emotionalState);

        // 4. TOPIC & OPEN LOOPS
        const topicGraph = await TopicMemoryGraph.getGraph(chatId);
        const jokeRegistry = await InsideJokeRegistry.getRegistry(chatId);
        const matchedJoke = InsideJokeRegistry.findMatchingJoke(chatId, message, jokeRegistry);

        // 5. MEMORY RETRIEVAL & FIREWALL
        let memData = await loadMemory(chatId);
        if (!memData.working_memory) memData.working_memory = [];
        if (!memData.facts) memData.facts = [];

        // Filter out any legacy contaminated fallback errors from working memory
        memData.working_memory = memData.working_memory.filter(m => 
            !m.text.includes('nge-lag') && !m.text.includes('offline')
        );

        memData.facts = MemoryEvolution.evolveFacts(memData.facts);
        const isolatedFacts = MemoryFirewall.filterForContact(memData.facts, chatId, chatId);
        const relevantFacts = MemoryEvolution.filterContextualFacts(isolatedFacts, message);
        const factsSummary = relevantFacts.length > 0
            ? relevantFacts.map(f => `- ${f.predicate || 'fakta'}: ${f.object}`).join('\n')
            : '';

        // 6. CONTEXT COMPRESSION
        const { summary, recentHistory } = ContextCompressor.compress(memData.working_memory, 8);

        // 7. MASTER SYSTEM INSTRUCTION
        const masterPrompt = `Kamu adalah teman ngobrol / asisten WhatsApp pribadi yang sangat asik, cerdas, ceplas-ceplos, santai, dan seru.

GAYA & RASA BAHASA:
- Bahasa: Santai khas obrolan WhatsApp Indonesia sehari-hari. Jika user pakai bahasa Jawa / logat Semarangan (contoh: "makan apa yo enak e", "dadi MJ wae", "ra gelem", "pie to"), IKUTI DAN IMBANGI dengan luwes pakai bahasa Jawa santai yang natural (misal: "lha", "to", "wae", "ki", "mosok", "wkwk").
- Karakter: Spontan, lucu, suka bercanda/meledek ringan (teasing) seperti teman nongkrong akrab, tapi peka konteks saat user lagi capek/serius.
- Format: Singkat, to-the-point, 1-2 kalimat mengalir alami. DILARANG membuat paragraf panjang atau format kaku seperti bot tutorial.
- Emosi: Natural! Jangan awali dengan "Halo" atau basa-basi robot.

${repairCheck.directive ? `[KOREKSI]: ${repairCheck.directive}` : ''}
${matchedJoke ? `[INSIDE JOKE]: Selipkan lelucon lama tentang "${matchedJoke.topic}" jika momennya pas.` : ''}
${factsSummary ? `Memori yang kamu ingat tentang orang ini:\n${factsSummary}` : ''}

Waktu sekarang: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

        const cleanPrompt = SecretVault.sanitizePrompt(masterPrompt);

        // 8. MULTI-TURN CONTENTS
        const contents = [];
        for (const item of recentHistory) {
            if (item.role === 'user') {
                contents.push({ role: 'user', parts: [{ text: item.text }] });
            } else if (item.role === 'assistant') {
                contents.push({ role: 'model', parts: [{ text: item.text }] });
            }
        }
        contents.push({ role: 'user', parts: [{ text: message }] });

        // 9. FLEET GENERATION
        let rawDraft = "";
        try {
            rawDraft = await this.fleet.generateText(cleanPrompt, contents);
        } catch (e) {
            console.error('[PersonalAIOS Error]', e);
            rawDraft = "Bentar, agak nge-lag tadi jaringannya. Coba ulangi lagi ya!";
        }

        let finalMessage = rawDraft.trim()
            .replace(/^halo[!.,]?\s*/i, '')
            .replace(/tentu saja,?\s*/i, '')
            .replace(/ada yang bisa dibantu\??/i, '')
            .trim();

        // 10. RECORD TRACE
        trace.steps = { perception, momentum, finalMessage };
        ReplayDebugger.recordTrace(corrId, trace).catch(() => {});

        // 11. PERSIST WORKING MEMORY (ONLY IF NOT AN ERROR FALLBACK)
        if (!finalMessage.includes('nge-lag') && !finalMessage.includes('offline')) {
            memData.working_memory.push({ role: 'user', text: message, timestamp: Date.now() });
            memData.working_memory.push({ role: 'assistant', text: finalMessage, timestamp: Date.now() });
            if (memData.working_memory.length > 20) {
                memData.working_memory = memData.working_memory.slice(-20);
            }
            await saveMemory(chatId, memData);
            this.memoryManager.extractAndStore(chatId, `${message}\n${finalMessage}`).catch(() => {});
        }

        return finalMessage;
    }
}
