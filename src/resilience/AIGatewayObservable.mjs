// src/resilience/AIGatewayObservable.mjs
// V14.4 — Optimized Fast Rotation: 5s per-request timeout, 25s global budget, 12 attempts

import { KeyFleetManager } from '../fleet/KeyFleetManager.mjs';
import { ErrorTaxonomy } from '../fleet/ErrorTaxonomy.mjs';
import { ProviderHealthMatrix } from '../fleet/ProviderHealthMatrix.mjs';
import { PayloadSanitizer } from './PayloadSanitizer.mjs';

// Confirmed fastest valid Gemini models on Termux
const MODELS = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-flash-lite-latest'
];

export class AIGatewayObservable {
    constructor() {
        this.fleet = null;
        this.modelIndex = 0;
        this.initFleet();
    }

    initFleet() {
        const rawKeys = process.env.GEMINI_API_KEY || '';
        this.fleet = new KeyFleetManager(rawKeys);
    }

    async generate(systemPrompt, rawContents, correlationId = 'req_gen', images = [], quotedContext = null, options = {}) {
        const startTime = Date.now();
        const telemetry = {
            correlationId,
            provider: 'google_gemini',
            attempts: 0,
            imageCount: images?.length || 0,
            hasQuote: Boolean(quotedContext),
            traces: []
        };

        if (!this.fleet || this.fleet.fleet.length === 0) {
            this.initFleet();
        }

        const cleanContents = PayloadSanitizer.sanitizeContents(rawContents, images, quotedContext);
        const cleanSystemInstruction = PayloadSanitizer.sanitizeSystemInstruction(systemPrompt);

        const payload = JSON.stringify({
            system_instruction: cleanSystemInstruction,
            contents: cleanContents,
            generationConfig: Object.assign({
                temperature: 0.85,
                maxOutputTokens: 600,
                topP: 0.95
            }, options.generationConfig || {})
        });

        // Fast rotation: try up to 12 attempts across keys and models
        const maxAttempts = Math.min(12, this.fleet.fleet.length);

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (Date.now() - startTime > 25000) break; // 25s max global budget

            const currentModel = MODELS[this.modelIndex % MODELS.length];
            const keyItem = this.fleet.getHealthyKey();

            if (!keyItem) {
                telemetry.traces.push({ model: currentModel, error: 'NO_HEALTHY_KEYS', attempt });
                await new Promise(r => setTimeout(r, 250));
                continue;
            }

            telemetry.attempts++;
            const reqStart = Date.now();
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${keyItem.key}`;

            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload,
                    signal: AbortSignal.timeout(5500) // Fast 5.5s timeout: if slow, rotate immediately!
                });

                const latency = Date.now() - reqStart;
                const json = await res.json();

                if (json.error) {
                    const err = ErrorTaxonomy.classify(json.error.code || res.status, json.error);
                    telemetry.traces.push({ model: currentModel, keyId: keyItem.id, status: res.status, error: err.category, latencyMs: latency });
                    this.fleet.recordError(keyItem.id, err);
                    ProviderHealthMatrix.recordMetric(currentModel, false, latency);

                    if (err.action === 'ABORT_NO_ROTATION') {
                        console.error('[AIGateway] 🛑 400 Bad Request — aborting.');
                        return { success: false, telemetry, error: 'BAD_REQUEST_ABORT' };
                    }
                    if (err.action === 'SWITCH_MODEL' || err.action === 'SWITCH_MODEL_AND_BACKOFF') {
                        this.modelIndex++;
                    }
                    continue;
                }

                if (json.candidates?.[0]?.content?.parts?.length > 0) {
                    const outputText = json.candidates[0].content.parts[0].text;
                    this.fleet.recordSuccess(keyItem.id, latency);
                    ProviderHealthMatrix.recordMetric(currentModel, true, latency);
                    telemetry.traces.push({ model: currentModel, keyId: keyItem.id, status: 200, latencyMs: latency, outcome: 'SUCCESS' });
                    return { success: true, text: outputText, modelUsed: currentModel, latencyMs: latency, telemetry };
                }

                this.modelIndex++;

            } catch (e) {
                const latency = Date.now() - reqStart;
                telemetry.traces.push({ model: currentModel, keyId: keyItem.id, error: e.message, latencyMs: latency });
                ProviderHealthMatrix.recordMetric(currentModel, false, latency);
                this.modelIndex++;
            }
        }

        return { success: false, telemetry, error: 'FLEET_EXHAUSTED' };
    }
}
