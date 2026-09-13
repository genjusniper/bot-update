export class BasketOpportunityEngine {
    calculateOpportunity(fitAnalysis, productCatalog) {
        let basketPotential = 0;
        let expectedProfit = 0;
        const validProducts = [];

        // fitAnalysis adalah array of objects dari ProductFitEngine
        for (const item of fitAnalysis) {
            const product = productCatalog.getProductById(item.product);
            if (product && product.available_today) {
                const revenue = product.price * product.avg_daily_qty;
                const profit = product.margin * product.avg_daily_qty;
                
                basketPotential += revenue;
                expectedProfit += profit;
                validProducts.push({
                    ...product,
                    fitScore: item.score,
                    evidence: item.evidence,
                    explanation: item.explanation
                });
            }
        }

        return {
            basketPotential,
            expectedProfit,
            validProducts
        };
    }
}
