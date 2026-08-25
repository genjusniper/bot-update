// src/ai/errors/AIError.mjs

export class AIError extends Error {
  constructor(message, type, provider = 'unknown', isRetryable = false, isQuotaError = false, retryDelayMs = 0) {
    super(message);
    this.name = 'AIError';
    this.type = type; // e.g. 'NETWORK', 'TIMEOUT', 'QUOTA', 'INTERNAL'
    this.provider = provider;
    this.isRetryable = isRetryable;
    this.isQuotaError = isQuotaError;
    this.retryDelayMs = retryDelayMs;
  }
}
