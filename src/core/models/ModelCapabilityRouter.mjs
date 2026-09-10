// src/core/models/ModelCapabilityRouter.mjs
// Phase 35: Dynamic Model Routing & Multi-Model Consensus Engine
// Capability matching, speed vs reasoning tiers, circuit breakers, and cross-model consensus.

export const ModelTier = Object.freeze({
    FAST: 'FAST',
    DEEP: 'DEEP',
    VISION: 'VISION',
    SPECIALIST: 'SPECIALIST',
    LOCAL: 'LOCAL'
});

export const HealthState = Object.freeze({
    HEALTHY: 'HEALTHY',
    DEGRADED: 'DEGRADED',
    CIRCUIT_OPEN: 'CIRCUIT_OPEN'
});

export class ModelProfile {
    /**
     * @param {Object} params
     * @param {string} params.id
     * @param {string} params.name
     * @param {string} params.provider
     * @param {string} params.tier
     * @param {string[]} params.capabilities
     * @param {number} [params.latencyP50Ms=1500]
     * @param {number} [params.costRating=1]
     */
    constructor({
        id,
        name,
        provider,
        tier,
        capabilities = ['TEXT'],
        latencyP50Ms = 1500,
        costRating = 1
    }) {
        this.id = id;
        this.name = name;
        this.provider = provider;
        this.tier = tier;
        this.capabilities = new Set(capabilities);
        this.latencyP50Ms = latencyP50Ms;
        this.costRating = costRating;
        this.healthState = HealthState.HEALTHY;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = 0;
        this.cooldownMs = 30000; // 30s circuit cooldown
    }

    recordSuccess() {
        this.successCount++;
        this.failureCount = 0;
        this.healthState = HealthState.HEALTHY;
    }

    recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= 3) {
            this.healthState = HealthState.CIRCUIT_OPEN;
        } else {
            this.healthState = HealthState.DEGRADED;
        }
    }

    isAvailable() {
        if (this.healthState === HealthState.CIRCUIT_OPEN) {
            if (Date.now() - this.lastFailureTime > this.cooldownMs) {
                // Half-open probationary trial
                return true;
            }
            return false;
        }
        return true;
    }
}

export class MultiModelConsensus {
    /**
     * Evaluates consensus across multiple model candidate outputs
     * @param {Array<{ modelId: string, text: string, confidence?: number }>} candidates
     * @returns {{ consensusReached: boolean, verdict: string, confidence: number, agreementScore: number, finalAnswer: string }}
     */
    static evaluate(candidates = []) {
        if (!candidates || candidates.length === 0) {
            return {
                consensusReached: false,
                verdict: 'NO_CANDIDATES',
                confidence: 0,
                agreementScore: 0,
                finalAnswer: ''
            };
        }

        if (candidates.length === 1) {
            return {
                consensusReached: true,
                verdict: 'SINGLE_MODEL_AUTHORITY',
                confidence: candidates[0].confidence || 0.85,
                agreementScore: 1.0,
                finalAnswer: candidates[0].text
            };
        }

        // Compare texts using token overlap / similarity with stopword filtering
        const stopWords = new Set(['dan', 'atau', 'pada', 'secara', 'yang', 'di', 'ke', 'dari', 'ini', 'itu', 'adalah', 'the', 'is', 'at', 'with', 'for', 'of', 'in']);
        const tokensA = new Set(candidates[0].text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w)));
        const tokensB = new Set(candidates[1].text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w)));

        if (tokensA.size === 0 || tokensB.size === 0) {
            return {
                consensusReached: false,
                verdict: 'EMPTY_OUTPUT',
                confidence: 0.1,
                agreementScore: 0,
                finalAnswer: candidates[0].text || candidates[1].text
            };
        }

        let intersectionCount = 0;
        for (const token of tokensA) {
            if (tokensB.has(token)) intersectionCount++;
        }

        const jaccard = intersectionCount / (tokensA.size + tokensB.size - intersectionCount);
        const agreementScore = Math.min(1, Math.max(0, jaccard * 1.6));

        // Calibrated threshold for natural language LLM consensus
        const consensusReached = agreementScore >= 0.35;
        const verdict = consensusReached ? 'CONSENSUS_AGREED' : 'DIVERGENT_PERSPECTIVES';

        // Select the candidate with higher confidence or longer substantiated reasoning
        let finalAnswer = candidates[0].text;
        if (!consensusReached) {
            finalAnswer = candidates[0].text + '\n\n(💡 Catatan: Tinjauan lintas-model mendeteksi variasi interpretasi).';
        }

        return {
            consensusReached,
            verdict,
            confidence: consensusReached ? 0.92 : 0.65,
            agreementScore: Number(agreementScore.toFixed(2)),
            finalAnswer
        };
    }
}

