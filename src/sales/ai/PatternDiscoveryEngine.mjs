/**
 * PatternDiscoveryEngine.mjs
 *
 * Analyzes multiple leads to discover patterns across the dataset.
 *
 * RULES:
 *   - Patterns are always INFERENCE, never FACT
 *   - Patterns do NOT override per-lead evidence
 *   - Patterns can inform ResearchPlanner (e.g. prioritize menu research for WARTEG)
 *   - Patterns cannot approve outreach
 *
 * PATTERN structure:
 * {
 *   type: "PATTERN",
 *   patternId: "...",
 *   pattern: "TELUR frequently appears across food businesses",
 *   businessTypes: ["WARTEG", "WARMINDO"],
 *   products: ["telur", "tempe"],
 *   supportingLeads: ["L001", "L002"],
 *   classification: "INFERENCE",   // ALWAYS INFERENCE
 *   confidence: 0.72,
 *   discoveredAt: "..."
 * }
 */

import { AIOutputValidator } from './AIOutputValidator.mjs';

export class PatternDiscoveryEngine {
    constructor() {
        this.validator = new AIOutputValidator();
    }

    /**
     * Discover cross-lead patterns.
     *
     * @param {object[]} leads - Array of leads with their demand profiles
     * @returns {object[]} Validated pattern reports
     */
    discover(leads) {
        const productFrequency = new Map();
        const businessTypeMap = new Map();

        for (const lead of leads) {
            const bType = lead.demandProfile?.businessProfile?.inferredType || 'UNKNOWN';
            if (!businessTypeMap.has(bType)) businessTypeMap.set(bType, []);
            businessTypeMap.get(bType).push(lead.leadId || lead.id);

            for (const ingredient of (lead.demandProfile?.demandProfile?.potentialIngredients || [])) {
                const key = `${bType}::${ingredient.product}`;
                if (!productFrequency.has(key)) productFrequency.set(key, { count: 0, leads: [], bType, product: ingredient.product });
                const entry = productFrequency.get(key);
                entry.count++;
                entry.leads.push(lead.leadId || lead.id);
            }
        }

        const patterns = [];
        for (const [key, data] of productFrequency.entries()) {
            if (data.count < 2) continue; // Pattern requires at least 2 leads

            const confidence = Math.min(0.9, data.count / leads.length);

            const raw = {
                type: 'PATTERN',
                patternId: `PAT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                pattern: `${data.product.toUpperCase()} frequently appears in ${data.bType} businesses`,
                businessTypes: [data.bType],
                products: [data.product],
                supportingLeads: data.leads,
                classification: 'INFERENCE', // ALWAYS INFERENCE — patterns are not transactions
                confidence: parseFloat(confidence.toFixed(4)),
                discoveredAt: new Date().toISOString()
            };

            const vr = this.validator.validate(raw, 'PATTERN', []);
            if (vr.valid) patterns.push(vr.sanitized);
        }

        return patterns.sort((a, b) => b.confidence - a.confidence);
    }
}
