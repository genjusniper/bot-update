// src/agent/Executor.mjs
// V11 — Tool Executor
// Executes planned tool steps with timeout, retry, and permission enforcement.

import { STEP_STATUS } from './AgentState.mjs';

export class Executor {
  /**
   * @param {object} options
   * @param {import('../tools/ToolRegistry.mjs').ToolRegistry} options.toolRegistry
   * @param {import('./PermissionPolicy.mjs').PermissionPolicy} options.permissionPolicy
   */
  constructor({ toolRegistry, permissionPolicy }) {
    this.toolRegistry = toolRegistry;
    this.permissionPolicy = permissionPolicy;
  }

  /**
   * Execute a single planned step.
   * Enforces permission, timeout, and retry policy.
   *
   * @param {object} step - A step from the Planner's plan.
   * @param {import('./AgentState.mjs').AgentState} agentState - The current run state.
   * @returns {Promise<{ status: string, output: any, error: string|null }>}
   */
  async executeStep(step, agentState) {
    const { toolName, input } = step;

    // 1. Resolve tool from registry
    const tool = this.toolRegistry.get(toolName);
    if (!tool) {
      return {
        status: STEP_STATUS.FAILED,
        output: null,
        error: `Tool "${toolName}" not found in registry.`,
      };
    }

    // 2. Enforce permission
    const permission = this.permissionPolicy.check(toolName);
    if (!permission.allowed && permission.level !== 'CONFIRM') {
      return {
        status: STEP_STATUS.DENIED,
        output: null,
        error: permission.reason,
      };
    }

    if (permission.requiresConfirmation) {
      // In V11.1, we return WAITING_CONFIRMATION.
      // In V11.2+, this will trigger a WhatsApp confirmation flow.
      return {
        status: STEP_STATUS.WAITING_CONFIRMATION,
        output: { message: `Confirmation required for "${toolName}".`, input },
        error: null,
      };
    }

    // 3. Execute with timeout
    const timeout = tool.timeout || 10000; // Default 10s
    const maxRetries = tool.retryPolicy?.maxRetries || 0;
    const backoffMs = tool.retryPolicy?.backoffMs || 1000;

    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this._executeWithTimeout(tool.execute, input, timeout, agentState.context);
        return {
          status: STEP_STATUS.SUCCESS,
          output: result,
          error: null,
        };
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          const delay = backoffMs * (attempt + 1);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    return {
      status: STEP_STATUS.FAILED,
      output: null,
      error: lastError?.message || 'Tool execution failed after retries.',
    };
  }

  /**
   * Execute all steps in a plan sequentially.
   * Stops on first DENIED, WAITING_CONFIRMATION, or unrecoverable FAILED.
   *
   * @param {Array} steps - Array of plan steps from the Planner.
   * @param {import('./AgentState.mjs').AgentState} agentState
   * @returns {Promise<Array<{ stepId: string, status: string, output: any, error: string|null }>>}
   */
  async executeAll(steps, agentState) {
    const results = [];

    for (const step of steps) {
      const registeredStep = agentState.addStep({
        toolName: step.toolName,
        input: step.input,
        permissionLevel: step.permissionCheck?.level || 'UNKNOWN',
      });

      agentState.startStep(registeredStep.stepId);

      const result = await this.executeStep(step, agentState);

      agentState.completeStep(registeredStep.stepId, {
        status: result.status,
        output: result.output,
        error: result.error,
      });

      results.push({ stepId: registeredStep.stepId, ...result });

      // Stop execution on blocking statuses
      if ([STEP_STATUS.DENIED, STEP_STATUS.WAITING_CONFIRMATION, STEP_STATUS.FAILED].includes(result.status)) {
        break;
      }
    }

    return results;
  }

  /**
   * Execute a function with a timeout.
   * @param {Function} fn
   * @param {object} input
   * @param {number} timeoutMs
   * @param {object} context
   * @returns {Promise<any>}
   */
  async _executeWithTimeout(fn, input, timeoutMs, context = {}) {
    return Promise.race([
      fn(input, context),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Tool execution timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }
}
