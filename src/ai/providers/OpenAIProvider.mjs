// src/ai/providers/OpenAIProvider.mjs
// V12 — Fixed: proper auth, NVIDIA routing, higher max_tokens, systemPrompt support
import { AIError } from '../errors/AIError.mjs';

export class OpenAIProvider {
  constructor(apiKeysString) {
    if (!apiKeysString) throw new Error('OpenAIProvider requires an API key');
    this.apiKeys = apiKeysString.split(',').map(k => k.trim()).filter(Boolean);
    if (this.apiKeys.length === 0) throw new Error('OpenAIProvider requires at least one valid API key');
    this.activeKeyIndex = 0;
    this.name = 'OpenAI';
  }

  rotateKey() {
    this.activeKeyIndex = (this.activeKeyIndex + 1) % this.apiKeys.length;
    console.log(`🔄 OpenAIProvider: Rotating to key #${this.activeKeyIndex + 1}/${this.apiKeys.length}`);
    return true;
  }

  _getEndpointAndModel(key) {
    if (key.startsWith('nvapi-')) {
      return {
        apiUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
        model: 'meta/llama-3.3-70b-instruct'
      };
    }
    if (key.startsWith('sk-or-')) {
      return {
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'openai/gpt-4o-mini'
      };
    }
    return {
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini'
    };
  }

  async generate(prompt, options = {}) {
    const key = this.apiKeys[this.activeKeyIndex];
    const { apiUrl, model } = this._getEndpointAndModel(key);

    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    for (const msg of (options.history || [])) {
      const role = msg.role === 'user' ? 'user' : 'assistant';
      const content = msg.text || msg.content || '';
      if (content) messages.push({ role, content });
    }
    messages.push({ role: 'user', content: typeof prompt === 'string' ? prompt : String(prompt) });

    console.log(`🤖 OpenAIProvider [${model}] key#${this.activeKeyIndex + 1}/${this.apiKeys.length} — ${messages.length} msgs`);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.85,
          max_tokens: 512
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        const isQuota = response.status === 429 || response.status === 402;
        const isAuth = response.status === 401 || response.status === 403;
        console.error(`❌ OpenAIProvider HTTP ${response.status} [key#${this.activeKeyIndex + 1}]: ${errorText.slice(0, 200)}`);
        return {
          ok: false,
          response: '',
          quotaExhausted: isQuota,
          isRetryable: isQuota || response.status >= 500,
          retryDelayMs: isQuota ? 30000 : 5000,
          error: new AIError(`OpenAI ${response.status}${isAuth ? ' (invalid key)' : ''}: ${errorText.slice(0, 100)}`, 'API_ERROR', this.name, false, isQuota)
        };
      }

      const data = await response.json();
      const text = (data.choices?.[0]?.message?.content || '').trim();

      if (!text) {
        return { ok: false, response: '', quotaExhausted: false, isRetryable: false, retryDelayMs: 0, error: new AIError('Empty response from OpenAI', 'EMPTY_RESPONSE', this.name, false, false) };
      }

      console.log(`✅ OpenAIProvider: OK (${text.length} chars)`);
      return { ok: true, response: text, quotaExhausted: false, isRetryable: false, retryDelayMs: 0, error: null };

    } catch (err) {
      console.error(`❌ OpenAIProvider network error: ${err.message}`);
      return { ok: false, response: '', quotaExhausted: false, isRetryable: true, retryDelayMs: 10000, error: new AIError(err.message, 'NETWORK', this.name, false, false) };
    }
  }
}

