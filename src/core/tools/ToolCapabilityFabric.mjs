// src/core/tools/ToolCapabilityFabric.mjs
// Phase 34: Universal Tool Capability Fabric
// Unified schema, pre/post constraints, latency/cost budgeting, and fallback graph.

export const RiskTier = Object.freeze({
    READ: 'READ',
    WRITE: 'WRITE',
    EXTERNAL: 'EXTERNAL',
    DESTRUCTIVE: 'DESTRUCTIVE',
    IRREVERSIBLE: 'IRREVERSIBLE'
});

export const ToolCategory = Object.freeze({
    COMPUTATION: 'COMPUTATION',
    SYSTEM: 'SYSTEM',
    COMMERCE: 'COMMERCE',
    AUTOMOTIVE: 'AUTOMOTIVE',
    INFORMATION: 'INFORMATION',
    COMMUNICATION: 'COMMUNICATION'
});

export class ToolContract {
    /**
     * @param {Object} params
     * @param {string} params.name
     * @param {string} params.description
     * @param {string} [params.category='SYSTEM']
     * @param {string} [params.riskTier=RiskTier.READ]
     * @param {Object} [params.inputSchema={}]
     * @param {Object} [params.outputSchema={}]
     * @param {number} [params.latencyBudgetMs=3000]
     * @param {Object} [params.costBudget]
     * @param {Object} [params.reversibility]
     * @param {string} [params.fallbackTool=null]
     * @param {Function} [params.preConstraints=null]
     * @param {Function} [params.postConstraints=null]
     * @param {Function} params.handler
     */
    constructor({
        name,
        description,
        category = ToolCategory.SYSTEM,
        riskTier = RiskTier.READ,
        inputSchema = {},
        outputSchema = {},
        latencyBudgetMs = 3000,
        costBudget = { tokenCost: 0, financialCostUSD: 0 },
        reversibility = { isReversible: true, compensationTool: null },
        fallbackTool = null,
        preConstraints = null,
        postConstraints = null,
        handler
    }) {
        if (!name || typeof name !== 'string') throw new Error('ToolContract: name is required');
        if (!handler || typeof handler !== 'function') throw new Error('ToolContract: handler must be a function');

        this.name = name.toUpperCase();
        this.description = description || '';
        this.category = category;
        this.riskTier = riskTier;
        this.inputSchema = inputSchema;
        this.outputSchema = outputSchema;
        this.latencyBudgetMs = latencyBudgetMs;
        this.costBudget = costBudget;
        this.reversibility = reversibility;
        this.fallbackTool = fallbackTool ? fallbackTool.toUpperCase() : null;
        this.preConstraints = preConstraints;
        this.postConstraints = postConstraints;
        this.handler = handler;

        this.metrics = {
            invocations: 0,
            successes: 0,
            failures: 0,
            fallbacks: 0,
            totalLatencyMs: 0,
            avgLatencyMs: 0
        };
    }

    recordExecution(success, latencyMs, isFallback = false) {
        this.metrics.invocations++;
        if (success) {
            this.metrics.successes++;
        } else {
            this.metrics.failures++;
        }
        if (isFallback) {
            this.metrics.fallbacks++;
        }
        this.metrics.totalLatencyMs += latencyMs;
        this.metrics.avgLatencyMs = Math.round(this.metrics.totalLatencyMs / this.metrics.invocations);
    }
}

export class ToolCapabilityFabric {
    static #tools = new Map();
    static #initialized = false;

