// src/ai/gateway/AIGateway.mjs
// V12 — Fixed: provider logging, Groq gets full options, fallback is last resort only

import { LocalFallbackProvider } from '../providers/LocalFallbackProvider.mjs';
const STATE_CLOSED = 'CLOSED';
const STATE_OPEN = 'OPEN';
const STATE_HALF_OPEN = 'HALF_OPEN';
const DEFAULT_COOLDOWN_MS = 30 * 1000; // 30 detik (lebih cepat recover)

export class AIGateway {
  constructor(primaryProvider, groqProvider, fallbackProvider) {
    this.primary = primaryProvider; 
    this.groq = groqProvider;         
    this.fallback = fallbackProvider;  
    this.localFallback = new LocalFallbackProvider();
    
    this.state = STATE_CLOSED;
    this.resetAt = 0;
    this.maxKeys = primaryProvider.apiKeys ? primaryProvider.apiKeys.length : 1;
    
    this.stats = {
      success: 0,
      failures: 0,
      quotaFailures: 0,
      groqCount: 0,
      fallbackCount: 0
    };
  }

  _checkCircuit() {
    if (this.state === STATE_OPEN) {
      if (Date.now() >= this.resetAt) {
        this.state = STATE_HALF_OPEN;
        console.log(`⏳ AIGateway: Circuit HALF_OPEN (Probe allowed)`);
      }
    }
  }

  async generate(prompt, options = {}) {
    this._checkCircuit();

    const purpose = options.purpose || 'chat';
    const incomingText = options.incomingText || '';

    // Fast-fail if OPEN → coba Groq dulu sebelum local fallback
    if (this.state === STATE_OPEN) {
      console.warn(`🛑 AIGateway: Circuit OPEN. Trying Groq...`);
      if (this.groq && this.groq.available) {
        let groqResult = await this.groq.generate(prompt, options);
        // Coba rotasi kunci Groq jika quota habis
        let attempts = 1;
        const maxKeys = this.groq.apiKeys ? this.groq.apiKeys.length : 1;
        while (!groqResult.ok && groqResult.quotaExhausted && attempts < maxKeys) {
          if (typeof this.groq.rotateKey === 'function' && this.groq.rotateKey()) {
            groqResult = await this.groq.generate(prompt, options);
            attempts++;
          } else {
            break;
          }
        }
        if (groqResult.ok) {
          console.log(`✅ AIGateway: Groq responded successfully!`);
          this.stats.groqCount++;
          return groqResult;
        }
      }
      console.warn(`⚠️ AIGateway: Groq also failed. Local fallback.`);
      this.stats.fallbackCount++;
      return await this.localFallback.generate({ incomingText, purpose });
    }

    const maxAttempts = options.maxAttempts || (this.state === STATE_HALF_OPEN ? 1 : 2);
    let lastResult = null;

    let keysTried = 0;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      lastResult = await this.primary.generate(prompt, options);

      if (lastResult.ok) {
        if (this.state === STATE_HALF_OPEN) {
          console.log(`✅ AIGateway: Probe successful. Circuit CLOSED.`);
          this.state = STATE_CLOSED;
        }
        this.stats.success++;
        console.log(`✅ AIGateway: Response from [${this.primary.name || 'Primary'}]`);
        return lastResult;
      }

      // Handle Failure
      this.stats.failures++;
      
      if (lastResult.quotaExhausted) {
        if (typeof this.primary.rotateKey === 'function') {
          keysTried++;
          if (keysTried >= this.maxKeys) {
            console.error(`🛑 AIGateway: All keys exhausted!`);
            this.state = STATE_OPEN;
            this.resetAt = Date.now() + DEFAULT_COOLDOWN_MS;
            break;
          }
          this.primary.rotateKey();
          console.log(`🔄 AIGateway: API key rotated. Retrying...`);
          attempt--;
          continue;
        }

        console.error(`🛑 AIGateway: All Gemini keys exhausted! Opening Circuit.`);
        this.stats.quotaFailures++;
        this.state = STATE_OPEN;
        const delay = lastResult.retryDelayMs > 0 ? Math.max(DEFAULT_COOLDOWN_MS, lastResult.retryDelayMs) : DEFAULT_COOLDOWN_MS;
        this.resetAt = Date.now() + delay;
        break;
      }
      
      if (this.state === STATE_HALF_OPEN) {
        console.error(`🛑 AIGateway: Probe failed! Circuit OPEN again.`);
        this.state = STATE_OPEN;
        this.resetAt = Date.now() + DEFAULT_COOLDOWN_MS;
        break;
      }

      if (!lastResult.isRetryable) {
        break;
      }

      if (attempt < maxAttempts) {
        const delay = 500 * attempt;
        console.log(`⏳ AIGateway: Retryable error. Waiting ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }

    // Gemini gagal total → coba Groq
    if (this.groq && this.groq.available) {
      console.warn(`⚠️ AIGateway: Gemini failed. Trying Groq Llama3...`);
      let groqResult = await this.groq.generate(prompt, options);
      
      let attempts = 1;
      const maxKeys = this.groq.apiKeys ? this.groq.apiKeys.length : 1;
      while (!groqResult.ok && groqResult.quotaExhausted && attempts < maxKeys) {
        if (typeof this.groq.rotateKey === 'function' && this.groq.rotateKey()) {
          groqResult = await this.groq.generate(prompt, options);
          attempts++;
        } else {
          break;
        }
      }

      if (groqResult.ok) {
        console.log(`✅ AIGateway: Groq saved the day!`);
        this.stats.groqCount++;
        return groqResult;
      } else {
        console.error(`❌ AIGateway: Groq fallback failed: ${groqResult.error}`);
      }
    }

    // Groq also failed → try third provider (Gemini) before local
    if (this.fallback && this.fallback.name !== 'local-fallback') {
      console.warn(`⚠️ AIGateway: Groq failed. Trying Gemini as last AI resort...`);
      const geminiResult = await this.fallback.generate(prompt, options);
      if (geminiResult.ok) {
        console.log(`✅ AIGateway: Response from [Gemini emergency]`);
        return geminiResult;
      }
      console.error(`❌ AIGateway: Gemini also failed. Going offline.`);
    }

    // Everything failed → local offline fallback
    console.warn(`⚠️⚠️ AIGateway: ALL providers failed. Local offline fallback!`);
    this.stats.fallbackCount++;
    return await this.localFallback.generate(prompt, { incomingText, purpose });
  }
}