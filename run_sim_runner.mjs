
import dotenv from 'dotenv';
dotenv.config();

import { PersonalAIOS } from './src/agent/PersonalAIOS.mjs';
import { SimulationLab } from './src/eval/SimulationLab.mjs';
import { SocialMemoryOS } from './src/social/SocialMemoryOS.mjs';
import { StyleLearningEngine } from './src/communication/StyleLearningEngine.mjs';

const os = new PersonalAIOS();
const testChatId = 'sim_lab_user@s.whatsapp.net';

(async () => {
    console.log("==========================================================================");
    console.log("🏛️ RUNNING V7.0 CONVERSATION SIMULATION LAB (MULTI-TURN BENCHMARK)");
    console.log("==========================================================================");

    // Pre-populate social profile
    await SocialMemoryOS.registerStory(testChatId, 'Insiden PC Rusak', 'pernah cerita PC rusak kena petir');
    
    const report = await SimulationLab.runSimulation(os, testChatId);

    console.log(`\n📊 SIMULATION RESULTS (${report.passedFixtures}/${report.totalFixtures} Passed | Avg Naturalness: ${report.avgNaturalness}% | Avg Latency: ${report.avgLatencyMs}ms):`);
    for (const r of report.results) {
        console.log(`  - [${r.name.toUpperCase()}] ${r.pass ? '✅ PASS' : '❌ FAIL'} (${r.durationMs}ms): "${r.output || r.error}"`);
    }

    const learned = await StyleLearningEngine.getLearnedStyle(testChatId);
    console.log("\n🧠 LEARNED STYLE DNA SNAPSHOT:");
    console.log(learned);

    if (report.avgNaturalness >= 90) {
        console.log("\n🏆 MILESTONE V7.0 QUALITY VERIFIED: System exhibits high naturalness & coherence!");
    } else {
        console.log("\n⚠️ Quality below expected threshold.");
    }
})();
