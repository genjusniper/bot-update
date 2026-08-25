// src/fleet/QuotaTelemetry.mjs

export class QuotaTelemetry {
    static stats = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        rateLimitedCount: 0,
        totalTokensEstimated: 0,
        historyLatencies: []
    };

    static recordRequest(success, latencyMs = 0, tokens = 0, is429 = false) {
        this.stats.totalRequests++;
        if (success) {
            this.stats.successfulRequests++;
            this.stats.totalTokensEstimated += tokens;
            this.stats.historyLatencies.push(latencyMs);
            if (this.stats.historyLatencies.length > 50) this.stats.historyLatencies.shift();
        } else {
            this.stats.failedRequests++;
            if (is429) this.stats.rateLimitedCount++;
        }
    }

    static getMetrics() {
        const total = this.stats.totalRequests;
        const successRate = total === 0 ? 100 : Math.round((this.stats.successfulRequests / total) * 100);
        const avgLatency = this.stats.historyLatencies.length === 0 
            ? 0 
            : Math.round(this.stats.historyLatencies.reduce((a, b) => a + b, 0) / this.stats.historyLatencies.length);

        return {
            totalRequests: total,
            successRatePercent: successRate,
            rateLimitedCount: this.stats.rateLimitedCount,
            avgLatencyMs: avgLatency,
            totalTokensEstimated: this.stats.totalTokensEstimated
        };
    }
}
