// src/ai/providers/GroqProvider.mjs
// V11.2 — Groq Llama 3.3 Provider (Multi-Key Rotation)
// Permission: AUTO (backup when Gemini quota is exhausted)
// API Docs: https://console.groq.com

export class GroqProvider {
  constructor(apiKey) {
    this.name = 'groq-qwen';
    this.model = 'qwen/qwen3.6-27b'; // Model chat aktif di akun ini
    this.endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    // Support multiple comma-separated keys (rotation)
    if (!apiKey) {
      this.apiKeys = [];
    } else if (Array.isArray(apiKey)) {
      this.apiKeys = apiKey;
    } else {
      this.apiKeys = String(apiKey).split(',').map(k => k.trim()).filter(Boolean);
    }

    this.activeKeyIndex = 0;
    this.available = this.apiKeys.length > 0;
  }

  get apiKey() {
    return this.apiKeys[this.activeKeyIndex] || '';
  }

  rotateKey() {
    this.activeKeyIndex = (this.activeKeyIndex + 1) % this.apiKeys.length;
    console.log(`🔄 GroqProvider: Rotating to key #${this.activeKeyIndex + 1}/${this.apiKeys.length}`);
    return true;
  }

  async generate(prompt, options = {}) {
    const startTime = Date.now();

    if (!this.available) {
      return {
        ok: false,
        response: '',
        provider: this.name,
        latencyMs: 0,
        quotaExhausted: false,
        isRetryable: false,
        error: 'Groq API key not configured'
      };
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: typeof prompt === 'string' ? prompt : JSON.stringify(prompt)
            }
          ],
          max_tokens: 1024,
          temperature: 0.85
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        const isQuota = response.status === 429;
        return {
          ok: false,
          response: '',
          provider: this.name,
          latencyMs: Date.now() - startTime,
          quotaExhausted: isQuota,
          isRetryable: isQuota || response.status >= 500,
          error: `Groq HTTP ${response.status}: ${errText.slice(0, 200)}`
        };
      }

      const json = await response.json();
      let text = json?.choices?.[0]?.message?.content?.trim() || '';

      // Strip <think> blocks if the model is a reasoning model, even if cut off
      text = text.replace(/<think>[\s\S]*?(<\/think>|$)/gi, '').trim();
      // Strip THOUGHT: / Think: / Reasoning: prefix leaks
      text = text
        .replace(/^THOUGHT:[\s\S]*?\n(?=\S)/im, '')
        .replace(/^Think:[\s\S]*?\n(?=\S)/im, '')
        .replace(/^THOUGHT:.*$/im, '')
        .trim();

      if (!text) {
        return {
          ok: false,
          response: '',
          provider: this.name,
          latencyMs: Date.now() - startTime,
          quotaExhausted: false,
          isRetryable: false,
          error: 'Groq returned empty response'
        };
      }

      return {
        ok: true,
        response: text,
        provider: this.name,
        latencyMs: Date.now() - startTime,
        quotaExhausted: false,
        error: null
      };

    } catch (err) {
      const isNetwork = /timeout|fetch failed|econnreset|network/i.test(err.message || '');
      return {
        ok: false,
        response: '',
        provider: this.name,
        latencyMs: Date.now() - startTime,
        quotaExhausted: false,
        isRetryable: isNetwork,
        error: err.message
      };
    }
  }
}
