// src/ai/providers/GeminiProvider.mjs
// V11.2 — Gemini Provider with Multi-Turn Chat and Health Manager support
import { GoogleGenAI } from '@google/genai';
import { AIError } from '../errors/AIError.mjs';
import { ProviderHealthManager, KeyStatus } from '../gateway/ProviderHealthManager.mjs';
import { EventBus } from '../../event/EventBus.mjs';

export class GeminiProvider {
  constructor(apiKey, modelName = 'gemini-3.6-flash') {
    if (!apiKey) {
      throw new Error('GeminiProvider requires an API key');
    }
    this.name = 'gemini';
    this.modelName = modelName;

    // Support comma-separated strings or array of keys
    if (Array.isArray(apiKey)) {
      this.apiKeys = apiKey;
    } else if (typeof apiKey === 'string') {
      this.apiKeys = apiKey.split(',').map(k => k.trim()).filter(Boolean);
    } else {
      this.apiKeys = [apiKey];
    }

    if (this.apiKeys.length === 0) {
      throw new Error('GeminiProvider requires at least one valid API key');
    }

    this.activeKeyIndex = 0;
    
    // Multi-turn chat sessions: keyed by conversationId
    this._chatSessions = new Map();
    this._chatSessionMaxAge = 30 * 60 * 1000; // 30 menit
    
    // Wire up health manager
    this.healthManager = new ProviderHealthManager(this.name, this.apiKeys);
    
    this._initClient();
  }

  _initClient() {
    const key = this.apiKeys[this.activeKeyIndex];
    this.client = new GoogleGenAI({ apiKey: key });
  }

  /**
   * Rotate to the next API key in the list.
   */
  rotateKey() {
    this._chatSessions.clear(); // Bersihkan sesi chat lama
    // AIGateway uses this to rotate. We let getBestKey handle it, but AIGateway increments its counters.
    this.activeKeyIndex = (this.activeKeyIndex + 1) % this.apiKeys.length;
    this._initClient();
    console.log(`🔄 GeminiProvider: Rotating to API Key #${this.activeKeyIndex + 1}/${this.apiKeys.length}`);
    return true;
  }

