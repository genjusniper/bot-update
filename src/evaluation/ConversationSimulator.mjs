// src/evaluation/ConversationSimulator.mjs
import { EventEmitter } from 'events';

export class ConversationSimulator extends EventEmitter {
    constructor(agentTarget) {
        super();
        this.agent = agentTarget;
        this.scenarios = [
            { type: 'burst', messages: ["ping", "woy", "bales dong", "eh jadi gimana projectnya?"] },
            { type: 'correction', messages: ["mau pesen tiket ke bali", "eh sori bukan bali, lombok deng!"] },
            { type: 'topic_switch', messages: ["besok meeting jam 9?", "oh ya, kucingku tadi muntah"] },
            { type: 'ambiguity', messages: ["kirim ke dia aja"] },
            { type: 'long_gap', messages: ["kemarin seru ya", "TIMESTAMP_GAP_48H", "eh masih ingat yg kemarin?"] }
        ];
    }

    async runScenario(scenarioType) {
        const scenario = this.scenarios.find(s => s.type === scenarioType);
        if (!scenario) throw new Error("Scenario not found");

        const sessionLogs = [];
        const virtualUser = `virtual_user_${Date.now()}`;

        console.log(`[Simulator] Starting scenario: ${scenarioType}`);
        
        for (const msg of scenario.messages) {
            if (msg.startsWith('TIMESTAMP_GAP')) {
                console.log(`[Simulator] Simulating time gap...`);
                // Simulate time gap logically in the system's memory
                continue;
            }

            const startTime = Date.now();
            console.log(`[VirtualUser] 💬 ${msg}`);
            
            // Bypass actual WhatsApp, direct to Agent Pipeline
            const response = await this.agent.processMessage(virtualUser, msg);
            
            const latency = Date.now() - startTime;
            console.log(`[Agent] 🤖 ${response.text} (${latency}ms)`);
            
            sessionLogs.push({
                user: msg,
                agent: response.text,
                latency,
                metrics: response.metrics // E.g., confidence, tools used
            });
            
            // Wait naturally between inputs unless it's a burst
            if (scenarioType !== 'burst') {
                await new Promise(r => setTimeout(r, 1000));
            }
        }
        
        return sessionLogs;
    }

    async runFullSuite() {
        const results = {};
        for (const s of this.scenarios) {
            results[s.type] = await this.runScenario(s.type);
        }
        return results;
    }
}
