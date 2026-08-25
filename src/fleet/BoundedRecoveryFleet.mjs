// src/fleet/BoundedRecoveryFleet.mjs
// Bounded Fleet Recovery & Resilient Dispatcher

import { KeyFleetManager } from './KeyFleetManager.mjs';
import { ErrorTaxonomy } from './ErrorTaxonomy.mjs';
import { PerModelCircuitBreaker } from './PerModelCircuitBreaker.mjs';
import { ProviderHealthMatrix } from './ProviderHealthMatrix.mjs';

export class BoundedRecoveryFleet {
    constructor() {
        const rawKeys = process.env.GEMINI_API_KEY || '';
        this.fleet = new KeyFleetManager(rawKeys);
        this.circuit = new PerModelCircuitBreaker(3, 20000);
        this.models = [
            'gemini-flash-lite-latest',
            'gemini-3.1-flash-lite',
            'gemini-3.5-flash-lite'
        ];
        this.modelIndex = 0;
    }

    async executeRequest(systemPrompt, contents, options = {}) {
        const maxKeyAttempts = options.maxKeyAttempts || 2;
        const maxModelAttempts = options.maxModelAttempts || 3;
        const startTime = Date.now();

        let keyAttempts = 0;
        let modelAttempts = 0;

        while (modelAttempts < maxModelAttempts && (Date.now() - startTime) < 12000) {
            const currentModel = this.models[this.modelIndex % this.models.length];

            while (keyAttempts < maxKeyAttempts) {
                const keyItem = this.fleet.getHealthyKey();
                if (!keyItem) break;

                const payload = JSON.stringify({
                    system_instruction: { parts: [{ text: systemPrompt }] },
                    contents: contents,
                    generationConfig: { temperature: 0.8, maxOutputTokens: 800 }
                });

                const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${keyItem.key}`;
                const reqStart = Date.now();

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
                        console.warn(`[BoundedRecoveryFleet] ${currentModel} on Key #${keyItem.id} -> ${err.category}`);

                        this.fleet.recordError(keyItem.id, err);
                        ProviderHealthMatrix.recordMetric(currentModel, false, latency);

                        if (err.action === 'ABORT_NO_ROTATION') {
                            // 400 Bad Request: STOP IMMEDIATELY! Do not retry 32 keys!
                            return { success: false, error: err.reason, fallback: true };
                        }

                        keyAttempts++;
                        continue;
                    }

                    if (json.candidates && json.candidates.length > 0 && json.candidates[0].content?.parts?.length > 0) {
                        this.fleet.recordSuccess(keyItem.id, latency);
                        this.circuit.recordSuccess(currentModel);
                        ProviderHealthMatrix.recordMetric(currentModel, true, latency);

                        return {
                            success: true,
                            text: json.candidates[0].content.parts[0].text,
                            modelUsed: currentModel,
                            keyId: keyItem.id,
                            latencyMs: latency
                        };
                    }
                } catch(e) {
                    ProviderHealthMatrix.recordMetric(currentModel, false, Date.now() - reqStart);
                    keyAttempts++;
                }
            }

            // Rotate model after key attempts exhausted for current model
            this.modelIndex++;
            modelAttempts++;
            keyAttempts = 0;
        }

        // All bounded retries exhausted within budget
        return {
            success: false,
            fallback: true,
            text: "Lagi agak lemot jaringannya barusan, bro. Coba kirim ulang ya!"
        };
    }
}
