
import { EventBus } from '../event/EventBus.mjs';

export class SwarmOrchestrator {
    static subAgents = {};

    static registerSubAgent(role, systemPrompt) {
        this.subAgents[role] = systemPrompt;
        console.log(`[Swarm] Registered sub-agent: ${role}`);
    }

    static async delegateTask(task, aiGateway) {
        console.log(`[Swarm] Analyzing task for delegation: "${task}"`);
        
        // Simplified delegation logic
        const role = task.toLowerCase().includes('research') ? 'researcher' : 
                     task.toLowerCase().includes('code') ? 'developer' : 'reviewer';
                     
        const prompt = this.subAgents[role] || "You are a helpful assistant.";
        
        console.log(`[Swarm] Delegating to ${role}...`);
        const result = await aiGateway.generateText(prompt, task);
        return { role, result };
    }
}

