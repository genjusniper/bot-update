// src/security/RiskEvaluator.mjs — PATCHED (FIX #6: Smarter blocklist)
// POLICY = AUTHORITY
export class RiskEvaluator {
    static DANGEROUS_PATTERNS = [
        /rm\s+-[rf]+/,          // rm -rf, rm -r
        /mkfs/,                  // Format filesystem
        /dd\s+if=/,              // Disk wipe
        />\s*\/dev\/[a-z]+/,    // Write to device
        /curl.+\|\s*sh/,        // Remote code execution
        /wget.+\|\s*sh/,        // Remote code execution
        /:\(\)\s*\{\s*:\|:/,    // Fork bomb
        /chmod\s+-R\s+[0-9]/,  // chmod recursively
        /nohup\s+/,             // Detached process
        /&\s*disown/,           // Disown background process
        /\/proc\//,             // Proc filesystem access
        /\/sys\//,              // Sys filesystem access
    ];

    static SENSITIVE_READ_PATTERNS = [
        /cat\s+.*\.env/,
        /cat\s+.*memory\//,
        /printenv/,
        /env\s*$/,
    ];

    static checkRisk(toolName, args) {
        const allowedTools = ['read_file', 'write_file', 'run_git', 'query_database'];
        
        if (!allowedTools.includes(toolName) && toolName !== 'shell') {
            return { allowed: false, reason: `CRITICAL_RISK: Tool "${toolName}" is not in the allowed capability list.` };
        }

        if (toolName === 'shell') {
            const cmd = String(args).toLowerCase();

            for (const pattern of this.DANGEROUS_PATTERNS) {
                if (pattern.test(cmd)) {
                    return { allowed: false, reason: `CRITICAL_RISK: Blocked by pattern "${pattern}"` };
                }
            }
            for (const pattern of this.SENSITIVE_READ_PATTERNS) {
                if (pattern.test(cmd)) {
                    return { allowed: false, reason: `HIGH_RISK: Sensitive file access blocked by pattern "${pattern}"` };
                }
            }

            return { allowed: true, executeAs: 'restricted_shell' };
        }

        return { allowed: true, executeAs: 'structured_tool' };
    }
}
