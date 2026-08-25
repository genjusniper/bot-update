// src/context/ContextBudgetManager.mjs
// Context Budget Manager — Strict Token & Size Allocation

export class ContextBudgetManager {
    static BUDGET_LIMITS = {
        SYSTEM_CORE: 500,
        STYLE_PROFILE: 250,
        RELATIONSHIP: 100,
        RECENT_CHAT: 800,
        RELEVANT_MEMORY: 300,
        USER_MESSAGE: 100,
        MAX_TOTAL: 2050
    };

    static estimateTokens(text) {
        if (!text || typeof text !== 'string') return 0;
        // Approximation: ~4 chars per token for Indonesian/Javanese mixed text
        return Math.ceil(text.length / 3.8);
    }

    static fitToBudget(rawHistory = [], maxMessages = 10) {
        let history = rawHistory.slice(-maxMessages);
        let currentTokens = history.reduce((acc, m) => acc + this.estimateTokens(m.text), 0);

        // Prune oldest turns if exceeding recent chat budget (800 tokens)
        while (currentTokens > this.BUDGET_LIMITS.RECENT_CHAT && history.length > 2) {
            history.shift();
            currentTokens = history.reduce((acc, m) => acc + this.estimateTokens(m.text), 0);
        }

        return {
            history,
            estimatedTokens: currentTokens,
            isWithinBudget: currentTokens <= this.BUDGET_LIMITS.RECENT_CHAT
        };
    }

    static filterMemoriesByBudget(memories = [], maxTokens = 300) {
        const selected = [];
        let accumulatedTokens = 0;

        for (const mem of memories) {
            const memText = typeof mem === 'string' ? mem : (mem.object || mem.text || '');
            const tokens = this.estimateTokens(memText);
            if (accumulatedTokens + tokens <= maxTokens) {
                selected.push(mem);
                accumulatedTokens += tokens;
            } else {
                break;
            }
        }

        return selected;
    }
}
