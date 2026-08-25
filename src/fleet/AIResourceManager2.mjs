// src/fleet/AIResourceManager2.mjs — FLEET MANAGER 2.0
import { KeyFleetManager } from './KeyFleetManager.mjs';
import { ErrorClassifier } from './ErrorClassifier.mjs';
import { PerModelCircuitBreaker } from './PerModelCircuitBreaker.mjs';
import { QuotaTelemetry } from './QuotaTelemetry.mjs';

export class AIResourceManager2 {
    constructor() {
        const rawKeys = process.env.GEMINI_API_KEY || '';
        this.fleet = new KeyFleetManager(rawKeys);
        this.circuit = new PerModelCircuitBreaker(4, 15000);

        this.models = [
            'gemini-flash-lite-latest',
            'gemini-3.1-flash-lite',
            'gemini-3.5-flash-lite',
            'gemini-3-flash-preview'
        ];
        this.modelIndex = 0;
    }

    getHealthyModel() {
        for (let i = 0; i < this.models.length; i++) {
            const idx = (this.modelIndex + i) % this.models.length;
            const candidate = this.models[idx];
            if (this.circuit.canExecute(candidate)) {
                this.modelIndex = idx;
                return candidate;
            }
        }
        return this.models[0]; // fallback
    }

    rotateModel() {
        this.modelIndex = (this.modelIndex + 1) % this.models.length;
        console.log(`[AIResourceManager 2.0] 🔄 Model rotated to: ${this.models[this.modelIndex]}`);
    }

    async generateText(systemPrompt, inputPayload, fallbackToOffline = true, attempt = 0) {
        const keyItem = this.fleet.getHealthyKey();
        if (!keyItem) {
            return this.offlineFallback();
        }

        const model = this.getHealthyModel();

        let contents = [];
        if (typeof inputPayload === 'string') {
            contents = [{ role: 'user', parts: [{ text: inputPayload }] }];
        } else if (Array.isArray(inputPayload)) {
            contents = inputPayload;
        } else {
            contents = [{ role: 'user', parts: [{ text: String(inputPayload) }] }];
        }

        const payload = JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: contents,
            generationConfig: { temperature: 0.8, maxOutputTokens: 800 }
        });

        const startTime = Date.now();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyItem.key}`;

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                signal: AbortSignal.timeout(7000)
            });

            const latency = Date.now() - startTime;
            const json = await res.json();

            if (json.error) {
                const err = ErrorClassifier.classify(json.error.code || res.status, json.error);
                console.warn(`[AIResourceManager 2.0] Model ${model} Key #${keyItem.id} Error (${err.type}):`, json.error.message?.slice(0, 70));

                this.fleet.recordError(keyItem.id, err);
                this.circuit.recordFailure(model);
                QuotaTelemetry.recordRequest(false, latency, 0, err.type === 'RATE_LIMITED');

                if (err.action === 'STOP') {
                    // Invalid payload: DO NOT ROTATE 32 KEYS!
                    return this.offlineFallback();
                }

                if (err.action === 'ROTATE_MODEL' || res.status === 503) {
                    this.rotateModel();
                }

                if (attempt < 6) {
                    return await this.generateText(systemPrompt, inputPayload, fallbackToOffline, attempt + 1);
                } else {
                    return this.offlineFallback();
                }
            }

            if (json.candidates && json.candidates.length > 0 && json.candidates[0].content?.parts?.length > 0) {
                this.fleet.recordSuccess(keyItem.id, latency);
                this.circuit.recordSuccess(model);
                QuotaTelemetry.recordRequest(true, latency, 150);
                return json.candidates[0].content.parts[0].text;
            }

            if (attempt < 4) {
                return await this.generateText(systemPrompt, inputPayload, fallbackToOffline, attempt + 1);
            }
            return this.offlineFallback();
        } catch(e) {
            this.circuit.recordFailure(model);
            this.rotateModel();
            if (attempt < 4) {
                return await this.generateText(systemPrompt, inputPayload, fallbackToOffline, attempt + 1);
            }
            return this.offlineFallback();
        }
    }

    offlineFallback() {
        return "Bentar, agak nge-lag tadi jaringannya. Coba ulangi lagi ya!";
    }
}
