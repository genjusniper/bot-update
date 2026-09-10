// src/core/cognition/ResearchDepthController.mjs
// Automatic Research Depth Controller L0-L4
// Dynamic cognitive effort scaling: L0 (Direct) to L4 (Deep Multi-Agent Synthesis)

export const ResearchDepthLevel = Object.freeze({
    L0_DIRECT: 'L0_DIRECT',                         // Immediate direct answer, 0 tools
    L1_LOCAL_CACHE: 'L1_LOCAL_CACHE',               // In-memory / local graph retrieval
    L2_SINGLE_TOOL: 'L2_SINGLE_TOOL',               // 1 targeted tool call (read file, single search, status check)
    L3_MULTI_HOP: 'L3_MULTI_HOP',                   // 2-4 tool calls (investigation, multi-hop memory, debugging)
    L4_DEEP_SYNTHESIS: 'L4_DEEP_SYNTHESIS'          // Comprehensive synthesis, multi-agent delegation, consensus
});

export class ResearchDepthController {
    constructor() {
        this.levelConfigs = Object.freeze({
            L0_DIRECT: Object.freeze({
                maxTools: 0,
                timeoutMs: 800,
                allowSubagents: false,
                reasoningTier: 'FAST',
                targetLatencyMs: 400
            }),
            L1_LOCAL_CACHE: Object.freeze({
                maxTools: 0,
                timeoutMs: 1500,
                allowSubagents: false,
                reasoningTier: 'FAST',
                targetLatencyMs: 900
            }),
            L2_SINGLE_TOOL: Object.freeze({
                maxTools: 1,
                timeoutMs: 4000,
                allowSubagents: false,
                reasoningTier: 'FAST',
                targetLatencyMs: 2500
            }),
            L3_MULTI_HOP: Object.freeze({
                maxTools: 4,
                timeoutMs: 12000,
                allowSubagents: false,
                reasoningTier: 'DEEP',
                targetLatencyMs: 7000
            }),
            L4_DEEP_SYNTHESIS: Object.freeze({
                maxTools: 10,
                timeoutMs: 30000,
                allowSubagents: true,
                reasoningTier: 'DEEP',
                targetLatencyMs: 15000
            })
        });
    }

    /**
     * Determines optimal cognitive depth level L0 - L4 based on query features and context
     * @param {string} query 
     * @param {Object} context 
     * @returns {Object} { level, maxTools, timeoutMs, allowSubagents, reasoningTier }
     */
    determineDepth(query = '', context = {}) {
        if (!query || typeof query !== 'string') {
            return { level: ResearchDepthLevel.L0_DIRECT, ...this.levelConfigs.L0_DIRECT };
        }

        const text = query.trim();
        const lower = text.toLowerCase();
        const urgency = String(context.urgency || '').toUpperCase();
        const technicalDepth = context.technicalDepth || 0.5;
        const memoryFreshness = context.memoryFreshness; // from Phase 45

        // Rule 1: Greetings & Short Casual Chat -> strictly L0
        if (/^(halo|hai|p|ping|selamat (pagi|siang|sore|malam)|bro|mas|tes|test)$/i.test(lower)) {
            return { level: ResearchDepthLevel.L0_DIRECT, ...this.levelConfigs.L0_DIRECT };
        }

        // Rule 2: High urgency clamp
        if (urgency === 'HIGH' || urgency === 'CRITICAL' || /\b(cepet|urgent|darurat|buruan|segera)\b/i.test(lower)) {
            // Cap at L2 maximum for urgent tool/investigation requests
            if (this.isInvestigationQuery(lower) || this.isToolQuery(lower)) {
                return { level: ResearchDepthLevel.L2_SINGLE_TOOL, ...this.levelConfigs.L2_SINGLE_TOOL };
            }
            return { level: ResearchDepthLevel.L0_DIRECT, ...this.levelConfigs.L0_DIRECT };
        }

        // Rule 3: Architectural, Audit, or Deep Synthesis Request -> L4
        if (/\b(arsitektur|audit lengkap|analisis mendalam|desain sistem|research komprehensif|deep dive|refactor total)\b/i.test(lower)) {
            return { level: ResearchDepthLevel.L4_DEEP_SYNTHESIS, ...this.levelConfigs.L4_DEEP_SYNTHESIS };
        }

        // Rule 4: Multi-hop investigation or Debugging -> L3
        if (this.isInvestigationQuery(lower) || /\b(debug|kenapa error|telusuri|investigasi|lacak|analisa log)\b/i.test(lower)) {
            return { level: ResearchDepthLevel.L3_MULTI_HOP, ...this.levelConfigs.L3_MULTI_HOP };
        }

        // Rule 5: Single tool lookup (live status, search, read file) -> L2
        if (/\b(cek status|baca file|lihat log|cari|search|status pm2|info server)\b/i.test(lower)) {
            return { level: ResearchDepthLevel.L2_SINGLE_TOOL, ...this.levelConfigs.L2_SINGLE_TOOL };
        }

        // Rule 6: Recall personal context / memory -> L1
        if (/\b(ingat|kemarin|siapa|apa kata|catatan|jadwal)\b/i.test(lower)) {
            // If stale, bump to L2 to refresh
            if (memoryFreshness && memoryFreshness.shouldRefresh) {
                return { level: ResearchDepthLevel.L2_SINGLE_TOOL, ...this.levelConfigs.L2_SINGLE_TOOL };
            }
            return { level: ResearchDepthLevel.L1_LOCAL_CACHE, ...this.levelConfigs.L1_LOCAL_CACHE };
        }

        // Rule 7: Short query default -> L0
        if (text.split(/\s+/).length <= 4 && !/\?/.test(text)) {
            return { level: ResearchDepthLevel.L0_DIRECT, ...this.levelConfigs.L0_DIRECT };
        }

        // Default: L1 for general questions
        return { level: ResearchDepthLevel.L1_LOCAL_CACHE, ...this.levelConfigs.L1_LOCAL_CACHE };
    }

    /**
     * Checks if query involves investigation
     * @private
     */
    isInvestigationQuery(text) {
        return /\b(kenapa|mengapa|penyebab|akar masalah|root cause|troubleshoot)\b/i.test(text);
    }

    /**
     * Checks if query requires tool execution
     * @private
     */
    isToolQuery(text) {
        return /\b(cek status|baca file|lihat log|cari|search|status pm2|info server)\b/i.test(text);
    }

    /**
     * Guards execution count against allocated level budget
     * @param {string} level 
     * @param {number} executedToolsCount 
     * @returns {{ allowed: boolean, remainingTools: number }}
     */
    enforceBudget(level = ResearchDepthLevel.L0_DIRECT, executedToolsCount = 0) {
        const config = this.levelConfigs[level] || this.levelConfigs.L0_DIRECT;
        const remaining = Math.max(0, config.maxTools - executedToolsCount);
        return {
            allowed: executedToolsCount < config.maxTools,
            remainingTools: remaining
        };
    }
}

export const researchDepthController = new ResearchDepthController();
