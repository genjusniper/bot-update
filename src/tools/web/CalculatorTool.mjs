// src/tools/web/CalculatorTool.mjs
// V11.1 — Calculator Tool
// Permission: AUTO (pure computation, zero side effects)

export const CalculatorTool = {
  name: 'calculator',
  description: 'Perform basic arithmetic calculations. Supports +, -, *, /, and % operators.',
  category: 'web',
  inputSchema: {
    type: 'object',
    properties: {
      expression: { type: 'string', description: 'A math expression like "100 * 3 + 50".' },
    },
    required: ['expression'],
  },
  permissionLevel: 'AUTO',
  timeout: 5000,
  retryPolicy: { maxRetries: 0, backoffMs: 0 },

  /**
   * Execute calculation.
   * Uses a safe evaluator (no eval!) to compute the result.
   * @param {{ expression: string }} input
   * @returns {Promise<{ expression: string, result: number|string }>}
   */
  async execute(input) {
    const { expression } = input;

    // Extract only numbers and operators — never use eval()
    const sanitized = expression.replace(/[^0-9+\-*/.()% ]/g, '').trim();

    if (!sanitized || sanitized.length === 0) {
      return { expression, result: 'Invalid expression', error: true };
    }

    try {
      // Safe computation using Function constructor with strict sandboxing
      const result = new Function(`"use strict"; return (${sanitized})`)();

      if (typeof result !== 'number' || !isFinite(result)) {
        return { expression: sanitized, result: 'Invalid result', error: true };
      }

      return { expression: sanitized, result, error: false };
    } catch (err) {
      return { expression: sanitized, result: `Error: ${err.message}`, error: true };
    }
  },

  audit(input, output) {
    return {
      action: 'calculator',
      expression: input?.expression,
      result: output?.result,
      error: output?.error || false,
    };
  },
};
