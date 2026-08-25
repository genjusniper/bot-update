
import dotenv from 'dotenv';
dotenv.config();

import { PersonalAIOS } from './src/agent/PersonalAIOS.mjs';
import { PersonalityRegressionLab } from './src/eval/PersonalityRegressionLab.mjs';
import { ProviderHealthMatrix } from './src/fleet/ProviderHealthMatrix.mjs';

const os = new PersonalAIOS();

(async () => {
    console.log("==========================================================================");
    console.log("🧪 RUNNING V6.3 PERSONALITY REGRESSION LAB & HEALTH MATRIX BENCHMARK");
    console.log("==========================================================================");

    const report = await PersonalityRegressionLab.runSuite(os);

    console.log(`\n📊 BENCHMARK RESULTS (${report.passed}/${report.totalTests} Passed | Avg Score: ${report.averageScore}%):`);
    for (const r of report.results) {
        console.log(`  - [${r.id.toUpperCase()}] ${r.pass ? '✅ PASS' : '❌ FAIL'} (${r.durationMs}ms): "${r.response || r.error}"`);
    }

    console.log("\n🏥 PROVIDER HEALTH MATRIX SNAPSHOT:");
    console.log(ProviderHealthMatrix.getSnapshot());

    if (report.averageScore >= 85) {
        console.log("\n🏆 DEPLOYMENT APPROVED: Regression score exceeds 85% quality threshold!");
    } else {
        console.log("\n⚠️ DEPLOYMENT REJECTED: Regression score below quality threshold.");
    }
})();
