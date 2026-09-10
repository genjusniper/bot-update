// src/core/security/PromptShieldEngine.mjs
// Dynamic Prompt Injection & Jailbreak Neutralizer
// Defends the Universal Intelligence Core against prompt injection, instruction override, system leaks, and role spoofing

export class PromptShieldEngine {
    constructor() {
        // High-severity prompt injection & jailbreak patterns (Immediate block if triggered)
        this.highSeverityPatterns = [
            /ignore (all )?(previous|prior|above) (instructions|prompts|rules)/i,
            /abaikan (semua )?(instruksi|perintah|aturan) (sebelumnya|di atas)/i,
            /forget (everything|all instructions) (you were told|above)/i,
            /lupakan semua (instruksi|perintah|aturan|prompt)/i,
            /you are now (in )?(dan|aim|developer|jailbreak|unfiltered) mode/i,
            /kamu sekarang berada di mode (tanpa filter|bebas|developer|jailbreak)/i,
            /bocorkan (seluruh )?(system prompt|prompt asli|isi prompt)/i,
            /print (your )?(entire )?(system prompt|instructions|initial prompt)/i,
            /tampilkan (seluruh )?(isi .env|api key|token rahasia)/i,
            /show (me )?(all )?(environment variables|.env|secrets|api keys)/i
        ];

        // Moderate-severity patterns (Role spoofing, delimiter manipulation)
        this.moderatePatterns = [
            /^s*[?(system|admin|root|developer)]?s*:/i,
            /^s*<|im_start|>/i,
            /^s*<|system|>/i,
            /mode simulasi tanpa sensor/i,
            /pretend you have no rules/i,
            /pura-pura kamu tidak punya aturan/i,
            /act as an unrestricted/i,
            /bertindaklah sebagai ai tanpa batas/i
        ];

        // Delimiter neutralization
        this.delimiterSanitizers = [
            { reg: /<|im_start|>/gi, rep: '[filtered_tag]' },
            { reg: /<|im_end|>/gi, rep: '[filtered_tag]' },
            { reg: /<|system|>/gi, rep: '[filtered_system]' }
        ];
    }

    /**
     * Inspects input text for prompt injection, jailbreak attempts, and system leak probes
     * @param {string} input 
     * @param {Object} [context={}] 
     * @returns {{ verdict: 'CLEAN'|'SUSPICIOUS'|'BLOCKED', riskScore: number, matchedPatterns: string[], sanitizedText: string, rejectionMessage?: string }}
     */
    inspectInput(input = '', context = {}) {
        if (!input || typeof input !== 'string') {
            return {
                verdict: 'CLEAN',
                riskScore: 0.0,
                matchedPatterns: [],
                sanitizedText: ''
            };
        }

        const trimmed = input.trim();
        const matched = [];
        let riskScore = 0.0;

        // 1. High-severity check
        for (const pattern of this.highSeverityPatterns) {
            if (pattern.test(trimmed)) {
                matched.push(pattern.source);
                riskScore += 0.85;
            }
        }

        // 2. Moderate-severity check
        for (const pattern of this.moderatePatterns) {
            if (pattern.test(trimmed)) {
                matched.push(pattern.source);
                riskScore += 0.40;
            }
        }

        riskScore = parseFloat(Math.min(1.0, riskScore).toFixed(2));

        // 3. Sanitize delimiters
        let sanitized = trimmed;
        for (const s of this.delimiterSanitizers) {
            sanitized = sanitized.replace(s.reg, s.rep);
        }

        // 4. Verdict assignment
        if (riskScore >= 0.70) {
            return {
                verdict: 'BLOCKED',
                riskScore,
                matchedPatterns: matched,
                sanitizedText: sanitized,
                rejectionMessage: 'perintah tidak dapat diproses.'
            };
        }

        if (riskScore >= 0.30) {
            return {
                verdict: 'SUSPICIOUS',
                riskScore,
                matchedPatterns: matched,
                sanitizedText: sanitized
            };
        }

        return {
            verdict: 'CLEAN',
            riskScore: 0.0,
            matchedPatterns: [],
            sanitizedText: sanitized
        };
    }
}

export const promptShieldEngine = new PromptShieldEngine();