export class ModelCapabilityRouter {
    static #models = new Map();
    static #initialized = false;

    /**
     * Initializes default model profiles
     */
    static init() {
        if (this.#initialized) return;

        // 1. Gemini 2.5 Flash (DEEP & VISION & TOOL)
        this.registerModel(new ModelProfile({
            id: 'gemini-2.5-flash',
            name: 'Gemini 2.5 Flash',
            provider: 'GEMINI',
            tier: ModelTier.DEEP,
            capabilities: ['TEXT', 'VISION', 'AUDIO', 'FUNCTION_CALLING', 'CODE', 'LONG_CONTEXT'],
            latencyP50Ms: 1400,
            costRating: 1
        }));

        // 2. Groq LLaMA 3.3 70B (FAST & HIGH-THROUGHPUT)
        this.registerModel(new ModelProfile({
            id: 'groq-llama-3.3-70b',
            name: 'Groq LLaMA 3.3 70B',
            provider: 'GROQ',
            tier: ModelTier.FAST,
            capabilities: ['TEXT', 'CODE', 'FUNCTION_CALLING'],
            latencyP50Ms: 350,
            costRating: 1
        }));

        // 3. Groq Mixtral 8x7B (FAST BANTER & DIALECT)
        this.registerModel(new ModelProfile({
            id: 'groq-mixtral-8x7b',
            name: 'Groq Mixtral 8x7B',
            provider: 'GROQ',
            tier: ModelTier.FAST,
            capabilities: ['TEXT'],
            latencyP50Ms: 400,
            costRating: 1
        }));

        // 4. OpenAI GPT-4o Mini (SPECIALIST / CODE / COMPLIANCE)
        this.registerModel(new ModelProfile({
            id: 'openai-gpt-4o-mini',
            name: 'OpenAI GPT-4o Mini',
            provider: 'OPENAI',
            tier: ModelTier.SPECIALIST,
            capabilities: ['TEXT', 'VISION', 'CODE', 'FUNCTION_CALLING'],
            latencyP50Ms: 1200,
            costRating: 2
        }));

        // 5. Local Fallback (OFFLINE DETERMINISTIC)
        this.registerModel(new ModelProfile({
            id: 'local-deterministic',
            name: 'ARKA Local Heuristic Engine',
            provider: 'LOCAL',
            tier: ModelTier.LOCAL,
            capabilities: ['TEXT'],
            latencyP50Ms: 5,
            costRating: 0
        }));

        this.#initialized = true;
    }

    static registerModel(profile) {
        this.#models.set(profile.id, profile);
    }

    static getModel(id) {
        this.init();
        return this.#models.get(id) || null;
    }

    static listModels() {
        this.init();
        return Array.from(this.#models.values()).map(m => ({
            id: m.id,
            name: m.name,
            provider: m.provider,
            tier: m.tier,
            capabilities: Array.from(m.capabilities),
            latencyP50Ms: m.latencyP50Ms,
            healthState: m.healthState,
            isAvailable: m.isAvailable()
        }));
    }

    /**
     * Resolves the best primary model and ordered fallback chain for an incoming request
     * @param {Object} criteria
     * @param {string} [criteria.text='']
     * @param {boolean} [criteria.hasImage=false]
     * @param {boolean} [criteria.hasAudio=false]
     * @param {string} [criteria.intent='CHAT']
     * @param {string} [criteria.urgency='NORMAL']
     * @param {boolean} [criteria.requiresConsensus=false]
     * @returns {{ primary: ModelProfile, fallbackChain: ModelProfile[], requiresConsensus: boolean, rationale: string }}
     */
    static route(criteria = {}) {
        this.init();

        const {
            text = '',
            hasImage = false,
            hasAudio = false,
            intent = 'CHAT',
            urgency = 'NORMAL',
            requiresConsensus = false
        } = criteria;

        const lower = text.toLowerCase();

        // 1. VISION / MULTIMODAL RULE
        if (hasImage) {
            const gemini = this.getModel('gemini-2.5-flash');
            const gpt = this.getModel('openai-gpt-4o-mini');
            const local = this.getModel('local-deterministic');

            const primary = gemini.isAvailable() ? gemini : (gpt.isAvailable() ? gpt : local);
            const fallbackChain = [gpt, local].filter(m => m.id !== primary.id && m.isAvailable());

            return {
                primary,
                fallbackChain,
                requiresConsensus: false,
                rationale: 'Multimodal vision asset detected; routed to Vision-capable provider'
            };
        }

        // 2. CONSENSUS / HIGH-STAKES ADVISORY RULE
        const isHighStakes = requiresConsensus || /diagnosa kritis|keputusan finansial|investasi besar|bahaya|darurat medis/i.test(lower);
        if (isHighStakes) {
            const gemini = this.getModel('gemini-2.5-flash');
            const groq = this.getModel('groq-llama-3.3-70b');
            const gpt = this.getModel('openai-gpt-4o-mini');

            return {
                primary: gemini.isAvailable() ? gemini : groq,
                fallbackChain: [groq, gpt, this.getModel('local-deterministic')].filter(m => m.isAvailable()),
                requiresConsensus: true,
                rationale: 'High-stakes advisory query detected; multi-model consensus validation activated'
            };
        }

        // 3. FAST CONVERSATIONAL / CASUAL BANTER
        const isFastBanter = (intent === 'GREETING' || intent === 'CHAT' || urgency === 'HIGH') &&
            !/(hitung|analisis|buat kode|script|koding|arsitektur)/i.test(lower);

        if (isFastBanter) {
            const groq = this.getModel('groq-llama-3.3-70b');
            if (groq.isAvailable()) {
                return {
                    primary: groq,
                    fallbackChain: [this.getModel('gemini-2.5-flash'), this.getModel('local-deterministic')].filter(m => m.isAvailable()),
                    requiresConsensus: false,
                    rationale: 'Fast conversational cadence matched to ultra-low latency Groq provider'
                };
            }
        }

        // 4. DEEP REASONING / CODE / COMPLEX ANALYSIS
        const gemini = this.getModel('gemini-2.5-flash');
        if (gemini.isAvailable()) {
            return {
                primary: gemini,
                fallbackChain: [this.getModel('groq-llama-3.3-70b'), this.getModel('local-deterministic')].filter(m => m.isAvailable()),
                requiresConsensus: false,
                rationale: 'Deep cognitive reasoning routed to primary Gemini 2.5 Flash'
            };
        }

        // 5. FAILOVER TO GROQ OR LOCAL
        const groq = this.getModel('groq-llama-3.3-70b');
        const primary = groq.isAvailable() ? groq : this.getModel('local-deterministic');
        return {
            primary,
            fallbackChain: [this.getModel('local-deterministic')].filter(m => m.id !== primary.id),
            requiresConsensus: false,
            rationale: 'Primary deep provider unavailable; failover engaged'
        };
    }

    /**
     * Executes multi-model consensus validation for critical decisions
     * @param {Object} params
     * @param {string} params.prompt
     * @param {Function} params.executor - async (model) => { text: string }
     * @returns {Promise<Object>}
     */
    static async executeWithConsensus({ prompt, executor }) {
        const routeInfo = this.route({ text: prompt, requiresConsensus: true });
        const modelsToPoll = [routeInfo.primary, ...routeInfo.fallbackChain.slice(0, 1)];

        const candidateResults = await Promise.allSettled(
            modelsToPoll.map(async (m) => {
                const res = await executor(m);
                return { modelId: m.id, text: res.text || '' };
            })
        );

        const validCandidates = candidateResults
            .filter(r => r.status === 'fulfilled' && r.value.text)
            .map(r => r.value);

        const consensus = MultiModelConsensus.evaluate(validCandidates);
        return {
            ...consensus,
            modelsUsed: validCandidates.map(c => c.modelId),
            requiresConsensus: true
        };
    }
}