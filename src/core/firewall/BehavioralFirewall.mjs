// src/core/firewall/BehavioralFirewall.mjs
// Post-generation gatekeeper strictly validating LLM output against PersonalContextContract

export class BehavioralFirewall {
    static ADVICE_MARKERS = Object.freeze([
        /\b(kamu|lo|lu|anda)\s+(harus|kudu|mesti|sebaiknya|seharusnya)\b/gi,
        /\b(coba\s+(kamu|lo|lu|aja|deh|pikirkan))\b/gi,
        /\b(saran\s+(saya|aku|gue))\b/gi,
        /\b(mending\s+(kamu|lo|lu|aja))\b/gi,
        /\b(tips\s+dari\s+(aku|saya))\b/gi,
        /\b(solusi(nya)?\s+adalah)\b/gi,
        /\b(langkah\s+(pertama|selanjutnya))\b/gi
    ]);

    static HUMOR_MARKERS = Object.freeze([
        /\b(wkwk+|haha+|hehe+|xixi+|lol|lmao|rofl)\b/gi,
        /[😂🤣🤪😜😝]/gu
    ]);

    static PRIVATE_DATA_PATTERNS = Object.freeze([
        /\b08[1-9][0-9]{7,11}\b/g,               // Indonesian phone number
        /\b(\d{4}[- ]?){3}\d{4}\b/g,             // Credit card / bank account
        /\bpassword\s*[:=]\s*\S+/gi,              // Explicit credentials
        /\bapi[_-]?key\s*[:=]\s*\S+/gi
    ]);

    /**
     * Validates and calibrates generated response against PersonalContextContract
     * @param {string} rawDraft - Generated response text
     * @param {Object} contract - PersonalContextContract from PersonalSimulationKernel
     * @param {Object} [context={}] - Context { isGroup, chatId, relationshipTier, isolatedEntities }
     * @returns {Object} Verdict { isValid, violations, sanitizedText, action }
     */
    static validate(rawDraft = '', contract = {}, context = {}) {
        if (!rawDraft || typeof rawDraft !== 'string') {
            return {
                isValid: true,
                violations: [],
                sanitizedText: '',
                action: 'PASS'
            };
        }

        const violations = [];
        let sanitizedText = rawDraft.trim();
        let wasModified = false;

        const adviceAllowed = contract.cognitive?.adviceAllowed !== false;
        const humorStyle = contract.how?.humorStyle || 'OFF';
        const maxWords = contract.how?.maxWords || 30;
        const privacyLevel = contract.social?.privacyLevel || (context.isGroup ? 'PUBLIC_FORUM' : 'PRIVATE_1ON1');

        // 1. Detection Phase (Evaluated against rawDraft)
        if (!adviceAllowed) {
            for (const pattern of this.ADVICE_MARKERS) {
                pattern.lastIndex = 0;
                if (pattern.test(rawDraft)) {
                    violations.push('ADVICE_VIOLATION');
                    break;
                }
            }
        }

        if (humorStyle === 'OFF') {
            for (const pattern of this.HUMOR_MARKERS) {
                pattern.lastIndex = 0;
                if (pattern.test(rawDraft)) {
                    violations.push('HUMOR_VIOLATION');
                    break;
                }
            }
        }

        const originalWords = rawDraft.split(/\s+/).filter(Boolean);
        const maxAllowedWords = Math.max(maxWords + 2, Math.round(maxWords * 1.25));
        if (originalWords.length > maxAllowedWords) {
            violations.push('LENGTH_VIOLATION');
        }

        // Credential and private secret leaks are strictly forbidden in ALL contexts
        for (const pattern of this.PRIVATE_DATA_PATTERNS) {
            pattern.lastIndex = 0;
            if (pattern.test(rawDraft)) {
                violations.push('PRIVACY_LEAK_VIOLATION');
                break;
            }
        }

        if (privacyLevel === 'PUBLIC_FORUM' || context.isGroup) {
            if (Array.isArray(context.isolatedEntities)) {
                for (const entity of context.isolatedEntities) {
                    if (entity && typeof entity === 'string' && rawDraft.toLowerCase().includes(entity.toLowerCase())) {
                        violations.push('CROSS_CONTACT_LEAK_VIOLATION');
                        break;
                    }
                }
            }
        }

        // 2. Sanitization Phase
        // Strip advice sentences
        if (!adviceAllowed && violations.includes('ADVICE_VIOLATION')) {
            const sentences = sanitizedText.split(/(?<=[.!?\n])\s+/);
            const cleanSentences = sentences.filter(s => !this.ADVICE_MARKERS.some(p => {
                p.lastIndex = 0;
                return p.test(s);
            }));
            sanitizedText = cleanSentences.join(' ').trim();
            wasModified = true;

            if (!sanitizedText || sanitizedText.length === 0) {
                sanitizedText = 'Iya mas, cerita aja pelan-pelan...';
            }
        }

        // Strip humor markers
        if (humorStyle === 'OFF' && violations.includes('HUMOR_VIOLATION')) {
            for (const pattern of this.HUMOR_MARKERS) {
                sanitizedText = sanitizedText.replace(pattern, '').replace(/\s{2,}/g, ' ').trim();
            }
            wasModified = true;
        }

        // Clamp word length
        if (violations.includes('LENGTH_VIOLATION')) {
            const currentWords = sanitizedText.split(/\s+/).filter(Boolean);
            sanitizedText = currentWords.slice(0, maxWords).join(' ').trim();
            sanitizedText = sanitizedText.replace(/[,;:\-]+$/g, '').trim();
            wasModified = true;
        }

        // Mask privacy leaks
        if (violations.includes('PRIVACY_LEAK_VIOLATION')) {
            for (const pattern of this.PRIVATE_DATA_PATTERNS) {
                sanitizedText = sanitizedText.replace(pattern, '[REDACTED]');
            }
            wasModified = true;
        }

        // Mask cross-contact entities
        if (violations.includes('CROSS_CONTACT_LEAK_VIOLATION') && Array.isArray(context.isolatedEntities)) {
            for (const entity of context.isolatedEntities) {
                if (entity && typeof entity === 'string') {
                    const regex = new RegExp(`\\b${entity}\\b`, 'gi');
                    sanitizedText = sanitizedText.replace(regex, '[RESTRICTED]');
                }
            }
            wasModified = true;
        }

        const isValid = violations.length === 0;
        const action = isValid ? 'PASS' : (wasModified ? 'CLAMP' : 'REGENERATE');

        return {
            isValid,
            violations,
            sanitizedText,
            action,
            originalLength: originalWords.length,
            clampedLength: sanitizedText.split(/\s+/).filter(Boolean).length
        };
    }
}
