// src/security/PolicyEngine.mjs

export class PolicyEngine {
    // Tool Risk Matrix
    static toolRisk = {
        'git.read': { risk: 'LOW', requiresApproval: false },
        'git.diff': { risk: 'LOW', requiresApproval: false },
        'git.commit': { risk: 'MEDIUM', requiresApproval: false },
        'git.push': { risk: 'HIGH', requiresApproval: true },
        'shell.read': { risk: 'LOW', requiresApproval: false },
        'shell.execute': { risk: 'HIGH', requiresApproval: true },
        'memory.read': { risk: 'LOW', requiresApproval: false },
        'memory.write': { risk: 'LOW', requiresApproval: false },
        'deploy': { risk: 'CRITICAL', requiresApproval: true }
    };

    static evaluateCapability(toolName, userRole = 'USER') {
        const policy = this.toolRisk[toolName] || { risk: 'HIGH', requiresApproval: true };

        if (policy.risk === 'LOW') {
            return { allowed: true, requiresApproval: false, reason: 'Low-risk read-only capability.' };
        }

        if (policy.requiresApproval) {
            return {
                allowed: false,
                requiresApproval: true,
                reason: `Capability "${toolName}" has risk level "${policy.risk}" and requires explicit user approval.`
            };
        }

        return { allowed: true, requiresApproval: false };
    }
}
