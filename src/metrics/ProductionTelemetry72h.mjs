// src/metrics/ProductionTelemetry72h.mjs
// 72-Hour Real-World Production Telemetry & Metric Harvester

import fs from 'fs/promises';
import path from 'path';

const metricsPath = path.resolve(process.cwd(), 'memory/metrics/production_72h.json');

export class ProductionTelemetry72h {
    static async getMetrics() {
        await fs.mkdir(path.dirname(metricsPath), { recursive: true });
        try {
            const raw = await fs.readFile(metricsPath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return {
                startedAt: Date.now(),
                lastUpdated: Date.now(),
                messages: {
                    received: 0,
                    aggregated: 0,
                    generated: 0,
                    sent: 0,
                    failed: 0,
                    dropped: 0
                },
                aiGateway: {
                    geminiSuccess: 0,
                    gemini400: 0,
                    gemini429: 0,
                    gemini503: 0,
                    timeout: 0,
                    emptyResponse: 0,
                    fallbackCount: 0
                },
                resilience: {
                    circuitOpen: 0,
                    halfOpenProbe: 0,
                    recovered: 0,
                    keysQuarantined: 0,
                    duplicateBlocked: 0
                },
                conversation: {
                    emergencyBrainUsage: 0,
                    continuityHits: 0,
                    callbacksTriggered: 0
                }
            };
        }
    }

    static async increment(category, key, amount = 1) {
        const metrics = await this.getMetrics();
        if (metrics[category] && typeof metrics[category][key] === 'number') {
            metrics[category][key] += amount;
            metrics.lastUpdated = Date.now();
            await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2), 'utf8');
        }
    }
}
