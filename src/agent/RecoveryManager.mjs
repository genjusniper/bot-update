// src/agent/RecoveryManager.mjs
export class RecoveryManager {
    static checkProviderHealth(healthStats) {
        // Assume healthStats has failure rates
        const primaryFailed = healthStats.gemini > 3;
        const secondaryFailed = healthStats.groq > 3;
        
        if (primaryFailed && secondaryFailed) {
            return 'OFFLINE';
        }
        if (primaryFailed) {
            return 'DEGRADED';
        }
        return 'NORMAL';
    }

    static generateRecoveryResponse(mode, context) {
        if (mode === 'OFFLINE') {
            return "Maaf, sistem AI sedang offline total (semua provider tumbang). Saya akan merespons ulang begitu jaringan stabil. 🙏";
        }
        if (mode === 'DEGRADED') {
            return "(Mode Darurat - Respons mungkin sedikit kurang cerdas) " + context.fallbackResponse;
        }
        return null;
    }
}
