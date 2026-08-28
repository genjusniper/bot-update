import dotenv from 'dotenv';
dotenv.config();

import { PersonalAIOS } from './src/agent/PersonalAIOS.mjs';
import { ResponseNaturalnessEvaluator } from './src/evaluation/ResponseNaturalnessEvaluator.mjs';

const os = new PersonalAIOS();
const testChatId = 'ci_eval_lab_tester@s.whatsapp.net';

(async () => {
    console.log("===================================================================");
    console.log("🧪 RESPONSE NATURALNESS EVALUATOR SUITE (50 SIMULATED TURNS)");
    console.log("===================================================================");

    const testCorpus = ResponseNaturalnessEvaluator.getTestCorpus();
    const logs = [];

    // Run corpus twice to simulate 50 total conversational turns
    for (let run = 1; run <= 2; run++) {
        console.log(`\n--- RUN #${run} ---`);
        for (const item of testCorpus) {
            console.log(`  User 💬: "${item.user}"`);
            const startTime = Date.now();
            const plan = await os.process(testChatId, item.user);
            const latency = Date.now() - startTime;
            
            const replyText = typeof plan === 'object' && plan ? (plan.text || '') : (plan || '');
            console.log(`  Bot 🤖: "${replyText}" [Reaction: ${plan?.reactionEmoji || 'none'}] (${latency}ms)`);
            
            logs.push({
                user: item.user,
                agent: replyText,
                latency
            });
            
            // Short natural pause
            await new Promise(r => setTimeout(r, 200));
        }
    }

    const report = ResponseNaturalnessEvaluator.evaluate(logs);

    console.log("\n===================================================================");
    console.log("🏆 NATURALNESS SCORECARD REPORT");
    console.log("===================================================================");
    console.log(`🔥 COMBINED NATURALNESS INDEX: ${report.overall} / 100`);
    console.log(`- Average Words per Reply: ${report.avgWords}`);
    console.log("-------------------------------------------------------------------");
    console.log(`Detailed metrics breakdown:`);
    console.log(JSON.stringify(report.scores, null, 2));
    console.log("===================================================================");
})();
