export class OpportunityScorer {
    constructor() {
        this.UNKNOWN_SEVERITY = {
            volume: { severity: 0.8, importance: 1.0, impact: 1.0 }, // HIGH
            frequency: { severity: 0.8, importance: 1.0, impact: 1.0 }, // HIGH
            current_supplier: { severity: 0.8, importance: 1.0, impact: 1.0 }, // HIGH
            price_point: { severity: 0.8, importance: 1.0, impact: 1.0 }, // HIGH
            availability_requirement: { severity: 0.8, importance: 1.0, impact: 1.0 }, // HIGH
            
            decision_maker: { severity: 0.5, importance: 0.8, impact: 0.8 }, // MEDIUM
            buying_schedule: { severity: 0.5, importance: 0.8, impact: 0.8 }, // MEDIUM
            quality_preference: { severity: 0.5, importance: 0.8, impact: 0.8 }, // MEDIUM
            
            website: { severity: 0.2, importance: 0.3, impact: 0.3 }, // LOW
            social_media: { severity: 0.2, importance: 0.3, impact: 0.3 }, // LOW
            opening_hours: { severity: 0.2, importance: 0.5, impact: 0.3 }, // LOW
            
            default: { severity: 0.4, importance: 0.5, impact: 0.5 }
        };
    }

    score(demandMatches, unknowns) {
        if (!demandMatches || demandMatches.length === 0) {
            return {
                opportunityScore: 0,
                primaryOpportunity: null,
                secondaryOpportunities: [],
                conditionalOpportunities: [],
                decisionReasons: [{ type: 'NEGATIVE', reason: 'No supply-demand matches found.' }]
            };
        }

        let decisionReasons = [];
        const activeMatches = demandMatches.filter(m => m.activeRecommendation);
        const inactiveMatches = demandMatches.filter(m => !m.activeRecommendation);

        if (activeMatches.length === 0) {
            return {
                opportunityScore: 0,
                primaryOpportunity: null,
                secondaryOpportunities: [],
                conditionalOpportunities: inactiveMatches.map(m => m.product),
                decisionReasons: [{ type: 'NEGATIVE', reason: 'All matched demands are OUT_OF_STOCK.' }]
            };
        }

        const primaryMatch = activeMatches[0];
        
        let primaryFitScore = primaryMatch.matchScore; 
        
        decisionReasons.push({ 
            type: 'POSITIVE', 
            reason: `Top Opportunity: ${primaryMatch.product} (Fit: ${(primaryFitScore*100).toFixed(0)}%, Confidence: ${(primaryMatch.evidenceConfidence*100).toFixed(0)}%)` 
        });

        // Unknown Severity Penalty
        // RULE: unknowns that are NEVER publicly verifiable (volume, frequency, supplier, price)
        //       get a much smaller penalty — they are STRUCTURAL unknowns, not evidence gaps.
        //       Penalizing them heavily causes food businesses with valid category evidence to
        //       score 0, which is wrong.
        //
        // RESEARCHABLE unknowns: menu, contact, category, description → normal penalty
        // STRUCTURAL unknowns:   volume, frequency, supplier, price   → low penalty (0.02 each)
        const STRUCTURAL_UNKNOWNS = new Set(['volume', 'frequency', 'current_supplier', 'price_point',
            'availability_requirement', 'buying_schedule']);

        let unknownPenalty = 0;
        if (unknowns && unknowns.length > 0) {
            for (const unk of unknowns) {
                const key = unk.toLowerCase();
                const isStructural = [...STRUCTURAL_UNKNOWNS].some(s => key.includes(s));
                if (isStructural) {
                    // Structural unknowns: tiny penalty (max 2% per field)
                    unknownPenalty += 0.02;
                    decisionReasons.push({
                        type: 'UNKNOWN',
                        reason: `Structural unknown: ${unk} (Penalty: -2% — not publicly verifiable)`
                    });
                } else {
                    const mapKey = Object.keys(this.UNKNOWN_SEVERITY).find(k =>
                        unk.toLowerCase().includes(k.toLowerCase())) || 'default';
                    const severityData = this.UNKNOWN_SEVERITY[mapKey];
                    const penalty = severityData.severity * severityData.importance * severityData.impact * 0.05;
                    unknownPenalty += penalty;
                    decisionReasons.push({
                        type: 'UNKNOWN',
                        reason: `Missing data: ${unk} (Penalty: -${(penalty*100).toFixed(1)}%)`
                    });
                }
            }
        }
        // Cap total penalty so structural unknowns cannot zero out a valid opportunity
        unknownPenalty = Math.min(unknownPenalty, 0.20);

        // Final Opportunity Calculation
        // A simple formula adding value for secondary matches
        let secondaryBonus = 0;
        for (let i = 1; i < activeMatches.length; i++) {
            secondaryBonus += (activeMatches[i].matchScore * 0.1); 
        }

        let finalScore = primaryFitScore + secondaryBonus - unknownPenalty;
        finalScore = Math.max(0.0, Math.min(1.0, finalScore));

        let primaryOpportunity = {
            id: primaryMatch.product,
            name: primaryMatch.product,
            demandSignal: primaryMatch.demandSignal,
            supplyStatus: primaryMatch.supplyStatus,
            evidenceConfidence: primaryMatch.evidenceConfidence,
            fitScore: primaryMatch.matchScore
        };

        let secondaryOpportunities = activeMatches.slice(1).map(m => ({
            id: m.product,
            name: m.product,
            demandSignal: m.demandSignal,
            supplyStatus: m.supplyStatus,
            evidenceConfidence: m.evidenceConfidence,
            fitScore: m.matchScore
        }));

        let conditionalOpportunities = inactiveMatches.map(m => ({
            id: m.product,
            name: m.product,
            demandSignal: m.demandSignal,
            supplyStatus: m.supplyStatus,
            evidenceConfidence: m.evidenceConfidence,
            fitScore: m.matchScore
        }));

        return {
            opportunityScore: finalScore,
            primaryOpportunity,
            secondaryOpportunities,
            conditionalOpportunities,
            decisionReasons
        };
    }
}
