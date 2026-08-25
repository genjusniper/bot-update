// src/security/CapabilityFirewall.mjs
import { CapabilityRegistry } from './CapabilityRegistry.mjs';
import { IsolatedExecutor } from './IsolatedExecutor.mjs';
import { RiskEvaluator } from './RiskEvaluator.mjs';

// CAPABILITY = ALLOWED ACTION -> AUDIT LOG = PROVENANCE
export class CapabilityFirewall {
    static async executeSafely(toolName, args, chatId) {
        // 1. Check Owner Permissions
        const hasPermission = CapabilityRegistry.checkPermission(chatId, toolName);
        if (!hasPermission) {
            console.log(`[AUDIT LOG] DENIED: User ${chatId} attempted tool ${toolName}`);
            throw new Error(`PERMISSION_DENIED: Chat ${chatId} is not authorized for tool ${toolName}`);
        }

        // 2. Risk Evaluation
        const risk = RiskEvaluator.checkRisk(toolName, args);
        if (!risk.allowed) {
            console.log(`[AUDIT LOG] BLOCKED: Tool ${toolName} failed risk policy: ${risk.reason}`);
            throw new Error(`FIREWALL_BLOCKED: ${risk.reason}`);
        }

        // 3. Isolated Execution
        const result = await IsolatedExecutor.execute(toolName, args, risk.executeAs);
        
        // 4. Audit Log Provenance
        console.log(`[AUDIT LOG] SUCCESS: Tool ${toolName} executed for ${chatId} via ${risk.executeAs}`);
        return result;
    }
}
