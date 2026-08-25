import https from 'https';

export class AIGateway {
    constructor() {
        const rawKeys = process.env.GEMINI_API_KEY || '';
        this.apiKeys = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
        this.currentKeyIndex = 0;
        
        // Multi-Model Fallback Pool (All verified working on this API account)
        this.models = [
            'gemini-3.5-flash',
            'gemini-flash-latest',
            'gemini-3.7-flash',
            'gemini-3.5-flash-lite'
        ];
        this.currentModelIndex = 0;
    }

    getNextKey() {
        if (this.apiKeys.length === 0) return null;
        const key = this.apiKeys[this.currentKeyIndex];
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        return key;
    }

    getCurrentModel() {
        return this.models[this.currentModelIndex];
    }

    rotateModel() {
        this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
        console.log(`[AIGateway] Switched active model to: ${this.getCurrentModel()}`);
    }

    async generateText(systemPrompt, inputPayload, fallbackToOffline = true, retries = 0) {
        const apiKey = this.getNextKey();
        const model = this.getCurrentModel();
        
        if (!apiKey) {
            console.warn('[AIGateway] GEMINI_API_KEY is missing! Using offline fallback.');
            return this.offlineFallback();
        }

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

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        return new Promise((resolve) => {
            const req = https.request(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                },
                timeout: 15000
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.error) {
                            console.error(`[AIGateway] API Error (${model} | Key ${this.currentKeyIndex}):`, json.error.message);
                            
                            // If quota or rate limited, rotate model and key
                            if (json.error.code === 429 || json.error.message.includes('quota')) {
                                this.rotateModel();
                            }

                            if (retries < 5) {
                                resolve(this.generateText(systemPrompt, inputPayload, fallbackToOffline, retries + 1));
                            } else {
                                resolve(this.offlineFallback());
                            }
                        } else if (json.candidates && json.candidates.length > 0 && json.candidates[0].content?.parts?.length > 0) {
                            resolve(json.candidates[0].content.parts[0].text);
                        } else {
                            resolve(this.offlineFallback());
                        }
                    } catch(e) { 
                        console.error('[AIGateway] Parse Error:', e.message);
                        resolve(this.offlineFallback()); 
                    }
                });
            });

            req.on('error', (e) => {
                console.error('[AIGateway] Network Error:', e.message);
                if (retries < 3) {
                    resolve(this.generateText(systemPrompt, inputPayload, fallbackToOffline, retries + 1));
                } else {
                    resolve(this.offlineFallback());
                }
            });
            
            req.on('timeout', () => { 
                req.destroy(); 
                if (retries < 3) {
                    this.rotateModel();
                    resolve(this.generateText(systemPrompt, inputPayload, fallbackToOffline, retries + 1));
                } else {
                    resolve(this.offlineFallback());
                }
            });
            
            req.write(payload);
            req.end();
        });
    }

    offlineFallback() {
        return "Sistem AI sedang dalam mode offline sejenak. Tunggu beberapa detik ya!";
    }
}
