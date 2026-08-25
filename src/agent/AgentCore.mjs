// src/agent/AgentCore.mjs
// V11 — Agent Core Orchestrator
// The central brain that ties Planner, Executor, Verifier, Permission, and Audit together.
// Sits ON TOP of V10 Brain — does NOT replace it.

import { AgentState } from './AgentState.mjs';
import { Planner } from './Planner.mjs';
import { Executor } from './Executor.mjs';
import { Verifier } from './Verifier.mjs';
import { PermissionPolicy } from './PermissionPolicy.mjs';
import { ToolRegistry } from '../tools/ToolRegistry.mjs';

export class AgentCore {
  constructor({ toolRegistry, permissionOverrides = {} } = {}) {
    this.toolRegistry = toolRegistry || new ToolRegistry();
    this.permissionPolicy = new PermissionPolicy(permissionOverrides);
    this.planner = new Planner({
      toolRegistry: this.toolRegistry,
      permissionPolicy: this.permissionPolicy,
    });
    this.executor = new Executor({
      toolRegistry: this.toolRegistry,
      permissionPolicy: this.permissionPolicy,
    });
    this.verifier = new Verifier();

    // Audit log (in-memory for V11.1, file-based in V11.2+)
    this.auditLog = [];
  }

  /**
   * Process a user message through the full Agent pipeline.
   * This is called AFTER V10 Brain has already analyzed the message.
   *
   * Flow: Plan → Permission Check → Execute → Verify → Audit
   *
   * @param {object} options
   * @param {string} options.userId
   * @param {string} options.conversationId
   * @param {string} options.text - The raw user message
   * @param {string} options.intent - Intent from V10 Conversation Engine
   * @param {object} options.conversationState - Full V10 conversation state
   * @param {object} options.memory - User memory from V10 Memory Engine
   * @returns {Promise<{ handled: boolean, results: Array, agentState: object, auditEntry: object }>}
   */
  async process({ userId, conversationId, text, intent, conversationState = {}, memory = {}, deps = {} }) {
    // 1. Create a new agent run
    const state = new AgentState({ userId, conversationId, context: { deps, userId } });

    // 2. Plan
    const plan = this.planner.plan({ intent, text, conversationState, memory });
    state.setPlan(plan.planId);

    // If no tools are needed, return early (V10 Brain handles it as pure conversation)
    if (!plan.requiresTools) {
      state.complete();
      const auditEntry = state.toAuditLog();
      this.auditLog.push(auditEntry);
      return {
        handled: false, // Agent didn't need to act — V10 Brain handles it
        results: [],
        agentState: state,
        auditEntry,
      };
    }

    // 3. Execute all steps (Executor enforces permission per step)
    state.status = 'EXECUTING';
    const results = await this.executor.executeAll(plan.steps, state);

    // 4. Verify each result
    const verifiedResults = results.map(result => {
      const verification = this.verifier.verify({
        toolName: result.stepId, // Use stepId for tracing
        input: plan.steps.find(s => s.toolName === result.toolName)?.input,
        output: result.output,
        status: result.status,
      });
      return { ...result, verification };
    });

    // 5. Determine final status
    const hasWaiting = verifiedResults.some(r => r.status === 'WAITING_CONFIRMATION');
    const hasFailed = verifiedResults.some(r => r.status === 'FAILED');
    const hasDenied = verifiedResults.some(r => r.status === 'DENIED');

    if (hasWaiting) {
      state.waitForConfirmation();
    } else if (hasFailed || hasDenied) {
      state.fail('One or more steps failed or were denied.');
    } else {
      state.complete();
    }

    // 6. Audit
    const auditEntry = state.toAuditLog();
    this.auditLog.push(auditEntry);

    // Keep audit log bounded (last 100 runs)
    if (this.auditLog.length > 100) {
      this.auditLog = this.auditLog.slice(-100);
    }

    return {
      handled: true,
      results: verifiedResults,
      agentState: state,
      auditEntry,
    };
  }

  /** Get the last N audit entries. */
  getAuditLog(limit = 10) {
    return this.auditLog.slice(-limit);
  }

  /** Register a tool into the agent's tool registry. */
  registerTool(tool) {
    this.toolRegistry.register(tool);
  }
}
