// src/agent/AgentState.mjs
// V11 — Agent State & Run ID Tracker
// Every agent execution cycle gets a unique Run ID for full traceability.

import { randomUUID } from 'crypto';

const STEP_STATUS = Object.freeze({
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
  WAITING_CONFIRMATION: 'WAITING_CONFIRMATION',
  DENIED: 'DENIED',
});

const RUN_STATUS = Object.freeze({
  PLANNING: 'PLANNING',
  EXECUTING: 'EXECUTING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  WAITING: 'WAITING',
  CANCELLED: 'CANCELLED',
});

export class AgentState {
  constructor({ userId, conversationId, context = {} }) {
    this.runId = `RUN-${Date.now()}-${randomUUID().slice(0, 8)}`;
    this.userId = userId;
    this.conversationId = conversationId;
    this.planId = null;
    this.context = context;
    this.status = RUN_STATUS.PLANNING;
    this.createdAt = new Date().toISOString();
    this.updatedAt = this.createdAt;
    this.steps = [];
    this.error = null;
  }

  /** Set the plan ID once the Planner produces a plan. */
  setPlan(planId) {
    this.planId = planId;
    this._touch();
  }

  /** Add a new step to this run. Returns the step object. */
  addStep({ toolName, input, permissionLevel }) {
    const step = {
      stepId: `STEP-${String(this.steps.length + 1).padStart(2, '0')}`,
      toolName,
      input,
      permissionLevel,
      status: STEP_STATUS.PENDING,
      output: null,
      error: null,
      startedAt: null,
      completedAt: null,
    };
    this.steps.push(step);
    this._touch();
    return step;
  }

  /** Mark a step as running. */
  startStep(stepId) {
    const step = this._findStep(stepId);
    step.status = STEP_STATUS.RUNNING;
    step.startedAt = new Date().toISOString();
    this._touch();
  }

  /** Mark a step as completed (success or failure). */
  completeStep(stepId, { status, output = null, error = null }) {
    const step = this._findStep(stepId);
    step.status = status;
    step.output = output;
    step.error = error;
    step.completedAt = new Date().toISOString();
    this._touch();
  }

  /** Mark the entire run as completed. */
  complete() {
    this.status = RUN_STATUS.COMPLETED;
    this._touch();
  }

  /** Mark the entire run as failed. */
  fail(error) {
    this.status = RUN_STATUS.FAILED;
    this.error = error instanceof Error ? error.message : String(error);
    this._touch();
  }

  /** Mark the run as waiting for user confirmation. */
  waitForConfirmation() {
    this.status = RUN_STATUS.WAITING;
    this._touch();
  }

  /** Get a full snapshot of the run state for audit logging. */
  toAuditLog() {
    return {
      runId: this.runId,
      userId: this.userId,
      conversationId: this.conversationId,
      planId: this.planId,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      error: this.error,
      steps: this.steps.map(s => ({ ...s })),
    };
  }

  /** Get a human-readable summary. */
  toSummary() {
    const stepSummary = this.steps.map(s =>
      `  ${s.stepId} (${s.toolName}) -> ${s.status}`
    ).join('\n');
    return `${this.runId} [${this.status}]\n${stepSummary}`;
  }

  _findStep(stepId) {
    const step = this.steps.find(s => s.stepId === stepId);
    if (!step) throw new Error(`Step ${stepId} not found in run ${this.runId}`);
    return step;
  }

  _touch() {
    this.updatedAt = new Date().toISOString();
  }
}

export { STEP_STATUS, RUN_STATUS };
