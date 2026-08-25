
import dotenv from 'dotenv';
dotenv.config();

import { PersonalAIOS } from './src/agent/PersonalAIOS.mjs';
import { GoldenDatasetEvaluator } from './src/eval/GoldenDatasetEvaluator.mjs';
import { MemoryOS } from './src/memory/MemoryOS.mjs';

const os = new PersonalAIOS();
const testChatId = 'golden_dataset_tester@s.whatsapp.net';

(async () => {
    console.log("==========================================================================");
    console.log("👑 RUNNING V7.5 GOLDEN CONVERSATION DATASET REGRESSION BENCHMARK");
    console.log("==========================================================================");

    // Seed grounded memory
    await MemoryOS.recordSemantic(testChatId, 'rencana_diet', 'sedang program diet sehat');
    await MemoryOS.recordSemantic(testChatId, 'interview', 'lolos interview tahap pertama');

    const report = await GoldenDatasetEvaluator.evaluateSystem(os, testChatId);

    console.log(`\n📊 GOLDEN DATASET METRICS (${report.passedItems}/${report.totalItems} Items | Quality Score: ${report.avgScore}% | Avg Latency: ${report.avgLatencyMs}ms):`);
    for (const r of report.results) {
        console.log(`  - [${r.label}] ${r.pass ? '✅ PASS' : '❌ FAIL'} (${r.latencyMs}ms): "${r.response || r.error}"`);
    }

    console.log(`\n🛡️ QUALITY GATE INCIDENTS: ${report.hallucinationCount} Hallucinations Detected`);

    if (report.deploymentApproved) {
        console.log("\n🏆 DEPLOYMENT APPROVED: Golden Dataset regression passed 85% threshold!");
    } else {
        console.log("\n⚠️ DEPLOYMENT REJECTED: Score below threshold.");
    }
})();
