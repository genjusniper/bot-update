// src/security/IsolatedExecutor.mjs — PATCHED (FIX #1: Path Traversal)
// ISOLATED EXECUTOR = EXECUTION
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = util.promisify(exec);

// FIX #1: Only allow reads/writes within this safe base directory
const SAFE_BASE_DIR = path.resolve(process.cwd(), 'workspace');

function assertSafePath(requestedPath) {
    const resolved = path.resolve(requestedPath);
    if (!resolved.startsWith(SAFE_BASE_DIR)) {
        throw new Error(`PATH_TRAVERSAL_BLOCKED: "${requestedPath}" is outside the safe workspace.`);
    }
    return resolved;
}

export class IsolatedExecutor {
    static async execute(toolName, args, policyAction) {
        if (policyAction === 'structured_tool') {
            return await this.executeStructuredTool(toolName, args);
        }
        if (policyAction === 'restricted_shell') {
            return await this.runShellIsolated(args);
        }
        throw new Error('ISOLATION_ERROR: Unknown policy action');
    }

    static async executeStructuredTool(toolName, args) {
        try {
            const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
            
            if (toolName === 'read_file') {
                const safePath = assertSafePath(parsedArgs.path); // FIX #1
                return await fs.readFile(safePath, 'utf8');
            }
            if (toolName === 'write_file') {
                const safePath = assertSafePath(parsedArgs.path); // FIX #1
                await fs.mkdir(path.dirname(safePath), { recursive: true });
                await fs.writeFile(safePath, parsedArgs.content, 'utf8');
                return `Successfully wrote to ${safePath}`;
            }
            if (toolName === 'run_git') {
                // Only allow safe git subcommands
                const allowedGitCmds = ['status', 'log', 'diff', 'pull', 'push', 'commit'];
                const subcmd = String(parsedArgs.command).split(' ')[0];
                if (!allowedGitCmds.includes(subcmd)) {
                    throw new Error(`GIT_CMD_BLOCKED: "${subcmd}" is not in the allowed git command list.`);
                }
                const { stdout } = await execAsync(`git ${parsedArgs.command}`, { timeout: 5000 });
                return stdout.trim();
            }
            return `Tool ${toolName} executed safely as structured data.`;
        } catch (e) {
            throw new Error(`STRUCTURED_TOOL_ERROR: ${e.message}`);
        }
    }

    static async runShellIsolated(cmd) {
        try {
            const { stdout, stderr } = await execAsync(cmd, { 
                timeout: 5000,
                env: { PATH: process.env.PATH } // Minimal env — no secrets passed
            });
            if (stderr) return `[STDERR]: ${stderr.trim()}`;
            return stdout.trim() || 'Executed successfully (no output)';
        } catch(e) {
            throw new Error(`ISOLATED_SHELL_ERROR: ${e.message}`);
        }
    }
}
