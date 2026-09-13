/**
 * PromptInjectionFirewall.mjs
 * 
 * OWASP Top 10 for LLMs / Agent Security compliant firewall.
 * Intercepts untrusted external inputs across:
 * - Direct chats & Group messages
 * - Scraped external links & web content
 * - Third-party API / Webhook payloads
 * 
 * Defenses:
 * - System Prompt Exfiltration ("Print your instructions", "Bocorkan system prompt")
 * - Goal Hijacking & Rule Overrides ("Abaikan semua aturan sebelumnya", "Ignore previous directives")
 * - Roleplay Jailbreaks ("DAN mode", "Developer override mode")
 * - Dangerous Tool Invocation & Data Exfiltration
 */

export class PromptInjectionFirewall {
    static INJECTION_PATTERNS = [
        // 1. Directive Overrides & Amnesia attacks
        {
            category: 'GOAL_HIJACKING',
            regex: /(?:abaikan|lupakan|ignore|disregard|forget)\s+(?:semua|seluruh|sebelumnya|previous|all)?\s*(?:aturan|instruksi|perintah|rule|rules|system|prompt|directives|guidelines)/i,
            severity: 'CRITICAL'
        },
        {
            category: 'INSTRUCTION_OVERRIDE',
            regex: /(?:mulai\s+sekarang|from\s+now\s+on|new\s+rule|system\s*override)\s*:?\s*(?:kamu\s+adalah|you\s+are|kamu\s+bukan|you\s+must\s+obey|ignore)?/i,
            severity: 'HIGH'
        },

        // 2. System Prompt & Secret Exfiltration
        {
            category: 'DATA_EXFILTRATION',
            regex: /(?:tampilkan|print|bocorkan|show|reveal|dump|kirim)\s+(?:system\s*prompt|instruksi\s*awal|api[_\s]*key|token|password|kredensial|database|seluruh\s*data)/i,
            severity: 'CRITICAL'
        },
        {
            category: 'PROMPT_LEAK',
            regex: /(?:what\s+(?:is|are)\s+your\s+(?:system\s+instructions|system\s+prompt|core\s+rules))/i,
            severity: 'HIGH'
        },

        // 3. Jailbreak & God Mode Framing
        {
            category: 'JAILBREAK_ROLEPLAY',
            regex: /(?:dan\s+mode|jailbreak|developer\s+mode|unrestricted\s+mode|bypass\s+all\s+filters|tanpa\s+batasan|tanpa\s+sensor)/i,
            severity: 'HIGH'
        },

        // 4. Autonomous Command & Code Injection
        {
            category: 'COMMAND_INJECTION',
            regex: /(?:rm\s+-rf|DROP\s+TABLE|DELETE\s+FROM|exec\s*\(|eval\s*\(|__proto__|cat\s+\/etc\/passwd)/i,
            severity: 'CRITICAL'
        }
    ];

    /**
     * Inspect incoming text for prompt injection / malicious manipulation
     * @param {string} text - Raw input from untrusted sender
     * @param {Object} [meta] - Channel, sender identity, context
     * @returns {Object} Inspection result
     */
    static inspect(text, meta = {}) {
        const raw = String(text || '').trim();
        if (!raw) return { clean: true, sanitizedText: '' };

        const matchedAttacks = [];

        for (const pattern of this.INJECTION_PATTERNS) {
            if (pattern.regex.test(raw)) {
                matchedAttacks.push({
                    category: pattern.category,
                    severity: pattern.severity
                });
            }
        }

        if (matchedAttacks.length > 0) {
            const highestSeverity = matchedAttacks.some(a => a.severity === 'CRITICAL') ? 'CRITICAL' : 'HIGH';
            return {
                clean: false,
                blocked: true,
                severity: highestSeverity,
                matchedAttacks,
                untrustedText: raw,
                safeResponse: 'Perintah tersebut terdeteksi mencoba mengubah instruksi inti sistem dan telah diblokir secara otomatis oleh firewall keamanan Salim.',
                action: 'QUARANTINE'
            };
        }

        // Input is safe from injection
        return {
            clean: true,
            blocked: false,
            sanitizedText: raw
        };
    }
}
