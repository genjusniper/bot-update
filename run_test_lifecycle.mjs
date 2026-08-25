
import dotenv from 'dotenv';
dotenv.config();

import { PersonalAIOS } from './src/agent/PersonalAIOS.mjs';
import { MessageLifecycleTracker } from './src/telemetry/MessageLifecycleTracker.mjs';
import { ProductionTelemetry72h } from './src/metrics/ProductionTelemetry72h.mjs';

const os = new PersonalAIOS();
const testChatId = 'lifecycle_tester@s.whatsapp.net';

(async () => {
    console.log("==========================================================================");
    console.log("🔍 TESTING REAL MESSAGE LIFECYCLE ID & STEP-BY-STEP TRACE");
    console.log("==========================================================================");

    const corrId = `conv_test_${Date.now()}`;
    const response = await os.process(testChatId, "emang iya bakal di bales", corrId);

    console.log(`\n[AI Response]: "${response}"`);

    // Fetch the recorded lifecycle directory files
    const fsPromises = (await import('fs/promises')).default;
    const path = (await import('path')).default;
    const files = await fsPromises.readdir(path.resolve(process.cwd(), 'memory/lifecycle'));
    const latestFile = files[files.length - 1];

    if (latestFile) {
        const raw = await fsPromises.readFile(path.resolve(process.cwd(), 'memory/lifecycle', latestFile), 'utf8');
        const record = JSON.parse(raw);
        console.log(`\n📋 LIFECYCLE TRACE REPORT FOR [${record.lifecycleId}]:`);
        console.log(`  - Input: "${record.inputText}"`);
        console.log(`  - Final Outcome: ${record.finalOutcome}`);
        console.log(`  - Total Latency: ${record.totalLatencyMs}ms`);
        console.log(`  - Timeline Steps:`);
        for (const step of record.timeline) {
            console.log(`    [+${step.elapsedMs || 0}ms] ${step.phase}: ${JSON.stringify(step.details || {})}`);
        }
    }

    const metrics = await ProductionTelemetry72h.getMetrics();
    console.log("\n📊 72-HOUR METRICS SNAPSHOT:");
    console.log(metrics);
})();
