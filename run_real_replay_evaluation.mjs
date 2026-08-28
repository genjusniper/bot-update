import dotenv from 'dotenv';
dotenv.config();

import { PersonalAIOS } from './src/agent/PersonalAIOS.mjs';
import { RealConversationReplayEngine } from './src/evaluation/RealConversationReplayEngine.mjs';

const os = new PersonalAIOS();
const testChatId = 'ci_eval_lab_tester@s.whatsapp.net';

(async () => {
    console.log("===================================================================");
    console.log("🧪 RUNNING REAL CONVERSATION REPLAY ENGINE & SCORECARD EVALUATION");
    console.log("===================================================================");

    const traces = RealConversationReplayEngine.getRealTraces();
    const logs = [];

    for (const trace of traces) {
        console.log(`\nReplaying Trace: [${trace.name.toUpperCase()}]`);
        for (const turnText of trace.turns) {
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
            
            // 1.5s natural pause to strictly avoid rate limit (429)
            await new Promise(r => setTimeout(r, 1500));
        }
    }

    const evaluation = RealConversationReplayEngine.evaluateReplay(logs);

    console.log("\n===================================================================");
    console.log("🏆 REAL CONVERSATION REPLAY SCORECARD REPORT");
    console.log("===================================================================");
    console.log(`🔥 COMBINED REPLAY INDEX: ${evaluation.overall} / 100`);
    console.log("-------------------------------------------------------------------");
    console.log(`Detailed social scorecard metrics:`);
    console.log(JSON.stringify(evaluation.scores, null, 2));
    console.log("===================================================================");
})();
