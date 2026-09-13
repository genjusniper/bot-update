export class SupplyDemandMatcher {
    constructor() {
        this.AVAILABILITY_WEIGHTS = {
            'AVAILABLE': 1.0,
            'POSSIBLY_AVAILABLE': 0.8,
            'UNKNOWN': 0.4,
            'OUT_OF_STOCK': 0.0
        };

        this.SIGNAL_WEIGHTS = {
            'DIRECT': 1.0,
            'STRONG_INFERENCE': 0.8,
            'MODERATE_INFERENCE': 0.6,
            'WEAK_INFERENCE': 0.4,
            'UNKNOWN': 0.1
        };
    }

    match(demandProfile, motherSupplyCatalog) {
        const matches = [];
        const catalogItems = motherSupplyCatalog.getAllItems();
        
        for (const demand of demandProfile.potentialIngredients) {
            // Find in catalog
            const supply = catalogItems.find(item => item.supplyId === demand.product);
            
            if (supply) {
                const supplyStatus = supply.available || 'UNKNOWN';
                
                const demandWeight = this.SIGNAL_WEIGHTS[demand.demandSignal] || 0.1;
                const evidenceConf = demand.confidence || 0.1;
                const availabilityWeight = this.AVAILABILITY_WEIGHTS[supplyStatus] !== undefined ? this.AVAILABILITY_WEIGHTS[supplyStatus] : 0.4;
                const freshnessWeight = 1.0; // Handled by Quality Firewall, baseline 1.0 here
                const businessRelevance = 1.0; // Extensible

                let matchScore = demandWeight * evidenceConf * availabilityWeight * freshnessWeight * businessRelevance;
                
                // OUT_OF_STOCK rule
                let activeRecommendation = true;
                if (supplyStatus === 'OUT_OF_STOCK') {
                    matchScore = 0;
                    activeRecommendation = false;
                }

                matches.push({
                    product: demand.product,
                    demandSignal: demand.demandSignal,
                    evidenceConfidence: evidenceConf,
                    supplyStatus: supplyStatus,
                    freshness: freshnessWeight,
                    businessRelevance: businessRelevance,
                    matchScore: matchScore,
                    activeRecommendation: activeRecommendation,
                    reason: demand.reason
                });
            }
        }

        // Sort descending by matchScore
        matches.sort((a, b) => b.matchScore - a.matchScore);
        
        return matches;
    }
}
