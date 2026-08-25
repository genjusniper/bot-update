// src/os/SelfTrainingKernel.mjs — PATCHED (FIX #3: store eval interval ref)
import { JobQueue } from '../queue/JobQueue.mjs';
import { MemoryManager } from '../memory/MemoryManager.mjs';
import { EventBus } from '../event/EventBus.mjs';
import { ConversationSimulator } from '../evaluation/ConversationSimulator.mjs';
import { EvaluationLab } from '../evaluation/EvaluationLab.mjs';
import fs from 'fs';
import path from 'path';

export class OSKernel {
    static isRunning = false;
    static maintenanceInterval = null;
    static evalInterval = null; // FIX #3: Store reference so stop() can clear it
    static aiGateway = null;
    static lastEvalScore = null;

    static start(aiGateway, naturalConversationEngine) {
        if (this.isRunning) return;
        this.isRunning = true;
        this.aiGateway = aiGateway;
        this.nce = naturalConversationEngine;
        
        console.log('🤖 [V12 Kernel] Personal Agent OS Booting...');
        
        // Listen to proposal approvals to trigger DAG tasks
        EventBus.subscribe('proposal:approved', async (event) => {
            const { proposalId, chatId, tool, args } = event.payload || {};
            if (!proposalId) return;
            console.log(`[Kernel] Proposal ${proposalId} approved for ${chatId}`);
            // In full integration, this would call TaskGraphEngine to queue and execute DAG
            EventBus.emit('system:proposal_queued', { proposalId, chatId });
        });

        // Loop 1: Routine Maintenance every 5 minutes
        this.maintenanceInterval = setInterval(async () => {
            await this.runMaintenance();
        }, 5 * 60 * 1000);
        
        // FIX #3: Store reference to eval interval
        this.evalInterval = setInterval(async () => {
            await this.runSelfEvaluation();
        }, 24 * 60 * 60 * 1000);

        // Run first maintenance after 5 seconds
        setTimeout(() => this.runMaintenance(), 5000);
        console.log('✅ [Kernel] Maintenance + Eval loops armed.');
    }

    static async runMaintenance() {
        console.log('🧹 [Kernel] Sweeping Queue & Memory...');
        try {
            JobQueue.sweepStaleJobs();
            const memDir = path.resolve(process.cwd(), 'memory');
            if (fs.existsSync(memDir)) {
                const files = fs.readdirSync(memDir);
                const memoryManager = new MemoryManager(this.aiGateway);
                for (const file of files) {
                    if (file.endsWith('_memory.json')) {
                        const chatId = file.replace('_memory.json', '');
                        try { await memoryManager.runSafetySweep(chatId); } catch(e){}
                    }
                }
            }
        } catch(e) {
            console.error('❌ [Kernel] Maintenance Error:', e.message);
        }
    }

    static async runSelfEvaluation() {
        console.log('🧪 [Kernel] Running Self-Evaluation Lab...');
        try {
            if (!this.nce) {
                console.warn('[Kernel] NCE not available, skipping eval.');
                return;
            }

            const simulator = new ConversationSimulator({
                processMessage: async (userId, msg) => {
                    const text = await this.nce.process(userId, msg, {});
                    return { text: String(text || ''), metrics: {} };
                }
            });
            const results = await simulator.runFullSuite();
            
            let total = 0;
            let count = 0;
            for (const [, logs] of Object.entries(results)) {
                // FIX #5: Guard against empty logs
                if (!logs || logs.length === 0) continue;
                const score = EvaluationLab.evaluateSession(logs);
                if (score.overall !== 'N/A') {
                    total += parseFloat(score.overall);
                    count++;
                }
            }

            this.lastEvalScore = count > 0 ? (total / count).toFixed(2) : 'N/A';
            console.log(`✅ [Kernel] Eval Complete. Baseline: ${this.lastEvalScore}/100`);
            
            // Persist metrics
            const metricsPath = path.resolve(process.cwd(), 'memory', 'metrics_v12.jsonl');
            fs.appendFileSync(metricsPath, JSON.stringify({
                timestamp: Date.now(),
                evalScore: this.lastEvalScore,
                scenariosTested: count
            }) + '\n');
            
        } catch (e) {
            console.error('❌ [Kernel] Eval Lab Error:', e.message);
        }
    }
    
    static stop() {
        // FIX #3: Clear BOTH intervals
        if (this.maintenanceInterval) clearInterval(this.maintenanceInterval);
        if (this.evalInterval) clearInterval(this.evalInterval); // FIX #3
        this.isRunning = false;
        console.log('🛑 [Kernel] Halted cleanly.');
    }
}
