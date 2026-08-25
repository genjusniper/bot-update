// Deep System Bug Audit - Check every import in PersonalAIOS
import dotenv from 'dotenv';
dotenv.config();

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

async function tryImport(modulePath) {
    try {
        await import(modulePath);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e.message.split('\n')[0] };
    }
}

(async () => {
    console.log(`${BOLD}==========================================================================`);
    console.log('🔬 DEEP SYSTEM BUG AUDIT: ALL MODULE IMPORTS');
    console.log(`==========================================================================\n${RESET}`);

    const modules = [
        // Core Security & Co-Pilot
        './src/security/copilot/PersonalCoPilotGuard.mjs',
        './src/security/copilot/ContactPolicyEngine.mjs',
        './src/security/copilot/GroupSafetyPolicy.mjs',
        './src/security/copilot/OwnerMentionResolver.mjs',
        './src/security/copilot/OwnerPresenceEngine.mjs',
        
        // Social
        './src/social/multiperson/ContactProfileStore.mjs',
        './src/social/multiperson/PerContactMemoryNamespace.mjs',
        './src/social/multiperson/GroupConversationEngine.mjs',
        './src/social/v12/ConversationTemperatureEngine.mjs',
        './src/social/v12/DontOverhelpEngine.mjs',
        './src/social/v12/ConversationRepairEngine.mjs',
        './src/social/v12/VisualConversationContinuity.mjs',
        
        // Multimodal
        './src/multimodal/LinkIntelligenceEngine.mjs',
        './src/multimodal/DeepIntentRouter.mjs',
        './src/multimodal/VoiceIntelligenceEngine.mjs',
        './src/multimodal/SemanticCache.mjs',
        './src/multimodal/AttachmentFactExtractor.mjs',
        
        // Behavior
        './src/behavior/HumanInteractionPolicy.mjs',
        './src/behavior/ResponseBudgetEngine.mjs',
        './src/behavior/ConversationEndingDetector.mjs',
        './src/behavior/BubbleSequencer.mjs',
        './src/behavior/TimeAwarenessPersona.mjs',
        
        // Resilience
        './src/resilience/AIGatewayObservable.mjs',
        './src/resilience/PayloadSanitizer.mjs',
        './src/resilience/EmergencyBrainExpanded.mjs',
        './src/resilience/CircuitBreakerHardened.mjs',
        './src/resilience/KeyHealthRegistry.mjs',
        './src/resilience/EmergencyConversationBrain.mjs',
        './src/resilience/DuplicateResponseGuard.mjs',
        
        // Fleet
        './src/fleet/KeyFleetManager.mjs',
        './src/fleet/ErrorTaxonomy.mjs',
        './src/fleet/ProviderHealthMatrix.mjs',
        './src/fleet/LightweightRouter.mjs',
        
        // Memory
        './src/memory/MemoryStore.mjs',
        './src/memory/MemoryOS.mjs',
        './src/memory/MemoryManager.mjs',
        './src/memory/RelevanceMemoryRetrieval.mjs',
        './src/memory/MemoryConsolidationPipeline.mjs',
        './src/memory/PersonalSearchEngine.mjs',
        './src/memory/ProactiveMemoryGraph.mjs',
        
        // Subsystems
        './src/subsystems/life/LifeBrain.mjs',
        './src/subsystems/life/LifeCompanionEngine.mjs',
        './src/subsystems/social/SocialBrain.mjs',
        './src/subsystems/ux/HumanUXEngine.mjs',
        './src/subsystems/observability/ConversationDebugger.mjs',
        
        // Conversation
        './src/conversation/ConversationStateEngine.mjs',
        './src/conversation/ConversationContinuityLock.mjs',
        './src/conversation/HumanRhythmEngine.mjs',
        './src/conversation/TurnTakingEngine.mjs',
        './src/conversation/StoryThreadTracker.mjs',
        
        // Context & Communication
        './src/context/ContextBudgetManager.mjs',
        './src/communication/StyleDNA.mjs',
        './src/communication/AntiRepetitionEngine.mjs',
        
        // Topics / Humor
        './src/topics/TopicGraphEngine.mjs',
        './src/humor/AdvancedHumorEngine.mjs',
        './src/humor/CallbackRegistry.mjs',
        './src/humor/HumorTimingDetector.mjs',
        
        // Social (other)
        './src/social/SocialMemoryOS.mjs',
        './src/social/EmotionalCalibrationEngine.mjs',
        './src/social/CurhatEngine.mjs',
        
        // Other
        './src/telemetry/MessageLifecycleTracker.mjs',
        './src/metrics/ProductionTelemetry72h.mjs',
        './src/tasks/TaskPromiseTracker.mjs',
        './src/monitor/DeviceServerMonitor.mjs',
        './src/utility/LocalCalculatorEngine.mjs',
        './src/advisor/ProductLocationAdvisor.mjs',
        './src/quality/ConversationQualityGate.mjs',
        './src/security/SecretVault.mjs',
        './src/eval/ReplayStudio.mjs',
        './src/queue/ChatBurstAggregator.mjs',
        
        // Master Agent
        './src/agent/PersonalAIOS.mjs',
    ];

    let passed = 0;
    let failed = 0;
    const failures = [];

    for (const m of modules) {
        const result = await tryImport(m);
        if (result.ok) {
            console.log(`${GREEN}✅ OK${RESET}  ${m}`);
            passed++;
        } else {
            console.log(`${RED}❌ FAIL${RESET} ${m}`);
            console.log(`   ${YELLOW}↳ ${result.error}${RESET}`);
            failed++;
            failures.push({ module: m, error: result.error });
        }
    }

    console.log(`\n${BOLD}==========================================================================`);
    console.log(`🏆 AUDIT RESULTS: ${passed} OK | ${RED}${failed} BROKEN${RESET}${BOLD}`);
    if (failures.length > 0) {
        console.log(`\n❌ BROKEN MODULES (${failures.length}):`);
        failures.forEach(f => console.log(`   - ${f.module}: ${f.error}`));
    }
    console.log(`==========================================================================\n${RESET}`);
})();
