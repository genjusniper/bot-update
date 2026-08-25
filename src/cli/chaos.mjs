// src/cli/chaos.mjs
import { ChaosHarness } from '../chaos/ChaosHarness.mjs';
import { setTimeout } from 'timers/promises';
import { JobQueue } from '../queue/JobQueue.mjs';

const command = process.argv[2];

async function runChaos() {
    console.log(`\n========================================================================`);
    console.log(`🔥 WA-BOT V8.5 CHAOS TESTING HARNESS 🔥`);
    console.log(`========================================================================\n`);

    try { JobQueue.init(); } catch (e) {}

    console.log(`\n[Test 1] SQLite Transaction Lock...`);
    await ChaosHarness.injectSqliteLock();

    console.log(`\n[Test 2] API Provider 429 Rate Limit (Gemini)...`);
    await ChaosHarness.triggerApiFailure('gemini');

    console.log(`\n[Test 3] Event Burst Flood (10 msgs in 100ms)...`);
    await ChaosHarness.floodEvents('628123456789@s.whatsapp.net', 10);

    console.log(`\n[Test 4] Plugin Crash Injection...`);
    await ChaosHarness.crashPlugin('calculator');

    console.log(`\n[Test 5] Network Loss...`);
    await ChaosHarness.injectNetworkLoss(5000);

    console.log(`\n✅ Chaos sequence dispatched. Check PM2 logs for recovery behavior.`);
    process.exit(0);
}

if (command === '--run') {
    runChaos();
} else {
    console.log('Usage: node src/cli/chaos.mjs --run');
}
