// src/resilience/AIGatewayObservable.mjs
// V13.7 — Multi-key & multi-model rotation with proper error handling
// Models confirmed valid via live API test on Termux HP

import { KeyFleetManager } from '../fleet/KeyFleetManager.mjs';
import { ErrorTaxonomy } from '../fleet/ErrorTaxonomy.mjs';
import { ProviderHealthMatrix } from '../fleet/ProviderHealthMatrix.mjs';
import { PayloadSanitizer } from './PayloadSanitizer.mjs';

// Confirmed valid Gemini models (from live API test on Termux 25 Aug 2026)
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

    async generate(systemPrompt, rawContents, correlationId = 'req_gen', images = [], quotedContext = null) {
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
            generationConfig: {
                temperature: 0.85,
                maxOutputTokens: 800,
                topP: 0.95
            }
        });

        // Try up to 8 attempts across models and keys
        const maxAttempts = Math.min(8, this.fleet.fleet.length);

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (Date.now() - startTime > 20000) break; // Hard 20s global timeout

            const currentModel = MODELS[this.modelIndex % MODELS.length];
            const keyItem = this.fleet.getHealthyKey();

            if (!keyItem) {
                telemetry.traces.push({ model: currentModel, error: 'NO_HEALTHY_KEYS', attempt });
                // Wait briefly before giving up — keys might come off cooldown
                await new Promise(r => setTimeout(r, 500));
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
                    signal: AbortSignal.timeout(9000)
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
                    // For SWITCH_MODEL, advance model index
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

                // Empty candidates — try next
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
