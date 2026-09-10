// src/core/control/CommandRouter.mjs
// Deterministic Command Router separating operational system commands from conversational AI

export class CommandRouter {
    /**
     * Map of command aliases to normalized internal action names
     */
    static COMMAND_MAP = {
        '/status': 'STATUS',
        '!status': 'STATUS',
        '/health': 'HEALTH',
        '!health': 'HEALTH',
        '/problems': 'PROBLEMS',
        '/problem': 'PROBLEMS',
        '/doctor': 'DOCTOR',
        '!doctor': 'DOCTOR',
        '/restart': 'RESTART',
        '!restart': 'RESTART',
        '/shutdown': 'SHUTDOWN',
        '!shutdown': 'SHUTDOWN',
        '/pause': 'PAUSE',
        '/resume': 'RESUME',
        '/safe-mode': 'SAFE_MODE',
        '/safemode': 'SAFE_MODE',
        '/queue': 'QUEUE',
        '/uptime': 'UPTIME',
        '/metrics': 'METRICS',
        '/explain': 'EXPLAIN',
        '/help': 'HELP',
        '/menu': 'HELP'
    };

    /**
     * Resolves incoming text into a deterministic command route
     * @param {CanonicalMessage|string} message
     * @returns {{ isCommand: boolean, command: string|null, rawCommand: string|null, args: string[], rawText: string }}
     */
    static resolve(message) {
        const text = (typeof message === 'string' ? message : message?.text || '').trim();
        if (!text) {
            return { isCommand: false, command: null, rawCommand: null, args: [], rawText: '' };
        }

        const parts = text.split(/\s+/);
        const trigger = parts[0].toLowerCase();

        // 1. Check direct prefix matches (/ or !)
        if (trigger in this.COMMAND_MAP) {
            return {
                isCommand: true,
                command: this.COMMAND_MAP[trigger],
                rawCommand: trigger,
                args: parts.slice(1),
                rawText: text
            };
        }

        // 2. Check natural language commands for owner (e.g. "cek status", "restart bot", "cek health")
        const lower = text.toLowerCase();
        if (lower === 'cek status' || lower === 'status bot') {
            return { isCommand: true, command: 'STATUS', rawCommand: '/status', args: [], rawText: text };
        }
        if (lower === 'cek health' || lower === 'kondisi bot' || lower === 'health check') {
            return { isCommand: true, command: 'HEALTH', rawCommand: '/health', args: [], rawText: text };
        }
        if (lower === 'diagnosa bot' || lower === 'cek masalah bot') {
            return { isCommand: true, command: 'DOCTOR', rawCommand: '/doctor', args: [], rawText: text };
        }

        return { isCommand: false, command: null, rawCommand: null, args: [], rawText: text };
    }
}
