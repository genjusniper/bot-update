// src/fleet/AIResourceManager.mjs — HIGH AVAILABILITY FLEET
import https from 'https';
import { KeyFleetManager } from './KeyFleetManager.mjs';
import { ErrorClassifier } from './ErrorClassifier.mjs';
import { CircuitBreaker } from './CircuitBreaker.mjs';
import { QuotaTelemetry } from './QuotaTelemetry.mjs';

export class AIResourceManager {
    constructor() {
        const rawKeys = process.env.GEMINI_API_KEY || '';
        this.fleet = new KeyFleetManager(rawKeys);
        this.circuitBreaker = new CircuitBreaker(12, 10000); // 12 threshold, 10s reset
        
        // Multi-Model Verified Pool
        this.models = [
            'gemini-3.5-flash',
            'gemini-flash-latest',
            'gemini-3.7-flash',
            'gemini-3.5-flash-lite'
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
            generationConfig: { temperature: 0.75, maxOutputTokens: 1000 }
        });

        const startTime = Date.now();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyItem.key}`;

        return new Promise((resolve) => {
            const req = https.request(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                },
                timeout: 10000
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const latency = Date.now() - startTime;
                    try {
                        const json = JSON.parse(data);
                        
                        if (json.error) {
                            const errClassification = ErrorClassifier.classify(json.error.code || res.statusCode, json.error);
                            
                            this.fleet.recordError(keyItem.id, errClassification);
                            QuotaTelemetry.recordRequest(false, latency, 0, errClassification.type === 'RATE_LIMITED');

                            if (errClassification.action === 'STOP') {
                                resolve(this.offlineFallback());
                                return;
                            }

                            if (errClassification.action === 'ROTATE_MODEL') {
                                this.rotateModel();
                            }

                            if (attempt < 8) {
                                resolve(this.generateText(systemPrompt, inputPayload, fallbackToOffline, attempt + 1));
                            } else {
                                this.circuitBreaker.recordFailure();
                                resolve(this.offlineFallback());
                            }
                        } else if (json.candidates && json.candidates.length > 0 && json.candidates[0].content?.parts?.length > 0) {
                            this.fleet.recordSuccess(keyItem.id, latency);
                            this.circuitBreaker.recordSuccess();
                            QuotaTelemetry.recordRequest(true, latency, 150);
                            resolve(json.candidates[0].content.parts[0].text);
                        } else {
                            if (attempt < 4) {
                                resolve(this.generateText(systemPrompt, inputPayload, fallbackToOffline, attempt + 1));
                            } else {
                                resolve(this.offlineFallback());
                            }
                        }
                    } catch(e) {
                        if (attempt < 3) {
                            resolve(this.generateText(systemPrompt, inputPayload, fallbackToOffline, attempt + 1));
                        } else {
                            resolve(this.offlineFallback());
                        }
                    }
                });
            });

            req.on('error', (e) => {
                const errClassification = ErrorClassifier.classify(500, e);
                this.fleet.recordError(keyItem.id, errClassification);
                if (attempt < 4) {
                    resolve(this.generateText(systemPrompt, inputPayload, fallbackToOffline, attempt + 1));
                } else {
                    resolve(this.offlineFallback());
                }
            });

            req.on('timeout', () => {
                req.destroy();
                this.rotateModel();
                if (attempt < 3) {
                    resolve(this.generateText(systemPrompt, inputPayload, fallbackToOffline, attempt + 1));
                } else {
                    resolve(this.offlineFallback());
                }
            });

            req.write(payload);
            req.end();
        });
    }

    offlineFallback() {
        return "Bentar, agak nge-lag tadi jaringannya. Coba ulangi lagi ya!";
    }
}
