// src/fleet/AIResourceManager.mjs — SUB-SECOND LIGHTNING FLEET
import { KeyFleetManager } from './KeyFleetManager.mjs';
import { ErrorClassifier } from './ErrorClassifier.mjs';
import { CircuitBreaker } from './CircuitBreaker.mjs';
import { QuotaTelemetry } from './QuotaTelemetry.mjs';

export class AIResourceManager {
    constructor() {
        const rawKeys = process.env.GEMINI_API_KEY || '';
        this.fleet = new KeyFleetManager(rawKeys);
        this.circuitBreaker = new CircuitBreaker(15, 10000);
        
        // ULTRA-FAST Verified Models (Sub-second latency on free tier)
        this.models = [
            'gemini-flash-lite-latest',
            'gemini-3.1-flash-lite',
            'gemini-3.5-flash-lite',
            'gemini-3-flash-preview'
        ];
        this.modelIndex = 0;
    }

    getCurrentModel() {
        return this.models[this.modelIndex];
    }

    rotateModel() {
        this.modelIndex = (this.modelIndex + 1) % this.models.length;
        console.log(`[AIResourceManager] 🔄 Switched active model to: ${this.getCurrentModel()}`);
    }

    async generateText(systemPrompt, inputPayload, fallbackToOffline = true, attempt = 0) {
        const keyItem = this.fleet.getHealthyKey();
        if (!keyItem) {
            return this.offlineFallback();
        }

        const model = this.getCurrentModel();
        
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
                signal: AbortSignal.timeout(8000) // 8s fast timeout
            });

            const latency = Date.now() - startTime;
            const json = await res.json();

            if (json.error) {
                const errClassification = ErrorClassifier.classify(json.error.code || res.status, json.error);
                console.warn(`[AIResourceManager] Error on Key #${keyItem.id} (${errClassification.type}):`, json.error.message?.slice(0, 70));

                this.fleet.recordError(keyItem.id, errClassification);
                QuotaTelemetry.recordRequest(false, latency, 0, errClassification.type === 'RATE_LIMITED');

                if (errClassification.action === 'ROTATE_MODEL' || res.status === 503) {
                    this.rotateModel();
                }

                if (attempt < 8) {
                    return await this.generateText(systemPrompt, inputPayload, fallbackToOffline, attempt + 1);
                } else {
                    this.circuitBreaker.recordFailure();
                    return this.offlineFallback();
                }
            }

            if (json.candidates && json.candidates.length > 0 && json.candidates[0].content?.parts?.length > 0) {
                this.fleet.recordSuccess(keyItem.id, latency);
                this.circuitBreaker.recordSuccess();
                QuotaTelemetry.recordRequest(true, latency, 150);
                return json.candidates[0].content.parts[0].text;
            }

            if (attempt < 5) {
                return await this.generateText(systemPrompt, inputPayload, fallbackToOffline, attempt + 1);
            }
            return this.offlineFallback();
        } catch(e) {
            const latency = Date.now() - startTime;
            console.warn(`[AIResourceManager] Fetch catch (${e.name}):`, e.message);
            this.rotateModel();
            if (attempt < 5) {
                return await this.generateText(systemPrompt, inputPayload, fallbackToOffline, attempt + 1);
            }
            return this.offlineFallback();
        }
    }

    offlineFallback() {
        return "Lagi agak lemot jaringannya barusan, bro. Coba kirim ulang ya!";
    }
}
