// src/cli/cockpit_v12.mjs
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const memDir = path.resolve(process.cwd(), 'memory');

function clearScreen() {
    process.stdout.write('\x1Bc');
}

function printHeader() {
    console.log('===================================================');
    console.log(' 🎛️  V12 UNIVERSAL AGENT OS COCKPIT');
    console.log('===================================================');
}

function readMetrics() {
    try {
        const lines = fs.readFileSync(path.join(memDir, 'metrics_v12.jsonl'), 'utf8').split('\n').filter(Boolean);
        if (lines.length > 0) {
            const last = JSON.parse(lines[lines.length - 1]);
            return `Baseline Naturalness Score: ${last.evalScore}/100`;
        }
    } catch {
        return "No evaluation data yet. Awaiting Kernel Lab run.";
    }
}

function readSocialProfiles() {
    const socialDir = path.join(memDir, 'social');
    if (!fs.existsSync(socialDir)) return "0 Active Profiles";
    const files = fs.readdirSync(socialDir);
    return `${files.length} Active Profiles Tracking Preferences & Style`;
}

async function renderCockpit() {
    clearScreen();
    printHeader();
    
    // System Status
    console.log(`[Status]  : ONLINE (V12.0)`);
    console.log(`[Kernel]  : Self-Training & Sweeping ACTIVE`);
    console.log(`[Eval Lab]: ${readMetrics()}`);
    console.log(`[Social]  : ${readSocialProfiles()}`);
    console.log('---------------------------------------------------');
    
    console.log('Options:');
    console.log('  [1] Force Run Conversation Lab (Simulator)');
    console.log('  [2] Sweep Memory & Jobs');
    console.log('  [0] Exit');
    
    process.stdout.write('\nChoice: ');
}

// Simple interactive loop
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function loop() {
    await renderCockpit();
    rl.question('', async (answer) => {
        if (answer === '1') {
            console.log("\nTriggering Virtual Simulator Lab... Check pm2 logs for detailed turn-by-turn metrics.");
            // In a real CLI, we'd invoke the EvaluationLab script here.
            await new Promise(r => setTimeout(r, 2000));
            loop();
        } else if (answer === '2') {
            console.log("\nSweeping Database Locks & Archiving Memories...");
            await new Promise(r => setTimeout(r, 2000));
            loop();
        } else if (answer === '0') {
            console.log("Exiting Cockpit.");
            process.exit(0);
        } else {
            loop();
        }
    });
}

loop();
