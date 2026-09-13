/**
 * CostIntelligenceEngine.mjs
 * 
 * Cost Intelligence & Model Routing Engine.
 * Prevents operational blowout ("anti boncos") by:
 * - Routing simple questions to cheap/local fast models
 * - Reserving heavy reasoning models for complex objections & architecture
 * - Serving cached responses for high-confidence repeat queries
 * - Tracking daily/monthly token budgets per tenant
 */

export class CostIntelligenceEngine {
    constructor() {
        this.cache = new Map(); // Semantic/Exact FAQ cache
        this.tenantBudgets = new Map(); // tenantId -> { dailyLimitRp, monthlyLimitRp, usedTodayRp, usedMonthRp }
    }

    /**
     * Choose the optimal cost-effective model based on input complexity
     */
    static routeModel({ intent, text, requiresComplexReasoning = false }) {
        const clean = (text || '').trim();

        // 1. Simple Greetings & FAQ -> Fast/Cheap Model
        if (clean.length < 30 && (intent === 'CASUAL_CHAT' || intent === 'PRODUCT_INQUIRY')) {
            return {
                modelTier: 'CHEAP_FAST',
                suggestedModel: 'gemini-1.5-flash-8b',
                estimatedCostRp: 2, // ~Rp 2 per 1k tokens
                reason: 'Short query requires low compute depth.'
            };
        }

        // 2. High-Stake Objections & Architectural Discussions -> Reasoning Tier
        if (requiresComplexReasoning || intent === 'TECHNICAL_ARCHITECTURE' || intent === 'OBJECTION_PRICING') {
            return {
                modelTier: 'STRONG_REASONING',
                suggestedModel: 'gemini-2.5-flash',
                estimatedCostRp: 15,
                reason: 'Deep objection deconstruction requires high semantic nuance.'
            };
        }

        // Default -> Standard Balanced Tier
        return {
            modelTier: 'BALANCED',
            suggestedModel: 'gemini-2.5-flash',
            estimatedCostRp: 8,
            reason: 'Standard business interaction.'
        };
    }

    /**
     * Look up response cache to avoid LLM cost entirely
     */
    checkCache(queryText) {
        const normalized = (queryText || '').trim().toLowerCase().replace(/[^\w\s]/g, '');
        if (this.cache.has(normalized)) {
            const hit = this.cache.get(normalized);
            hit.hits += 1;
            return {
                hit: true,
                response: hit.response,
                savedCostRp: hit.costSavedRp
            };
        }
        return { hit: false };
    }

    /**
     * Store high-confidence response in cache
     */
    setCache(queryText, response, costSavedRp = 10) {
        const normalized = (queryText || '').trim().toLowerCase().replace(/[^\w\s]/g, '');
        if (normalized.length > 5) {
            this.cache.set(normalized, {
                response,
                costSavedRp,
                hits: 0,
                cachedAt: Date.now()
            });
        }
    }

    /**
     * Check and deduct budget
     */
    checkAndDeductBudget(tenantId, estimatedCostRp) {
        if (!this.tenantBudgets.has(tenantId)) {
            this.tenantBudgets.set(tenantId, {
                dailyLimitRp: 100000, // Rp 100k daily cap default
                usedTodayRp: 0
            });
        }

        const budget = this.tenantBudgets.get(tenantId);
        if (budget.usedTodayRp + estimatedCostRp > budget.dailyLimitRp) {
            return {
                allowed: false,
                reason: 'DAILY_BUDGET_EXCEEDED',
                message: 'Batas kuota harian operasional AI untuk tenant ini telah tercapai.'
            };
        }

        budget.usedTodayRp += estimatedCostRp;
        return { allowed: true, remainingRp: budget.dailyLimitRp - budget.usedTodayRp };
    }
}
