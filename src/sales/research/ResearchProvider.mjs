/**
 * ResearchProvider.mjs
 *
 * Mock research provider for Phase I.
 * Implements circuit breaker pattern.
 *
 * Circuit Breaker States:
 *   HEALTHY   → Normal operation
 *   DEGRADED  → 1–2 failures, still trying but cautious
 *   OPEN      → 3+ consecutive failures → research paused
 *
 * INVARIANT:
 *   Provider failure NEVER triggers outbound.
 *   Provider failure results in: evidence = null, status = PROVIDER_UNAVAILABLE
 *
 * NOTE:
 *   Real scraping (Google, Instagram, Gojek) is NOT active in Phase I.
 *   This provider returns structured mock evidence to simulate real behaviour
 *   for testing and architecture validation.
 *   Real provider will be enabled in Phase I-Canary after full Gate I-1 pass.
 *
 * HALLUCINATION GUARDS:
 *   Provider MUST NOT return quantity, price, supplier, or frequency as FACT
 *   unless sourceType = MANUAL_SURVEY or BUSINESS_OWNER.
 */

export const CIRCUIT_STATE = {
    HEALTHY: 'HEALTHY',
    DEGRADED: 'DEGRADED',
    OPEN: 'OPEN'
};

const RECOVERY_TIMEOUT_MS = 60 * 1000; // 1 minute
const FAILURE_THRESHOLD = 3;

export class ResearchProvider {
    constructor(name = 'MOCK_PROVIDER') {
        this.name = name;
        this.failureCount = 0;
        this.consecutiveFailures = 0;
        this.circuitState = CIRCUIT_STATE.HEALTHY;
        this.circuitOpenedAt = null;

        // Injected failures for testing
        this._forceFailCount = 0;
        this._forceTimeout = false;
        this._mockDelay = 0;
    }

    /**
     * Search for evidence about a specific field for a lead.
     *
     * @param {string} leadId
     * @param {string} field - e.g. 'menu', 'contact', 'category'
     * @param {object} hint - context (businessName, location, etc.)
     * @returns {object[]} Array of raw evidence objects (not yet intake-validated)
     */
    async search(leadId, field, hint) {
        // Circuit breaker check
        this._checkCircuit();

        // Artificial delay for timeout testing
        if (this._mockDelay > 0) {
            await new Promise(r => setTimeout(r, this._mockDelay));
        }

        // Forced failure for testing
        if (this._forceFailCount > 0) {
            this._forceFailCount--;
            this._recordFailure();
            throw new Error(`PROVIDER_ERROR: Simulated failure for ${this.name}`);
        }

        try {
            const results = this._mockSearch(leadId, field, hint);
            this._recordSuccess();
            return results;
        } catch (e) {
            this._recordFailure();
            throw e;
        }
    }

    getCircuitState() {
        return {
            state: this.circuitState,
            failureCount: this.failureCount,
            consecutiveFailures: this.consecutiveFailures,
            circuitOpenedAt: this.circuitOpenedAt
        };
    }

    /**
     * Force failures for testing (circuit breaker tests).
     */
    setForceFailures(count) {
        this._forceFailCount = count;
    }

    setForceTimeout(delay = 5000) {
        this._mockDelay = delay;
    }

    // ─── Circuit Breaker ─────────────────────────────────────────────────

    _checkCircuit() {
        if (this.circuitState === CIRCUIT_STATE.OPEN) {
            // Auto-recovery after timeout
            if (this.circuitOpenedAt && (Date.now() - this.circuitOpenedAt) > RECOVERY_TIMEOUT_MS) {
                this.circuitState = CIRCUIT_STATE.DEGRADED;
                this.consecutiveFailures = 0;
                console.log(`[ResearchProvider] Circuit ${this.name} → DEGRADED (recovery attempt)`);
            } else {
                throw new Error(`CIRCUIT_OPEN: Provider ${this.name} is unavailable. Research paused. OUTBOUND = 0.`);
            }
        }
    }

    _recordSuccess() {
        this.consecutiveFailures = 0;
        if (this.circuitState === CIRCUIT_STATE.DEGRADED) {
            this.circuitState = CIRCUIT_STATE.HEALTHY;
        }
    }