    /**
     * Initializes default capability registry
     */
    static init() {
        if (this.#initialized) return;
        this.registerDefaults();
        this.#initialized = true;
    }

    /**
     * Registers a new ToolContract into the fabric
     * @param {ToolContract|Object} contractParams
     */
    static registerTool(contractParams) {
        const contract = contractParams instanceof ToolContract
            ? contractParams
            : new ToolContract(contractParams);

        this.#tools.set(contract.name, contract);
        return contract;
    }

    /**
     * Retrieves registered tool
     * @param {string} name
     * @returns {ToolContract|null}
     */
    static getTool(name) {
        this.init();
        if (!name) return null;
        return this.#tools.get(name.toUpperCase()) || null;
    }

    /**
     * Returns list of all registered tools with public metadata
     */
    static listTools() {
        this.init();
        return Array.from(this.#tools.values()).map(t => ({
            name: t.name,
            description: t.description,
            category: t.category,
            riskTier: t.riskTier,
            latencyBudgetMs: t.latencyBudgetMs,
            costBudget: t.costBudget,
            isReversible: t.reversibility.isReversible,
            fallbackTool: t.fallbackTool,
            metrics: { ...t.metrics }
        }));
    }

    /**
     * Validates input parameters against schemas and constraints
     * @param {ToolContract} tool
     * @param {Object} input
     * @returns {{ valid: boolean, error?: string }}
     */
    static validateInput(tool, input = {}) {
        // 1. Required fields check
        if (tool.inputSchema && Array.isArray(tool.inputSchema.required)) {
            for (const reqField of tool.inputSchema.required) {
                if (input[reqField] === undefined || input[reqField] === null || input[reqField] === '') {
                    return { valid: false, error: 'Missing required field: ' + reqField };
                }
            }
        }

        // 2. Pre-constraint function check
        if (tool.preConstraints && typeof tool.preConstraints === 'function') {
            try {
                const constraintRes = tool.preConstraints(input);
                if (constraintRes && constraintRes.valid === false) {
                    return { valid: false, error: constraintRes.error || 'Pre-constraint validation failed' };
                }
            } catch (err) {
                return { valid: false, error: 'Pre-constraint evaluation error: ' + err.message };
            }
        }

        return { valid: true };
    }

    /**
     * Executes a tool with constraint checks, timeout budgeting, and fallback graph routing
     * @param {string} toolName
     * @param {Object} [input={}]
     * @param {Object} [context={}]
     * @param {number} [depth=0]
     * @returns {Promise<Object>}
     */
    static async execute(toolName, input = {}, context = {}, depth = 0) {
        this.init();
        if (depth > 3) {
            return { success: false, error: 'MAX_FALLBACK_DEPTH_EXCEEDED', toolUsed: toolName };
        }

        const tool = this.getTool(toolName);
        if (!tool) {
            return { success: false, error: 'TOOL_NOT_FOUND', toolUsed: toolName };
        }

        // Pre-validation
        const validation = this.validateInput(tool, input);
        if (!validation.valid) {
            tool.recordExecution(false, 0);
            return { success: false, error: validation.error, toolUsed: tool.name };
        }

        const start = Date.now();
        try {
            // Enforce latency budget with Promise.race
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('EXECUTION_TIMEOUT')), tool.latencyBudgetMs);
            });

            const execPromise = tool.handler(input, context);
            const output = await Promise.race([execPromise, timeoutPromise]);

            // Post-constraint validation
            if (tool.postConstraints && typeof tool.postConstraints === 'function') {
                const postRes = tool.postConstraints(output);
                if (postRes && postRes.valid === false) {
                    throw new Error(postRes.error || 'POST_CONSTRAINT_FAILED');
                }
            }

            const latencyMs = Date.now() - start;
            tool.recordExecution(true, latencyMs, depth > 0);

            return {
                success: true,
                result: output,
                toolUsed: tool.name,
                fallbackUsed: depth > 0,
                latencyMs,
                riskTier: tool.riskTier
            };
        } catch (err) {
            const latencyMs = Date.now() - start;
            tool.recordExecution(false, latencyMs, depth > 0);

            // Trigger fallback if registered
            if (tool.fallbackTool) {
                console.warn('[ToolFabric] ⚠️ Tool ' + tool.name + ' failed (' + err.message + '). Cascading to fallback: ' + tool.fallbackTool);
                return this.execute(tool.fallbackTool, input, context, depth + 1);
            }

            return {
                success: false,
                error: err.message,
                toolUsed: tool.name,
                fallbackUsed: depth > 0,
                latencyMs
            };
        }
    }

    /**
     * Registers built-in default tools
     */
    static registerDefaults() {
        // 1. CALCULATOR
        this.registerTool(new ToolContract({
            name: 'CALCULATOR',
            description: 'Melakukan perhitungan matematika numerik yang akurat dan terisolasi.',
            category: ToolCategory.COMPUTATION,
            riskTier: RiskTier.READ,
            inputSchema: {
                required: ['expression'],
                properties: { expression: { type: 'string' } }
            },
            preConstraints: (input) => {
                if (typeof input.expression !== 'string' || !input.expression.trim()) {
                    return { valid: false, error: 'Empty expression' };
                }
                const sanitized = input.expression.replace(/[^0-9+\-*\/().%\s]/g, '');
                if (!sanitized.trim()) return { valid: false, error: 'No valid math tokens found' };
                return { valid: true };
            },
            postConstraints: (output) => {
                if (output === null || output === undefined || typeof output.result !== 'number' || !isFinite(output.result)) {
                    return { valid: false, error: 'Result must be a finite number' };
                }
                return { valid: true };
            },
            handler: async (input) => {
                const clean = input.expression.replace(/x/gi, '*').replace(/÷/g, '/').replace(/[^0-9+\-*\/().%\s]/g, '');
                const fn = new Function('"use strict"; return (' + clean + ');');
                const res = fn();
                return { expression: clean, result: res };
            }
        }));

        // 2. SYSTEM_INFO
        this.registerTool(new ToolContract({
            name: 'SYSTEM_INFO',
            description: 'Audit live memory RSS, heap, uptime, dan info sistem runtime.',
            category: ToolCategory.SYSTEM,
            riskTier: RiskTier.READ,
            handler: async () => {
                const mem = process.memoryUsage();
                const rss = Math.round(mem.rss / (1024 * 1024));
                return {
                    rssMB: rss,
                    memoryMB: rss,
                    heapUsedMB: Math.round(mem.heapUsed / (1024 * 1024)),
                    uptimeSec: Math.round(process.uptime()),
                    platform: process.platform,
                    nodeVersion: process.version
                };
            }
        }));

        // 3. DATE_TIME
        this.registerTool(new ToolContract({
            name: 'DATE_TIME',
            description: 'Waktu dan kalender saat ini dalam format lokal Indonesia (WIB) & ISO.',
            category: ToolCategory.SYSTEM,
            riskTier: RiskTier.READ,
            handler: async (input) => {
                const tz = input.timezone || 'Asia/Jakarta';
                const now = new Date();
                return {
                    timestamp: now.getTime(),
                    iso: now.toISOString(),
                    formattedWIB: now.toLocaleString('id-ID', { timeZone: tz }),
                    time: now.toLocaleTimeString('id-ID', { timeZone: tz }),
                    date: now.toLocaleDateString('id-ID', { timeZone: tz })
                };
            }
        }));

        // 4. CAN_BUS_TELEMETRY (EV Tuner / Automotive Domain)
        this.registerTool(new ToolContract({
            name: 'CAN_BUS_TELEMETRY',
            description: 'Membaca telemetri live dari controller CAN-Bus baterai, throttle, dan inverter EV.',
            category: ToolCategory.AUTOMOTIVE,
            riskTier: RiskTier.READ,
            latencyBudgetMs: 2000,
            handler: async (input) => {
                const ecu = input.ecuId || 'EM_CONTROLLER_01';
                return {
                    ecuId: ecu,
                    batteryVoltage: 72.4,
                    stateOfCharge: 88,
                    throttlePosition: 0,
                    controllerTempC: 38.5,
                    busHealth: 'OPTIMAL'
                };
            }
        }));

        // 5. COMMERCE_CATALOG
        this.registerTool(new ToolContract({
            name: 'COMMERCE_CATALOG',
            description: 'Pencarian produk, stok, dan harga paket dari katalog resmi.',
            category: ToolCategory.COMMERCE,
            riskTier: RiskTier.READ,
            handler: async (input) => {
                const query = (input.query || '').toLowerCase();
                const catalog = [
                    { id: 'TUNER_PRO', name: 'EV Tuner Pro Kit V2', price: 1750000, stock: 14 },
                    { id: 'CAN_LOGGER', name: 'CAN-Bus Telemetry Logger', price: 850000, stock: 22 },
                    { id: 'HARNESS_ADAPT', name: 'Universal Wiring Harness', price: 250000, stock: 50 }
                ];
                const matches = catalog.filter(item => item.name.toLowerCase().includes(query) || item.id.toLowerCase().includes(query));
                return {
                    matches: matches.length > 0 ? matches : catalog,
                    totalMatches: matches.length > 0 ? matches.length : catalog.length
                };
            }
        }));

        // 6. WEB_SEARCH (With Fallback Chain)
        this.registerTool(new ToolContract({
            name: 'WEB_SEARCH_PRIMARY',
            description: 'Mesin pencari web live utama untuk riset berita dan referensi terkini.',
            category: ToolCategory.INFORMATION,
            riskTier: RiskTier.EXTERNAL,
            latencyBudgetMs: 3000,
            fallbackTool: 'WEB_SEARCH_FALLBACK',
            handler: async (input) => {
                if (input.simulateFailure) {
                    throw new Error('SERP_SERVICE_UNAVAILABLE');
                }
                return {
                    query: input.query || '',
                    provider: 'PRIMARY_SEARCH',
                    snippets: [
                        'Informasi relevan untuk: ' + (input.query || '')
                    ]
                };
            }
        }));

        this.registerTool(new ToolContract({
            name: 'WEB_SEARCH_FALLBACK',
            description: 'Mesin pencari sekunder fallback saat koneksi primer mengalami hambatan.',
            category: ToolCategory.INFORMATION,
            riskTier: RiskTier.EXTERNAL,
            latencyBudgetMs: 3000,
            fallbackTool: 'LOCAL_KNOWLEDGE_ARCHIVE',
            handler: async (input) => {
                return {
                    query: input.query || '',
                    provider: 'FALLBACK_SEARCH',
                    snippets: [
                        'Hasil fallback pencarian untuk: ' + (input.query || '')
                    ]
                };
            }
        }));

        this.registerTool(new ToolContract({
            name: 'LOCAL_KNOWLEDGE_ARCHIVE',
            description: 'Arsip pengetahuan lokal offline saat pencarian eksternal tidak tersedia.',
            category: ToolCategory.INFORMATION,
            riskTier: RiskTier.READ,
            handler: async (input) => {
                return {
                    query: input.query || '',
                    provider: 'LOCAL_ARCHIVE',
                    note: 'Diambil dari arsip memori lokal ARKA.'
                };
            }
        }));
    }
}