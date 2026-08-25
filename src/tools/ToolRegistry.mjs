// src/tools/ToolRegistry.mjs
// V11 — Tool Registry
// Central registry for all tools. Tools self-register with a standard contract.

/**
 * Tool Contract (Interface):
 * {
 *   name: string,               // Unique tool name (e.g., 'web_search')
 *   description: string,        // Human-readable description for the Planner/LLM
 *   category: string,           // Tool category (e.g., 'web', 'commerce', 'communication')
 *   inputSchema: object,        // JSON-schema-like description of expected input
 *   permissionLevel: string,    // Default permission level (AUTO, CONFIRM, HUMAN_APPROVAL, DENY)
 *   timeout: number,            // Max execution time in ms
 *   retryPolicy: object,        // { maxRetries: number, backoffMs: number }
 *   execute: async function,    // The actual tool logic: (input, context) => result
 *   audit: function,            // Returns an audit-friendly summary of what the tool did
 * }
 */

export class ToolRegistry {
  constructor() {
    /** @type {Map<string, object>} */
    this._tools = new Map();
  }

  /**
   * Register a tool into the registry.
   * @param {object} tool - A tool object conforming to the Tool Contract.
   */
  register(tool) {
    this._validateContract(tool);

    if (this._tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered.`);
    }

    this._tools.set(tool.name, Object.freeze({ ...tool }));
    console.log(`🔧 ToolRegistry: Registered tool "${tool.name}" [${tool.category}]`);
  }

  /**
   * Unregister a tool by name.
   * @param {string} name
   */
  unregister(name) {
    if (!this._tools.has(name)) {
      throw new Error(`Tool "${name}" is not registered.`);
    }
    this._tools.delete(name);
  }

  /**
   * Retrieve a tool by name.
   * @param {string} name
   * @returns {object|null}
   */
  get(name) {
    return this._tools.get(name) || null;
  }

  /**
   * List all registered tools (useful for Planner/LLM context).
   * Returns an array of { name, description, category, inputSchema, permissionLevel }.
   */
  listForPlanner() {
    return Array.from(this._tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      category: t.category,
      inputSchema: t.inputSchema,
      permissionLevel: t.permissionLevel,
    }));
  }

  /**
   * List all registered tool names.
   * @returns {string[]}
   */
  listNames() {
    return Array.from(this._tools.keys());
  }

  /** @returns {number} */
  get size() {
    return this._tools.size;
  }

  /**
   * Validate that a tool object conforms to the required contract.
   * @param {object} tool
   */
  _validateContract(tool) {
    const required = ['name', 'description', 'category', 'inputSchema', 'permissionLevel', 'execute'];
    for (const field of required) {
      if (!(field in tool)) {
        throw new Error(`Tool contract violation: missing required field "${field}" in tool "${tool.name || 'unknown'}".`);
      }
    }
    if (typeof tool.execute !== 'function') {
      throw new Error(`Tool contract violation: "execute" must be a function in tool "${tool.name}".`);
    }
    if (typeof tool.name !== 'string' || tool.name.length === 0) {
      throw new Error(`Tool contract violation: "name" must be a non-empty string.`);
    }
  }
}
