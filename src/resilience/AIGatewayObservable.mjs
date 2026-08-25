// src/resilience/AIGatewayObservable.mjs
// Observable AI Gateway with Dynamic Fleet Refresh & Payload Protection

import { KeyFleetManager } from '../fleet/KeyFleetManager.mjs';
import { ErrorTaxonomy } from '../fleet/ErrorTaxonomy.mjs';
import { ProviderHealthMatrix } from '../fleet/ProviderHealthMatrix.mjs';
import { PayloadSanitizer } from './PayloadSanitizer.mjs';

export class AIGatewayObservable {
    constructor() {
        this.fleet = null;
        this.models = [
            'gemini-flash-lite-latest',
            'gemini-3.1-flash-lite',
            'gemini-3.5-flash-lite'
        ];
        this.modelIndex = 0;
        this.initFleet();
    }

    initFleet() {
        const rawKeys = process.env.GEMINI_API_KEY || '';
        this.fleet = new KeyFleetManager(rawKeys);
    }

    async generate(systemPrompt, rawContents, correlationId = 'req_gen') {
        const startTime = Date.now();
        const telemetry = {
            correlationId,
            provider: 'google_gemini',
            attempts: 0,
            traces: []
        };

        // Ensure fleet is populated even if env was loaded after module import
        if (!this.fleet || this.fleet.fleet.length === 0) {
            this.initFleet();
        }

        // 1. Strict Payload Sanitization
        const cleanContents = PayloadSanitizer.sanitizeContents(rawContents);
        const cleanSystemInstruction = PayloadSanitizer.sanitizeSystemInstruction(systemPrompt);

        const payload = JSON.stringify({
            system_instruction: cleanSystemInstruction,
            contents: cleanContents,
            generationConfig: { temperature: 0.8, maxOutputTokens: 800 }
        });

        let modelAttempts = 0;
        const maxModelAttempts = 3;

        while (modelAttempts < maxModelAttempts && (Date.now() - startTime) < 12000) {
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
                    signal: AbortSignal.timeout(6000)
                });

                const latency = Date.now() - reqStart;
                const json = await res.json();

                if (json.error) {
                    const err = ErrorTaxonomy.classify(json.error.code || res.status, json.error);
                    telemetry.traces.push({
                        model: currentModel,
                        keyId: keyItem.id,
                        status: res.status,
                        error: err.category,
                        latencyMs: latency
                    });

                    this.fleet.recordError(keyItem.id, err);
                    ProviderHealthMatrix.recordMetric(currentModel, false, latency);

                    if (err.action === 'ABORT_NO_ROTATION') {
                        console.error('[AIGatewayObservable] 🛑 400 Bad Request aborted without rotation.');
                        return { success: false, telemetry, error: 'BAD_REQUEST_ABORT' };
                    }

                    modelAttempts++;
                    this.modelIndex++;
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
                modelAttempts++;
            }
        }

        return { success: false, telemetry, error: 'FLEET_EXHAUSTED' };
    }
}
