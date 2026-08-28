import dotenv from 'dotenv';
dotenv.config();

import { PersonalAIOS } from './src/agent/PersonalAIOS.mjs';
import { HumanConversationEvaluator } from './src/evaluation/HumanConversationEvaluator.mjs';

const os = new PersonalAIOS();
const testChatId = 'ci_eval_lab_tester@s.whatsapp.net';

(async () => {
    console.log("===================================================================");
    console.log("🧪 RUNNING COMPREHENSIVE BEHAVIOR EVALUATOR SUITE");
    console.log("===================================================================");

    const scenarios = HumanConversationEvaluator.getScenarios();
    const suiteResults = {};

    for (const scenario of scenarios) {
        console.log(`\nRunning Scenario: [${scenario.name.toUpperCase()}] (Weight: ${scenario.weight * 100}%)`);
        const sessionLogs = [];
        
        for (const turnText of scenario.turns) {
            console.log(`  User 💬: "${turnText}"`);
            const startTime = Date.now();
            const plan = await os.process(testChatId, turnText);
            const latency = Date.now() - startTime;
            
            const replyText = typeof plan === 'object' && plan ? (plan.text || '') : (plan || '');
            console.log(`  Bot 🤖: "${replyText}" [Bubbles: ${plan?.bubbles?.length || 0}] [Reaction: ${plan?.reactionEmoji || 'none'}] (${latency}ms)`);
            
            sessionLogs.push({
                user: turnText,
                agent: replyText,
                bubbles: plan?.bubbles || [],
                reaction: plan?.reactionEmoji || null,
                latency
            });
            
            // Give 500ms delay to make it realistic
            await new Promise(r => setTimeout(r, 500));
        }

        const evaluation = HumanConversationEvaluator.evaluateLogs(sessionLogs);
        suiteResults[scenario.name] = evaluation;
        console.log(`  📊 Scenario Score: ${evaluation.overall}/100 | Stats: Words=${evaluation.stats.avgWords}, Qs=${evaluation.stats.totalQuestions}, Emojis=${evaluation.stats.totalEmojis}`);
    }

    console.log("\n===================================================================");
    console.log("🏆 FINAL SOCIAL SCORECARD REPORT");
    console.log("===================================================================");
    let weightedSum = 0;
    for (const [name, result] of Object.entries(suiteResults)) {
        const scenario = scenarios.find(s => s.name === name);
        const weightedScore = parseFloat(result.overall) * scenario.weight;
        weightedSum += weightedScore;
        console.log(`- ${name.toUpperCase()} (Weight: ${scenario.weight * 100}%): ${result.overall}/100 (Weighted: ${weightedScore.toFixed(2)})`);
    }

    console.log("-------------------------------------------------------------------");
    console.log(`🔥 COMBINED SOCIAL INDEX: ${weightedSum.toFixed(2)} / 100`);
    console.log("===================================================================");
})();
