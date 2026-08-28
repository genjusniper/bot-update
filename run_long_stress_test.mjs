import dotenv from 'dotenv';
dotenv.config();

import { PersonalAIOS } from './src/agent/PersonalAIOS.mjs';
import { LongConversationStressTest } from './src/evaluation/LongConversationStressTest.mjs';

const os = new PersonalAIOS();
const testChatId = 'ci_eval_lab_tester@s.whatsapp.net';

(async () => {
    console.log("===================================================================");
    console.log("🧪 RUNNING LONG CONVERSATION STRESS TEST (100 TOTAL TURNS)");
    console.log("===================================================================");

    const phases = LongConversationStressTest.getPhases();
    const logs = [];

    // Run the 50 turns twice to equal 100 turns
    for (let run = 1; run <= 2; run++) {
        console.log(`\n--- RUNNING CYCLE #${run} ---`);
        for (const phase of phases) {
            console.log(`\nPhase: [${phase.name.toUpperCase()}]`);
            for (const turnText of phase.turns) {
                console.log(`  User 💬: "${turnText}"`);
                const startTime = Date.now();
                const plan = await os.process(testChatId, turnText);
                const latency = Date.now() - startTime;
                
                const replyText = typeof plan === 'object' && plan ? (plan.text || '') : (plan || '');
                console.log(`  Bot 🤖: "${replyText}" [Reaction: ${plan?.reactionEmoji || 'none'}] (${latency}ms)`);
                
                logs.push({
                    user: turnText,
                    agent: replyText,
                    latency
                });
                
                // 1.5s pause to strictly avoid rate limit (429) across 100 API calls!
                await new Promise(r => setTimeout(r, 1500));
            }
        }
    }

    const failures = LongConversationStressTest.analyzeFailureMoments(logs);

    console.log("\n===================================================================");
    console.log("🏆 LONG CONVERSATION STRESS TEST REPORT");
    console.log("===================================================================");
    console.log(`🔥 Total turns simulated: ${logs.length}`);
    console.log(`🔥 Total failure moments detected: ${failures.length}`);
    
    if (failures.length > 0) {
        console.log(`\n❌ DETECTED FAILURE MOMENTS:`);
        failures.forEach(f => {
            console.log(`- Turn #${f.turn} [${f.reason}]: ${f.detail}`);
            console.log(`  User: "${f.user}"`);
            console.log(`  Bot:  "${f.agent}"\n`);
        });
    } else {
        console.log("\n✅ PERFECT MATCH: 0 failure moments detected across 100 turns!");
    }
    console.log("===================================================================");
})();
