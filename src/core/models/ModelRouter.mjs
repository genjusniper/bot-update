// src/core/models/ModelRouter.mjs
// Dynamic Multi-Model Provider Router with Circuit Breaker and Automatic Failover

export class ModelRouter {
    static PROVIDERS = Object.freeze({
        GEMINI: 'GEMINI_2_5_FLASH',
        GROQ: 'GROQ_LLAMA_3_3',
        LOCAL: 'LOCAL_FALLBACK'
    });

    /**
     * Resolves the primary and fallback provider based on query requirements and circuit health
     * @param {Object} params
     * @param {string} params.intent - From signal fusion
     * @param {boolean} [params.hasImage=false]
     * @param {boolean} [params.geminiAvailable=true]
     * @param {boolean} [params.groqAvailable=true]
     * @returns {{ primary: string, fallback: string, reasoning: string }}
     */
    static selectProvider({ intent = 'CHAT', hasImage = false, geminiAvailable = true, groqAvailable = true }) {
        // Rule 1: Vision / Image queries REQUIRE Gemini
        if (hasImage) {
            return {
                primary: this.PROVIDERS.GEMINI,
                fallback: this.PROVIDERS.LOCAL,
                reasoning: 'Image attached; vision requires Gemini Multimodal'
            };
        }

        // Rule 2: Fast casual chit-chat or banter -> Prefer Groq for ultra-low latency
        if ((intent === 'GREETING' || intent === 'CHAT') && groqAvailable) {
            return {
                primary: this.PROVIDERS.GROQ,
                fallback: geminiAvailable ? this.PROVIDERS.GEMINI : this.PROVIDERS.LOCAL,
                reasoning: 'Fast casual interaction routed to Groq LLaMA 3.3'
            };
        }

        // Rule 3: Deep reasoning, problem solving, complex queries -> Gemini
        if (geminiAvailable) {
            return {
                primary: this.PROVIDERS.GEMINI,
                fallback: groqAvailable ? this.PROVIDERS.GROQ : this.PROVIDERS.LOCAL,
                reasoning: 'Complex reasoning routed to Gemini 2.5 Flash'
            };
        }

        // Rule 4: If Gemini down but Groq up
        if (groqAvailable) {
            return {
                primary: this.PROVIDERS.GROQ,
                fallback: this.PROVIDERS.LOCAL,
                reasoning: 'Gemini circuit open; failover to Groq'
            };
        }

        // Rule 5: Total outage -> Local fallback
        return {
            primary: this.PROVIDERS.LOCAL,
            fallback: this.PROVIDERS.LOCAL,
            reasoning: 'All cloud providers circuit open; engaging local fallback'
        };
    }
}
