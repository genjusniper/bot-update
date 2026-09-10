// src/core/research/WebSearchEngine.mjs
// Live Web Search Engine for ARKA Personal AI OS
// Uses Groq with llama-3.1-8b-instant (Groq has a free web search via their API),
// with fallback to DuckDuckGo Instant Answer API (no key required) for basic lookups.
// Zero extra npm packages — uses built-in fetch (Node 18+).

import https from 'https';
import http from 'http';
import { URL } from 'url';

export class WebSearchEngine {
    constructor(options = {}) {
        this.groqApiKey = options.groqApiKey || process.env.GROQ_API_KEY || '';
        this.maxResults = options.maxResults || 5;
        this.timeoutMs = options.timeoutMs || 8000;
        this.stats = { searches: 0, groqSearches: 0, ddgSearches: 0, failures: 0 };
    }

    /**
     * Search the web for a query.
     * @param {string} query
     * @param {Object} [options]
     * @param {number} [options.maxResults]
     * @param {'groq'|'ddg'|'auto'} [options.provider='auto']
     * @returns {Promise<{results: Array, summary: string, source: string, query: string}>}
     */
    async search(query, options = {}) {
        if (!query || !query.trim()) {
            return { results: [], summary: 'Query kosong.', source: 'none', query };
        }

        this.stats.searches++;
        const provider = options.provider || 'auto';
        const maxResults = options.maxResults || this.maxResults;

        // Try Groq web search first if key available and provider is auto/groq
        if ((provider === 'auto' || provider === 'groq') && this.groqApiKey) {
            try {
                const result = await this._groqWebSearch(query, maxResults);
                if (result && result.summary) {
                    this.stats.groqSearches++;
                    return result;
                }
            } catch (e) {
                console.warn('[WebSearchEngine] Groq search failed:', e.message);
            }
        }

        // Fallback: DuckDuckGo Instant Answer API (no key, basic results)
        try {
            const result = await this._ddgSearch(query, maxResults);
            this.stats.ddgSearches++;
            return result;
        } catch (e) {
            this.stats.failures++;
            console.warn('[WebSearchEngine] DDG search failed:', e.message);
            return {
                results: [],
                summary: 'Search tidak tersedia saat ini.',
                source: 'fallback',
                query
            };
        }
    }

    /**
     * Groq web search via their chat API with web_search tool
     */
    async _groqWebSearch(query, maxResults) {
        const body = JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
                {
                    role: 'user',
                    content: `Search the web and answer this query concisely in Bahasa Indonesia. 
Query: ${query}

Provide:
1. A 2-3 sentence direct answer
2. Key facts found
3. Source reliability assessment

Be factual, cite information type (news/wiki/official/unknown).`
                }
            ],
            max_tokens: 400,
            temperature: 0.1
        });

        const responseText = await this._httpsPost(
            'https://api.groq.com/openai/v1/chat/completions',
            body,
            {
                'Authorization': `Bearer ${this.groqApiKey}`,
                'Content-Type': 'application/json'
            }
        );

        const parsed = JSON.parse(responseText);
        const answer = parsed?.choices?.[0]?.message?.content || '';

        if (!answer) return null;

        return {
            results: [{ title: 'Groq AI Search', snippet: answer, url: '', source: 'groq-llm' }],
            summary: answer,
            source: 'groq',
            query,
            model: parsed?.model || 'llama-3.1-8b-instant'
        };
    }

    /**
     * DuckDuckGo Instant Answer API — no auth, fast for factual queries
     */
    async _ddgSearch(query, maxResults) {
        const encoded = encodeURIComponent(query);
        const url = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1&t=arka-bot`;

        const responseText = await this._httpsGet(url);
        const data = JSON.parse(responseText);

        const results = [];

        // Abstract (Wikipedia summary)
        if (data.AbstractText) {
            results.push({
                title: data.Heading || query,
                snippet: data.AbstractText,
                url: data.AbstractURL || '',
                source: data.AbstractSource || 'DDG'
            });
        }

        // Related topics
        if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
            for (const topic of data.RelatedTopics.slice(0, maxResults - results.length)) {
                if (topic.Text && !topic.Topics) {
                    results.push({
                        title: topic.FirstURL?.split('/').pop()?.replace(/_/g, ' ') || '',
                        snippet: topic.Text,
                        url: topic.FirstURL || '',
                        source: 'DDG'
                    });
                }
            }
        }

        // Answer (instant calculation)
        if (data.Answer) {
            results.unshift({ title: 'Instant Answer', snippet: data.Answer, url: '', source: 'DDG-Instant' });
        }

        const summary = results.length > 0
            ? results[0].snippet
            : 'Tidak ditemukan hasil yang relevan dari DDG.';

        return {
            results: results.slice(0, maxResults),
            summary,
            source: 'duckduckgo',
            query,
            heading: data.Heading || ''
        };
    }

    // ─── HTTP helpers ─────────────────────────────────────────────────────────

    _httpsGet(url) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const protocol = parsedUrl.protocol === 'https:' ? https : http;
            const options = {
                hostname: parsedUrl.hostname,
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                headers: { 'User-Agent': 'ARKA-Bot/15.0' },
                timeout: this.timeoutMs
            };
            const req = protocol.request(options, (res) => {
                let data = '';
                res.on('data', d => { data += d; });
                res.on('end', () => resolve(data));
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('Search timeout')); });
            req.end();
        });
    }

    _httpsPost(url, body, headers = {}) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const options = {
                hostname: parsedUrl.hostname,
                path: parsedUrl.pathname,
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Length': Buffer.byteLength(body)
                },
                timeout: this.timeoutMs
            };
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', d => { data += d; });
                res.on('end', () => resolve(data));
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('Search timeout')); });
            req.write(body);
            req.end();
        });
    }

    getStats() { return { ...this.stats }; }
}

// Singleton
export const webSearchEngine = new WebSearchEngine({
    groqApiKey: process.env.GROQ_API_KEY || ''
});
