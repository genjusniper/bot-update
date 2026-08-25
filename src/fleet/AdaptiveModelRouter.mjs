// src/fleet/AdaptiveModelRouter.mjs
// Adaptive Model Router based on Semantic Complexity & Cost Efficiency

export class AdaptiveModelRouter {
    static evaluateComplexity(message) {
        const text = (message || '').trim().toLowerCase();
        let score = 30; // baseline normal chat

        // 1. Check for ultra-simple single word / greeting (< 10)
        if (/^(p|oi|wkwk|lah|anjir|iya|oke|gas|siap|makasih|halo|yo|sip)$/i.test(text) || text.length <= 4) {
            return {
                tier: 'SIMPLE',
                complexityScore: 10,
                recommendedRoute: 'LOCAL_FAST_PATH',
                targetModel: null
            };
        }

        // 2. Check for complex coding / multi-step technical query
        if (text.includes('```') || text.match(/(analisis|arsitektur|debug|algoritma|refactor|database query|konfigurasi)/i)) {
            score = 80;
            return {
                tier: 'COMPLEX',
                complexityScore: score,
                recommendedRoute: 'STRONG_MODEL',
                targetModel: 'gemini-3.5-flash-lite'
            };
        }

        // 3. Storytelling / Multi-sentence curhat
        if (text.length > 100 || text.split(/\s+/).length > 20) {
            score = 55;
            return {
                tier: 'NORMAL_HIGH',
                complexityScore: score,
                recommendedRoute: 'FLASH_LITE',
                targetModel: 'gemini-flash-lite-latest'
            };
        }

        // 4. Standard conversational turn
        return {
            tier: 'NORMAL',
            complexityScore: 35,
            recommendedRoute: 'FLASH_LITE',
            targetModel: 'gemini-flash-lite-latest'
        };
    }
}
