// src/observability/MetricsCollector.mjs
import fs from 'fs';
import path from 'path';

export class MetricsCollector {
  static fsmAuditFile = path.join(process.cwd(), 'memory', 'fsm_audit.jsonl');
  static metricsFile = path.join(process.cwd(), 'memory', 'metrics.jsonl');

  static recordTransition(chatId, from, to, correlationId) {
    try {
      const entry = {
        timestamp: Date.now(),
        chatId,
        from,
        to,
        correlationId
      };
      fs.appendFileSync(this.fsmAuditFile, JSON.stringify(entry) + '\n');
    } catch (e) {
      console.error('[MetricsCollector] Failed to record transition:', e.message);
    }
  }

  static recordMetric(metricType, data) {
    try {
      const entry = {
        timestamp: Date.now(),
        type: metricType,
        ...data
      };
      fs.appendFileSync(this.metricsFile, JSON.stringify(entry) + '\n');
    } catch (e) {
      console.error('[MetricsCollector] Failed to record metric:', e.message);
    }
  }

  static recordApiUsage(provider, latencyMs, inputTokens, outputTokens, status) {
    this.recordMetric('api_usage', {
      provider,
      latencyMs,
      inputTokens: inputTokens || 0,
      outputTokens: outputTokens || 0,
      status
    });
  }
}
