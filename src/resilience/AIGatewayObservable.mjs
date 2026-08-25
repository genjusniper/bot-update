// src/resilience/AIGatewayObservable.mjs — PRODUCTION MULTI-KEY ROTATION & REPAIR

import { KeyFleetManager } from '../fleet/KeyFleetManager.mjs';
import { ErrorTaxonomy } from '../fleet/ErrorTaxonomy.mjs';
import { ProviderHealthMatrix } from '../fleet/ProviderHealthMatrix.mjs';
import { PayloadSanitizer } from './PayloadSanitizer.mjs';

export class AIGatewayObservable {
    constructor() {
        this.fleet = null;
        this.models = [
            'gemini-2.5-flash',
            'gemini-flash-latest',
            'gemini-flash-lite-latest'
        ];
        this.modelIndex = 0;
        this.initFleet();
    }

    initFleet() {
        const rawKeys = process.env.GEMINI_API_KEY || '';
        this.fleet = new KeyFleetManager(rawKeys);
    }

    async generate(systemPrompt, rawContents, correlationId = 'req_gen', images = [], quotedContext = null) {
        const startTime = Date.now();
        const hasImages = Array.isArray(images) && images.length > 0;
        const telemetry = {
            correlationId,
            provider: 'google_gemini',
            attempts: 0,
            imageCount: images ? images.length : 0,
            hasQuote: Boolean(quotedContext),
            traces: []
        };

        if (!this.fleet || this.fleet.fleet.length === 0) {
            this.initFleet();
        }

        // 1. Strict Sanitization with Multi-Image Album and Quote Context
        const cleanContents = PayloadSanitizer.sanitizeContents(rawContents, images, quotedContext);
        const cleanSystemInstruction = PayloadSanitizer.sanitizeSystemInstruction(systemPrompt);

        const payload = JSON.stringify({
            system_instruction: cleanSystemInstruction,
            contents: cleanContents,
            generationConfig: { temperature: 0.8, maxOutputTokens: 900 }
        });

        let attempts = 0;
        const maxAttempts = Math.min(10, this.fleet.fleet.length);

        while (attempts < maxAttempts && (Date.now() - startTime) < 20000) {
            const currentModel = this.models[this.modelIndex % this.models.length];
            const keyItem = this.fleet.getHealthyKey();

            if (!keyItem) {
                telemetry.traces.push({ model: currentModel, error: 'NO_HEALTHY_KEYS_AVAILABLE' });
                break;
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
                    telemetry.traces.push({
                        model: currentModel,
                        keyId: keyItem.id,
                        status: res.status,
                        error: json.error.message || err.category,
                        latencyMs: latency
                    });

                    this.fleet.recordError(keyItem.id, err);
                    ProviderHealthMatrix.recordMetric(currentModel, false, latency);

                    // Switch model or rotate key on error
                    this.modelIndex++;
                    attempts++;
                    continue;
                }

                if (json.candidates && json.candidates.length > 0 && json.candidates[0].content?.parts?.length > 0) {
                    const outputText = json.candidates[0].content.parts[0].text;
                    this.fleet.recordSuccess(keyItem.id, latency);
                    ProviderHealthMatrix.recordMetric(currentModel, true, latency);

                    telemetry.traces.push({
                        model: currentModel,
                        keyId: keyItem.id,
                        status: 200,
                        latencyMs: latency,
                        outcome: 'SUCCESS'
                    });

                    return {
                        success: true,
                        text: outputText,
                        modelUsed: currentModel,
                        latencyMs: latency,
                        telemetry
                    };
                }
            } catch(e) {
                const latency = Date.now() - reqStart;
                telemetry.traces.push({ model: currentModel, keyId: keyItem.id, error: e.message, latencyMs: latency });
                ProviderHealthMatrix.recordMetric(currentModel, false, latency);
                this.modelIndex++;
                attempts++;
            }
        }

        return { success: false, telemetry, error: 'FLEET_EXHAUSTED' };
    }
}
