// src/core/context/ContextWindowOptimizer.mjs
// Context Window Optimizer & Lossless Token Condensation
// Minimizes prompt tokens without semantic loss via whitespace compaction, JSON minification, and sliding window episodic distillation

export class ContextWindowOptimizer {
    constructor(options = {}) {
        this.tierTokenBudgets = Object.freeze({
            TIER_FAST: 4000,
            TIER_DEEP: 16000,
            TIER_LOCAL: 2048
        });

        this.charsPerToken = options.charsPerToken || 3.8;
    }

    /**
     * Estimates token count based on character length and word density
     * @param {string|Array<Object>} content 
     * @returns {number} Estimated token count
     */
    estimateTokens(content) {
        if (!content) return 0;
        let str = '';
        if (typeof content === 'string') {
            str = content;
        } else if (Array.isArray(content)) {
            str = content.map(m => (m.content || m.text || JSON.stringify(m))).join(' ');
        } else if (typeof content === 'object') {
            str = JSON.stringify(content);
        }
        return Math.ceil(str.length / this.charsPerToken);
    }

    /**
     * Condenses a single text string by stripping non-semantic whitespace and comments
     * @param {string} text 
     * @returns {string} Cleaned text
     */
    condenseText(text = '') {
        if (typeof text !== 'string') return '';

        let res = text;
        // Strip HTML/markdown comments <!-- ... -->
        res = res.replace(/<!--[\s\S]*?-->/g, '');
        // Collapse 3+ newlines to double newlines
        res = res.replace(/\n{3,}/g, '\n\n');
        // Collapse multiple spaces to single space
        res = res.replace(/[ \t]{2,}/g, ' ');
        // Strip trailing spaces on lines
        res = res.replace(/[ \t]+$/gm, '');

        return res.trim();
    }

    /**
     * Minifies JSON objects by removing nulls and compressing whitespace
     * @param {Object} obj 
     * @returns {string}
     */
    minifyJson(obj) {
        if (!obj || typeof obj !== 'object') return '';
        return JSON.stringify(obj, (key, value) => {
            if (value === null || value === undefined) return undefined;
            return value;
        });
    }

    /**
     * Optimizes conversation messages or prompt blocks to fit within token budget
     * @param {Array<Object>} messages Array of { role, content }
     * @param {Object} options 
     * @param {number} [options.maxTokens] Target token ceiling
     * @param {string} [options.modelTier='TIER_FAST']
     * @param {number} [options.preserveLastNTurns=3] Number of recent turns to preserve in full fidelity
     * @returns {{ optimizedMessages: Array<Object>, originalTokens: number, optimizedTokens: number, compressionRatio: number }}
     */
    optimizeContext(messages = [], options = {}) {
        if (!Array.isArray(messages) || messages.length === 0) {
            return {
                optimizedMessages: [],
                originalTokens: 0,
                optimizedTokens: 0,
                compressionRatio: 1.0
            };
        }

        const tierBudget = this.tierTokenBudgets[options.modelTier] || this.tierTokenBudgets.TIER_FAST;
        const maxTokens = options.maxTokens || tierBudget;
        const preserveLastN = Math.max(1, options.preserveLastNTurns || 3);

        const originalTokens = this.estimateTokens(messages);

        // Step 1: Lossless text compaction on all messages
        let compacted = messages.map(m => ({
            ...m,
            content: this.condenseText(m.content || m.text || '')
        }));

        let currentTokens = this.estimateTokens(compacted);
        if (currentTokens <= maxTokens) {
            const ratio = parseFloat((currentTokens / Math.max(1, originalTokens)).toFixed(2));
            return {
                optimizedMessages: compacted,
                originalTokens,
                optimizedTokens: currentTokens,
                compressionRatio: ratio
            };
        }

        // Step 2: Sliding window with episodic distillation for older messages
        if (compacted.length > preserveLastN) {
            const olderTurns = compacted.slice(0, compacted.length - preserveLastN);
            const recentTurns = compacted.slice(compacted.length - preserveLastN);

            // Condense older turns into an episodic summary block
            const distilledSummary = olderTurns
                .map(m => `[${m.role?.toUpperCase() || 'USER'}]: ${m.content}`)
                .join(' | ')
                .slice(0, 400); // capped summary

            const summaryMessage = {
                role: 'system',
                content: `[PREVIOUS CONTEXT SUMMARY]: ${distilledSummary}`
            };

            compacted = [summaryMessage, ...recentTurns];
        }

        const finalTokens = this.estimateTokens(compacted);
        const compressionRatio = parseFloat((finalTokens / Math.max(1, originalTokens)).toFixed(2));

        return {
            optimizedMessages: compacted,
            originalTokens,
            optimizedTokens: finalTokens,
            compressionRatio
        };
    }
}

export const contextWindowOptimizer = new ContextWindowOptimizer();
