// src/security/SecretVault.mjs

export class SecretVault {
    static sanitizePrompt(rawPrompt) {
        if (!rawPrompt || typeof rawPrompt !== 'string') return rawPrompt;

        // Strip API keys, tokens, ssh passwords from being mirrored into LLM prompts
        let clean = rawPrompt;

        // Gemini/Google API Key Pattern: AIzaSy...
        clean = clean.replace(/AIzaSy[A-Za-z0-9_-]{33}/g, '[REDACTED_API_KEY]');

        // Generic Token / Password keys
        clean = clean.replace(/(password|secret|token|ssh_password)\s*[:=]\s*['"]?[A-Za-z0-9_\-@!#%&*]{4,}['"]?/gi, '$1=[REDACTED]');

        return clean;
    }
}
