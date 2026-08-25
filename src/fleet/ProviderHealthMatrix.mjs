// src/fleet/ProviderHealthMatrix.mjs
// Real-Time Provider & Model Health Matrix

export class ProviderHealthMatrix {
    static matrix = {
        'gemini-flash-lite-latest': { latencyMs: 950, errorCount: 0, successCount: 1, status: 'HEALTHY' },
        'gemini-3.1-flash-lite': { latencyMs: 960, errorCount: 0, successCount: 1, status: 'HEALTHY' },
        'gemini-3.5-flash-lite': { latencyMs: 1600, errorCount: 0, successCount: 1, status: 'HEALTHY' },
        'local-fast-path': { latencyMs: 1, errorCount: 0, successCount: 1, status: 'HEALTHY' }
    };

    static recordMetric(modelName, success, latencyMs = 0) {
        if (!this.matrix[modelName]) {
            this.matrix[modelName] = { latencyMs: 1000, errorCount: 0, successCount: 0, status: 'HEALTHY' };
        }
        const item = this.matrix[modelName];
        if (success) {
            item.successCount++;
            item.latencyMs = Math.round((item.latencyMs * 0.7) + (latencyMs * 0.3));
            if (item.status !== 'HEALTHY') item.status = 'HEALTHY';
        } else {
            item.errorCount++;
            if (item.errorCount >= 4) {
                item.status = 'DEGRADED';
            }
        }
    }

    static getOptimalModel(preferredList = ['gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite']) {
        for (const m of preferredList) {
            const stats = this.matrix[m];
            if (!stats || stats.status === 'HEALTHY') {
                return m;
            }
        }
        return preferredList[0];
    }

    static getSnapshot() {
        return this.matrix;
    }
}