    _recordFailure() {
        this.failureCount++;
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= FAILURE_THRESHOLD) {
            this.circuitState = CIRCUIT_STATE.OPEN;
            this.circuitOpenedAt = Date.now();
            console.warn(`[ResearchProvider] Circuit ${this.name} → OPEN after ${this.consecutiveFailures} consecutive failures`);
        } else if (this.consecutiveFailures > 1) {
            this.circuitState = CIRCUIT_STATE.DEGRADED;
        }
    }

    // ─── Real Search (CANARY via SERPAPI) ────────────────────────────────

    async _canarySearch(leadId, field, hint = {}) {
        if (field !== 'menu' && field !== 'description' && field !== 'category') {
            return []; // Only safely searchable domains in Canary
        }

        const biz = hint.businessName || '';
        const loc = hint.location || '';
        const query = `${biz} ${loc}`;

        const apiKey = process.env.SERPAPI_KEY;
        if (!apiKey) {
            console.warn(`[ResearchProvider:CANARY] SERPAPI_KEY missing. Falling back to MOCK.`);
            return [];
        }

        console.log(`[ResearchProvider:CANARY] Fetching SerpApi Google Maps for: "${query}"`);

        return new Promise((resolve, reject) => {
            const https = import('https').then(({ request }) => {
                // Using SerpApi Google Maps Search
                // https://serpapi.com/google-maps-api
                const url = new URL('https://serpapi.com/search.json');
                url.searchParams.append('engine', 'google_maps');
                url.searchParams.append('q', query);
                url.searchParams.append('api_key', apiKey);

                const options = {
                    hostname: url.hostname,
                    path: url.pathname + url.search,
                    method: 'GET',
                    timeout: 10000
                };

                const req = request(options, (res) => {
                    if (res.statusCode < 200 || res.statusCode >= 400) {
                        return reject(new Error(`SerpApi HTTP Error ${res.statusCode}`));
                    }
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            const json = JSON.parse(data);
                            
                            // Check if we have local results
                            const localResults = json.local_results;
                            if (!localResults || localResults.length === 0) {
                                return resolve([]);
                            }

                            // Take the top result
                            const topResult = localResults[0];
                            
                            // Depending on the requested field, extract different data
                            let extractedText = '';
                            if (field === 'category') {
                                extractedText = topResult.type || topResult.category || '';
                            } else if (field === 'description' || field === 'menu') {
                                // Maps often contains snippets, description, or known menu items in reviews
                                extractedText = topResult.description || topResult.snippet || '';
                                if (topResult.reviews) {
                                    // Sometimes we can extract food mentioned in reviews as menu evidence
                                    const reviewKeywords = topResult.reviews.map(r => r.summary || '').join(' ');
                                    extractedText += ' ' + reviewKeywords;
                                }
                            }

                            if (!extractedText || extractedText.trim().length === 0) {
                                return resolve([]);
                            }

                            resolve([{
                                domain: field,
                                sourceType: 'SERPAPI_MAPS',
                                sourceRef: `serpapi://place_id=${topResult.place_id || 'unknown'}`,
                                capturedAt: new Date().toISOString(),
                                rawValue: extractedText.trim().slice(0, 500), // truncate for safety
                                normalizedValue: extractedText.trim().toLowerCase().slice(0, 500),
                                directness: 'INDIRECT', 
                                completeness: 70,       
                                classification: 'INFERENCE'
                            }]);
                        } catch (e) {
                            reject(new Error('Failed to parse SerpApi response'));
                        }
                    });
                });

                req.on('error', reject);
                req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
                req.end();
            }).catch(reject);
        });
    }

    // ─── Mock Search Implementation ──────────────────────────────────────

    async _mockSearch(leadId, field, hint = {}) {
        const mode = process.env.RESEARCH_MODE || 'MOCK';
        if (mode === 'CANARY') {
            return this._canarySearch(leadId, field, hint);
        }

        const biz = hint.businessName || 'Unknown Business';
        const now = new Date().toISOString();

        const mockData = {
            menu: [
                {
                    domain: 'menu',
                    sourceType: 'PUBLIC_WEBSITE',
                    sourceRef: `mock://menu/${leadId}`,
                    capturedAt: now,
                    rawValue: 'telur balado, tempe goreng, sayur bayam',
                    normalizedValue: 'telur balado, tempe goreng, sayur bayam',
                    directness: 'DIRECT',
                    completeness: 80,
                    classification: 'INFERENCE'  // Web menu = inference, not transaction fact
                }
            ],
            contact: [
                {
                    domain: 'contact',
                    sourceType: 'SERPAPI_MAPS',
                    sourceRef: `mock://maps/${leadId}`,
                    capturedAt: now,
                    rawValue: `+6281234${Math.floor(Math.random() * 900000 + 100000)}`,
                    normalizedValue: `+6281234${Math.floor(Math.random() * 900000 + 100000)}`,
                    directness: 'DIRECT',
                    completeness: 100,
                    classification: 'FACT'
                }
            ],
            category: [
                {
                    domain: 'category',
                    sourceType: 'SERPAPI_MAPS',
                    sourceRef: `mock://maps/${leadId}`,
                    capturedAt: now,
                    rawValue: 'Warteg',
                    normalizedValue: 'WARTEG',
                    directness: 'DIRECT',
                    completeness: 90,
                    classification: 'FACT'
                }
            ],
            description: [
                {
                    domain: 'description',
                    sourceType: 'PUBLIC_WEBSITE',
                    sourceRef: `mock://web/${leadId}`,
                    capturedAt: now,
                    rawValue: 'Menjual berbagai lauk rumahan termasuk ayam goreng dan tempe',
                    normalizedValue: 'Menjual berbagai lauk rumahan',
                    directness: 'INDIRECT',
                    completeness: 70,
                    classification: 'INFERENCE'
                }
            ]
        };

        const results = mockData[field];
        if (!results) {
            return []; // Field not publicly searchable
        }

        // HALLUCINATION GUARD: Never return quantity/price/supplier as fact from web search
        const forbidden = ['volume', 'frequency', 'price', 'supplier', 'quantity'];
        if (forbidden.includes(field)) {
            return []; // Silently return empty — these fields need MANUAL_SURVEY
        }

        return results;
    }
}
