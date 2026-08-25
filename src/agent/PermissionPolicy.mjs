// src/agent/PermissionPolicy.mjs
// V11 — Permission & Policy Engine
// Determines whether a tool action is allowed, needs confirmation, or is denied.

/**
 * Permission Levels:
 * - AUTO:            Tool can execute without asking the user.
 * - CONFIRM:         Tool requires user confirmation before executing.
 * - HUMAN_APPROVAL:  Tool requires explicit human/owner approval (e.g., payment, refund).
 * - DENY:            Tool is never allowed to execute autonomously.
 */

const PERMISSION = Object.freeze({
  AUTO: 'AUTO',
  CONFIRM: 'CONFIRM',
  HUMAN_APPROVAL: 'HUMAN_APPROVAL',
  DENY: 'DENY',
});

// Default policy table.
// Each tool category maps to a permission level.
// This can be overridden per-tenant in V13.
const DEFAULT_POLICY = Object.freeze({
  // Safe read-only actions
  'web_search':       PERMISSION.AUTO,
  'calculator':       PERMISSION.AUTO,
  'get_contacts':     PERMISSION.AUTO,
  'send_whatsapp_message': PERMISSION.AUTO, // In V11.2 this should probably be HUMAN_APPROVAL, but we AUTO it for now for demo
  'schedule_reminder': PERMISSION.AUTO,
  'run_termux_command': PERMISSION.AUTO,
  'product_lookup':   PERMISSION.AUTO,
  'stock_check':      PERMISSION.AUTO,
  'price_calculate':  PERMISSION.AUTO,
  'catalog_browse':   PERMISSION.AUTO,

  // State-changing actions that need user confirmation
  'create_order':     PERMISSION.CONFIRM,
  'update_cart':      PERMISSION.CONFIRM,
  'send_address':     PERMISSION.CONFIRM,
  'update_customer':  PERMISSION.CONFIRM,
  'send_message':     PERMISSION.CONFIRM,
  'schedule_task':    PERMISSION.CONFIRM,

  // High-risk actions that require human/owner approval
  'payment':          PERMISSION.HUMAN_APPROVAL,
  'refund':           PERMISSION.HUMAN_APPROVAL,
  'transfer_money':   PERMISSION.HUMAN_APPROVAL,
  'cancel_order':     PERMISSION.HUMAN_APPROVAL,

  // Destructive actions — always denied for autonomous execution
  'delete_data':      PERMISSION.DENY,
  'delete_customer':  PERMISSION.DENY,
  'reset_inventory':  PERMISSION.DENY,
});

export class PermissionPolicy {
  constructor(overrides = {}) {
    this.policy = { ...DEFAULT_POLICY, ...overrides };
  }

  /**
   * Check the permission level for a given tool action.
   * @param {string} toolName - The registered name of the tool.
   * @returns {{ allowed: boolean, level: string, requiresConfirmation: boolean, reason: string }}
   */
  check(toolName) {
    const level = this.policy[toolName] || PERMISSION.DENY; // Default to DENY for unknown tools

    switch (level) {
      case PERMISSION.AUTO:
        return {
          allowed: true,
          level,
          requiresConfirmation: false,
          reason: `Tool "${toolName}" is safe for autonomous execution.`,
        };
      case PERMISSION.CONFIRM:
        return {
          allowed: true,
          level,
          requiresConfirmation: true,
          reason: `Tool "${toolName}" requires user confirmation before execution.`,
        };
      case PERMISSION.HUMAN_APPROVAL:
        return {
          allowed: false,
          level,
          requiresConfirmation: true,
          reason: `Tool "${toolName}" requires explicit human/owner approval.`,
        };
      case PERMISSION.DENY:
      default:
        return {
          allowed: false,
          level: PERMISSION.DENY,
          requiresConfirmation: false,
          reason: `Tool "${toolName}" is denied for autonomous execution.`,
        };
    }
  }

  /**
   * Register or update a policy entry.
   * @param {string} toolName
   * @param {string} level - One of PERMISSION values
   */
  setPolicy(toolName, level) {
    if (!Object.values(PERMISSION).includes(level)) {
      throw new Error(`Invalid permission level: ${level}`);
    }
    this.policy[toolName] = level;
  }

  /** Get the full policy table. */
  getAll() {
    return { ...this.policy };
  }
}

export { PERMISSION, DEFAULT_POLICY };
