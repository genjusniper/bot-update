// src/agent/Verifier.mjs
// V11 — Result Verifier
// Validates tool execution results before they reach the user.

export class Verifier {
  /**
   * Verify the result of a tool execution.
   * Ensures the output is sane, non-empty, and not dangerous.
   *
   * @param {object} options
   * @param {string} options.toolName
   * @param {object} options.input - The original tool input
   * @param {object} options.output - The tool's raw output
   * @param {string} options.status - The execution status
   * @returns {{ verified: boolean, safe: boolean, reason: string, sanitizedOutput: any }}
   */
  verify({ toolName, input, output, status }) {
    // Failed steps are already handled
    if (status === 'FAILED' || status === 'DENIED') {
      return {
        verified: false,
        safe: true,
        reason: `Step did not execute successfully (${status}).`,
        sanitizedOutput: null,
      };
    }

    // Waiting steps are not verified yet
    if (status === 'WAITING_CONFIRMATION') {
      return {
        verified: false,
        safe: true,
        reason: 'Step is waiting for user confirmation.',
        sanitizedOutput: output,
      };
    }

    // Verify output is not null/undefined
    if (output === null || output === undefined) {
      return {
        verified: false,
        safe: true,
        reason: `Tool "${toolName}" returned null/undefined output.`,
        sanitizedOutput: null,
      };
    }

    // Verify output is not [object Object] string (common corruption)
    if (typeof output === 'string' && output === '[object Object]') {
      return {
        verified: false,
        safe: false,
        reason: `Tool "${toolName}" returned corrupted "[object Object]" string.`,
        sanitizedOutput: null,
      };
    }

    // Verify output doesn't contain sensitive data patterns
    const sensitivityCheck = this._checkSensitiveData(output);
    if (sensitivityCheck.found) {
      return {
        verified: false,
        safe: false,
        reason: `Tool "${toolName}" output contains potentially sensitive data: ${sensitivityCheck.type}.`,
        sanitizedOutput: this._redact(output, sensitivityCheck.type),
      };
    }

    return {
      verified: true,
      safe: true,
      reason: 'Output verified successfully.',
      sanitizedOutput: output,
    };
  }

  /**
   * Check if output contains sensitive data patterns.
   * @param {any} output
   * @returns {{ found: boolean, type: string }}
   */
  _checkSensitiveData(output) {
    const str = typeof output === 'string' ? output : JSON.stringify(output);

    // Credit card pattern
    if (/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(str)) {
      return { found: true, type: 'credit_card' };
    }

    // API key patterns
    if (/\b(AIza|sk-|pk_|rk_)[A-Za-z0-9_-]{20,}\b/.test(str)) {
      return { found: true, type: 'api_key' };
    }

    // Password patterns
    if (/password\s*[:=]\s*\S+/i.test(str)) {
      return { found: true, type: 'password' };
    }

    return { found: false, type: '' };
  }

  /**
   * Redact sensitive data from output.
   * @param {any} output
   * @param {string} type
   * @returns {string}
   */
  _redact(output, type) {
    const str = typeof output === 'string' ? output : JSON.stringify(output);
    return `[REDACTED: ${type} detected in output]`;
  }
}