  /**
   * Get or create a persistent multi-turn chat session.
   */
  _getOrCreateChat(conversationId, systemPrompt = '', history = []) {
    const now = Date.now();
    for (const [id, session] of this._chatSessions) {
      if (now - session.lastUsed > this._chatSessionMaxAge) {
        this._chatSessions.delete(id);
        console.log(`🗑️ GeminiProvider: Chat session expired for ${id}`);
      }
    }
    
    const rawHistory = history.slice(-40).map(entry => ({
      role: entry.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: entry.text }]
    }));

    const formattedHistory = [];
    for (const entry of rawHistory) {
      if (formattedHistory.length === 0) {
        if (entry.role === 'user') formattedHistory.push(entry);
      } else {
        const lastEntry = formattedHistory[formattedHistory.length - 1];
        if (lastEntry.role === entry.role) {
          lastEntry.parts[0].text += '\n' + entry.parts[0].text;
        } else {
          formattedHistory.push(entry);
        }
      }
    }

    while (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === 'user') {
      formattedHistory.pop();
    }
    
    const chat = this.client.chats.create({
      model: this.modelName,
      config: {
        systemInstruction: systemPrompt,
        temperature: 1.0
      },
      history: formattedHistory
    });
    
    const session = { chat, lastUsed: now };
    this._chatSessions.set(conversationId, session);
    return session;
  }

  _getErrorClass(err) {
    const raw = String(err?.message || err?.error?.message || err || '').toLowerCase();
    if (raw.includes('429') || raw.includes('quota') || raw.includes('exhausted') || raw.includes('rate limit')) return '429';
    if (raw.includes('401') || raw.includes('unauthenticated') || raw.includes('403') || raw.includes('key')) return '401';
    if (raw.includes('400') || raw.includes('invalid_argument') || raw.includes('parts[0].data')) return '400';
    if (raw.includes('500') || raw.includes('502') || raw.includes('503') || raw.includes('504') || raw.includes('internal server error')) return '5xx';
    return 'NETWORK';
  }

  _normalizeError(err) {
    const raw = String(err?.message || err?.error?.message || err || '').toLowerCase();
    
    const isQuota = raw.includes('429') || 
                    raw.includes('resource_exhausted') || 
                    raw.includes('quota exceeded') ||
                    raw.includes('generate_content_free_tier_requests') ||
                    raw.includes('ratelimit') || 
                    raw.includes('rate limit');

    const isKeyIssue = raw.includes('401') || 
                       raw.includes('unauthenticated') || 
                       raw.includes('404') || 
                       raw.includes('not found') || 
                       raw.includes('no longer available') || 
                       raw.includes('invalid api key') ||
                       raw.includes('api key');
                    
    const isNetwork = raw.includes('timeout') || 
                      raw.includes('timed out') || 
                      raw.includes('network') || 
                      raw.includes('fetch failed') ||
                      raw.includes('econnreset') ||
                      raw.includes('econnrefused') ||
                      raw.includes('socket');
                      
    const isServerError = raw.includes('500') || 
                          raw.includes('502') || 
                          raw.includes('503') || 
                          raw.includes('504') ||
                          raw.includes('internal server error') ||
                          raw.includes('service unavailable');

    let retryDelayMs = 0;
    const match = raw.match(/retry[- ]after\s*(\d+)/i);
    if (match && match[1]) {
       retryDelayMs = parseInt(match[1]) * 1000;
    }

    if (isQuota || isKeyIssue) {
      return new AIError(err.message || 'Gemini Quota/Key Issue', 'QUOTA', this.name, false, true, retryDelayMs);
    }
    
    if (isNetwork || isServerError) {
      return new AIError(err.message || 'Gemini Network/Server Error', 'NETWORK', this.name, true, false, retryDelayMs);
    }

    return new AIError(err.message || 'Unknown Gemini Error', 'UNKNOWN', this.name, false, false, 0);
  }

  /**
   * Generate response.
   */
  async generate(prompt, options = {}) {
    // 1. Get the best healthy key from health manager
    const bestKey = this.healthManager.getBestKey();
    if (!bestKey) {
      console.warn(`[GeminiProvider] ⚠️ Fast-failing: All Gemini keys are on cooldown/disabled.`);
      return {
        ok: false,
        response: '',
        provider: this.name,
        latencyMs: 0,
        quotaExhausted: true,
        isRetryable: false,
        error: 'All Gemini API keys are currently exhausted or disabled.'
      };
    }

    this.activeKeyIndex = bestKey.index;
    this._initClient();
    
    const startTime = Date.now();
    
    try {
      const { conversationId, history, systemPrompt } = options;
      let text = '';
      
      if (conversationId && Array.isArray(history) && history.length > 0) {
        // --- MULTI-TURN MODE ---
        const session = this._getOrCreateChat(conversationId, systemPrompt || '', history);
        session.lastUsed = Date.now();
        
        let messagePayload = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
        if (options.image) {
          messagePayload = [
            { text: typeof prompt === 'string' ? prompt : JSON.stringify(prompt) },
            { inlineData: { data: options.image.base64, mimeType: options.image.mimeType } }
          ];
        }
        const response = await session.chat.sendMessage({ message: messagePayload });
        text = response.text || '';
        
        try {
          const latencyMs = Date.now() - startTime;
          const inputTokens = response.usageMetadata?.promptTokenCount || 0;
          const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
          EventBus.publish('api_usage', { provider: this.name, latencyMs, inputTokens, outputTokens, status: 'SUCCESS' });
        } catch(e) {}
        
      } else {
        // --- SINGLE-SHOT MODE ---
        console.log('--- GEMINI SINGLE SHOT REQUEST ---');
        const reqPayload = {
          model: options.model || this.modelName,
          contents: options.image ? [{text: prompt}, {inlineData: {data: options.image.base64, mimeType: options.image.mimeType}}] : prompt,
          config: {
            temperature: options.temperature ?? 1.0, 
          }
        };
        console.log(JSON.stringify(reqPayload, null, 2).substring(0, 500));
        
        const response = await this.client.models.generateContent(reqPayload);
        text = response.text || '';
        
        try {
          const latencyMs = Date.now() - startTime;
          const inputTokens = response.usageMetadata?.promptTokenCount || 0;
          const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
          EventBus.publish('api_usage', { provider: this.name, latencyMs, inputTokens, outputTokens, status: 'SUCCESS' });
        } catch(e) {}
      }
      
      const cleanText = text
        .replace(/\u0000/g, '')
        .replace(/^THOUGHT:[\s\S]*?\n(?=\S)/im, '')
        .replace(/^Think:[\s\S]*?\n(?=\S)/im, '')
        .replace(/^Reasoning:[\s\S]*?\n(?=\S)/im, '')
        .replace(/^<think>[\s\S]*?<\/think>/im, '')
        .replace(/^THOUGHT:.*$/im, '')
        .trim();

      if (!cleanText || cleanText.match(/^(undefined|null|error|internal server error)$/i)) {
        throw new Error('Unusable response from Gemini');
      }

      return {
        ok: true,
        response: cleanText,
        provider: this.name,
        latencyMs: Date.now() - startTime,
        quotaExhausted: false,
        error: null
      };

    } catch (err) {
      // 2. Report error to health manager
      const errClass = this._getErrorClass(err);
      const action = this.healthManager.reportError(this.activeKeyIndex, errClass);
      
      try {
        const latencyMs = Date.now() - startTime;
        EventBus.publish('api_usage', { provider: this.name, latencyMs, inputTokens: 0, outputTokens: 0, status: 'FAILED_' + errClass });
      } catch(e) {}
      
      const normalizedError = this._normalizeError(err);
      
      // If it's a fatal abort (e.g. malformed payload), tell gateway NOT to retry
      const isQuota = (action.action === 'ROTATE') && normalizedError.isQuotaError;
      const isRetryable = (action.action !== 'FATAL_ABORT') && normalizedError.isRetryable;

      return {
        ok: false,
        response: '',
        provider: this.name,
        latencyMs: Date.now() - startTime,
        quotaExhausted: isQuota || (action.action === 'ROTATE'),
        isRetryable: isRetryable,
        retryDelayMs: normalizedError.retryDelayMs,
        error: err.message
      };
    }
  }
}