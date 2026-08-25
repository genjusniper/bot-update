// src/security/CapabilitySecurityEngine.mjs
// Capability Security Engine — "AI is NOT Root" Non-Root Execution Boundary

export class CapabilitySecurityEngine {
    static PERMISSION_MATRIX = {
        'git.status': { tier: 'SAFE', allowed: true },
        'git.log': { tier: 'SAFE', allowed: true },
        'git.diff': { tier: 'SAFE', allowed: true },
        'git.commit': { tier: 'PROTECTED', allowed: true, requiresApproval: false },
        'git.push': { tier: 'HIGH_RISK', allowed: true, requiresApproval: false },
        'fs.read': { tier: 'SAFE', allowed: true },
        'fs.write': { tier: 'PROTECTED', allowed: true },
        'shell.restricted': { tier: 'CONTROLLED', allowed: true },
        'shell.root': { tier: 'CRITICAL', allowed: false }
    };

    static evaluateRequest(capabilityName, commandPayload = '') {
        const cmd = (commandPayload || '').toLowerCase();

        // 1. Hard-Deny destructive system commands
        if (cmd.includes('rm -rf /') || cmd.includes(':(){ :|:& };:') || cmd.includes('mkfs') || cmd.includes('dd if=')) {
            return {
                allowed: false,
                reason: 'DENIED_DESTRUCTIVE_PATTERN',
                tier: 'CRITICAL'
            };
        }

        const perm = this.PERMISSION_MATRIX[capabilityName] || { tier: 'UNKNOWN', allowed: false };
        return {
            allowed: perm.allowed,
            tier: perm.tier,
            requiresApproval: perm.requiresApproval || false,
            reason: perm.allowed ? 'POLICY_PERMITTED' : 'CAPABILITY_NOT_PERMITTED'
        };
    }
}
