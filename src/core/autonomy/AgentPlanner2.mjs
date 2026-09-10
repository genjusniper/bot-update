// src/core/autonomy/AgentPlanner2.mjs
// Phase 33: Agent Planner 2.0
// Features: Task Decomposition, Directed Acyclic Graph (DAG) Resolution,
// Checkpointing, State Resumption, Dynamic Replanning & Safety Gating.

import { ToolCapabilityFabric } from '../tools/ToolCapabilityFabric.mjs';

export const TaskState = Object.freeze({
    PENDING: 'PENDING',
    RUNNING: 'RUNNING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    BLOCKED: 'BLOCKED',
    SKIPPED: 'SKIPPED',
    WAITING_CONFIRMATION: 'WAITING_CONFIRMATION'
});

export const PlanStatus = Object.freeze({
    DRAFT: 'DRAFT',
    READY: 'READY',
    RUNNING: 'RUNNING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    PAUSED_FOR_CONFIRMATION: 'PAUSED_FOR_CONFIRMATION',
    CANCELLED: 'CANCELLED'
});

export const RiskLevel = Object.freeze({
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
});

export class TaskNode {
    /**
     * @param {Object} params
     * @param {string} params.id
     * @param {string} params.title
     * @param {string} [params.instruction]
     * @param {string} [params.tool]
     * @param {Object} [params.toolInput]
     * @param {string[]} [params.dependsOn]
     * @param {string} [params.riskLevel]
     * @param {number} [params.maxRetries]
     * @param {boolean} [params.reversibility]
     */
    constructor({
        id,
        title,
        instruction = '',
        tool = 'SYNTHESIS',
        toolInput = {},
        dependsOn = [],
        riskLevel = RiskLevel.LOW,
        maxRetries = 2,
        reversibility = true
    }) {
        this.id = id;
        this.title = title;
        this.instruction = instruction || title;
        this.tool = tool;
        this.toolInput = toolInput;
        this.dependsOn = Array.isArray(dependsOn) ? [...dependsOn] : [];
        this.riskLevel = riskLevel;
        this.state = TaskState.PENDING;
        this.result = null;
        this.error = null;
        this.retries = 0;
        this.maxRetries = maxRetries;
        this.reversibility = reversibility;
        this.startedAt = null;
        this.completedAt = null;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            instruction: this.instruction,
            tool: this.tool,
            toolInput: this.toolInput,
            dependsOn: this.dependsOn,
            riskLevel: this.riskLevel,
            state: this.state,
            result: this.result,
            error: this.error,
            retries: this.retries,
            reversibility: this.reversibility,
            startedAt: this.startedAt,
            completedAt: this.completedAt
        };
    }
}

export class PlanGraph {
    /**
     * @param {string} planId
     * @param {string} goal
     * @param {Object} [metadata]
     */
    constructor(planId, goal, metadata = {}) {
        this.planId = planId;
        this.goal = goal;
        this.metadata = metadata;
        this.nodes = new Map();
        this.status = PlanStatus.DRAFT;
        this.checkpoints = [];
        this.history = [];
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
    }

    addNode(node) {
        if (!(node instanceof TaskNode)) {
            node = new TaskNode(node);
        }
        this.nodes.set(node.id, node);
        this.updatedAt = Date.now();
        return this;
    }

    getNode(nodeId) {
        return this.nodes.get(nodeId);
    }

    getAllNodes() {
        return Array.from(this.nodes.values());
    }

    recordCheckpoint(stepId, state, result = null, error = null) {
        const cp = {
            timestamp: Date.now(),
            stepId,
            state,
            result,
            error
        };
        this.checkpoints.push(cp);
        this.updatedAt = Date.now();
        return cp;
    }

    logEvent(event, details = {}) {
        this.history.push({
            timestamp: Date.now(),
            event,
            details
        });
        this.updatedAt = Date.now();
    }

    /**
     * Checks if DAG has cycles using Kahn's algorithm
     * @returns {{ hasCycle: boolean, topoOrder: string[] }}
     */
    validateDAG() {
        const inDegree = new Map();
        const adj = new Map();

        for (const [id] of this.nodes) {
            inDegree.set(id, 0);
            adj.set(id, []);
        }

        for (const [id, node] of this.nodes) {
            for (const dep of node.dependsOn) {
                if (!this.nodes.has(dep)) {
                    return { hasCycle: true, error: 'Dependency ' + dep + ' not found in plan.', topoOrder: [] };
                }
                adj.get(dep).push(id);
                inDegree.set(id, (inDegree.get(id) || 0) + 1);
            }
        }

        const queue = [];
        for (const [id, deg] of inDegree.entries()) {
            if (deg === 0) queue.push(id);
        }

        const topoOrder = [];
        while (queue.length > 0) {
            const curr = queue.shift();
            topoOrder.push(curr);

            for (const neighbor of (adj.get(curr) || [])) {
                inDegree.set(neighbor, inDegree.get(neighbor) - 1);
                if (inDegree.get(neighbor) === 0) {
                    queue.push(neighbor);
                }
            }
        }

        const hasCycle = topoOrder.length !== this.nodes.size;
        return { hasCycle, topoOrder };
    }

    /**
     * Returns nodes ready to run (dependencies COMPLETED and state is PENDING)
     * @returns {TaskNode[]}
     */
    getExecutableNodes() {
        const ready = [];
        for (const node of this.nodes.values()) {
            if (node.state !== TaskState.PENDING) continue;

            const allDepsSatisfied = node.dependsOn.every(depId => {
                const depNode = this.nodes.get(depId);
                return depNode && depNode.state === TaskState.COMPLETED;
            });

            if (allDepsSatisfied) {
                ready.push(node);
            }
        }
        return ready;
    }

    getProgress() {
        const total = this.nodes.size;
        if (total === 0) return { total: 0, completed: 0, percent: 100 };
        const completed = Array.from(this.nodes.values()).filter(n => n.state === TaskState.COMPLETED).length;
        const percent = Math.round((completed / total) * 100);
        return { total, completed, percent };
    }

    toJSON() {
        return {
            planId: this.planId,
            goal: this.goal,
            status: this.status,
            metadata: this.metadata,
            nodes: Array.from(this.nodes.values()).map(n => n.toJSON()),
            progress: this.getProgress(),
            checkpointsCount: this.checkpoints.length,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

export class AgentPlanner2 {
    static #plans = new Map();
    static #maxCachedPlans = 50;

    /**
     * Decomposes a user prompt or complex objective into a structured PlanGraph
     * @param {string} goal
     * @param {Object} [options]
     * @param {string} [options.chatId]
     * @param {string} [options.initiatorRole='USER']
     * @returns {PlanGraph}
     */
    static decompose(goal = '', options = {}) {
        const planId = 'plan_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        const plan = new PlanGraph(planId, goal, options);

        if (!goal || typeof goal !== 'string') {
            return plan;
        }

        const lower = goal.toLowerCase().trim();

        // 1. Check for multi-step conjunctions
        const sequentialRegex = /\b(lalu|kemudian|terus|habis itu|setelah itu|dan juga|lalu hitung|kemudian cek)\b/i;
        const hasSequences = sequentialRegex.test(lower);

        if (hasSequences) {
            const rawParts = lower.split(sequentialRegex)
                .map(p => p.trim())
                .filter(p => p.length > 2 && !/^(lalu|kemudian|terus|habis itu|setelah itu|dan juga|lalu hitung|kemudian cek)$/i.test(p));

            let prevNodeId = null;

            rawParts.forEach((part, idx) => {
                const nodeId = 'step_' + (idx + 1);
                let tool = 'SYNTHESIS';
                let riskLevel = RiskLevel.LOW;

                if (/(hitung|kalkulasi|\d+\s*[*+\/-]\s*\d+)/i.test(part)) {
                    tool = 'CALCULATOR';
                } else if (/(spek|memory|ram|cpu|sistem|status)/i.test(part)) {
                    tool = 'SYSTEM_INFO';
                } else if (/(jam|waktu|tanggal)/i.test(part)) {
                    tool = 'DATE_TIME';
                } else if (/(cari|search|googling|berita)/i.test(part)) {
                    tool = 'WEB_SEARCH';
                } else if (/(restart|reboot|shutdown|kill|hapus|delete|format)/i.test(part)) {
                    tool = 'SYSTEM_CONTROL';
                    riskLevel = RiskLevel.HIGH;
                }

                const dependsOn = prevNodeId ? [prevNodeId] : [];

                const node = new TaskNode({
                    id: nodeId,
                    title: part.slice(0, 40),
                    instruction: part,
                    tool,
                    dependsOn,
                    riskLevel,
                    reversibility: riskLevel !== RiskLevel.HIGH
                });

                plan.addNode(node);
                prevNodeId = nodeId;
            });
        } else {
            // Check for parallel compound intents
            const parallelAndRegex = /\b(dan|sambil|sekaligus)\b/i;
            if (parallelAndRegex.test(lower) && !hasSequences) {
                const subParts = lower.split(parallelAndRegex)
                    .map(p => p.trim())
                    .filter(p => p.length > 2 && !/^(dan|sambil|sekaligus)$/i.test(p));

                if (subParts.length > 1) {
                    const parallelNodeIds = [];
                    subParts.forEach((part, idx) => {
                        const nodeId = 'parallel_' + (idx + 1);
                        let tool = 'SYNTHESIS';
                        if (/(hitung|kalkulasi)/i.test(part)) tool = 'CALCULATOR';
                        else if (/(spek|memory|ram|cpu|sistem)/i.test(part)) tool = 'SYSTEM_INFO';
                        else if (/(jam|waktu|tanggal)/i.test(part)) tool = 'DATE_TIME';
                        else if (/(cari|search)/i.test(part)) tool = 'WEB_SEARCH';

                        const node = new TaskNode({
                            id: nodeId,
                            title: part.slice(0, 40),
                            instruction: part,
                            tool,
                            dependsOn: [],
                            riskLevel: RiskLevel.LOW
                        });
                        plan.addNode(node);
                        parallelNodeIds.push(nodeId);
                    });

                    plan.addNode(new TaskNode({
                        id: 'synthesis_final',
                        title: 'Sintesis Hasil',
                        instruction: 'Gabungkan seluruh temuan',
                        tool: 'SYNTHESIS',
                        dependsOn: parallelNodeIds,
                        riskLevel: RiskLevel.LOW
                    }));
                } else {
                    this.#createSingleNode(plan, goal, lower);
                }
            } else {
                this.#createSingleNode(plan, goal, lower);
            }
        }

        plan.status = PlanStatus.READY;
        this.#cachePlan(plan);
        return plan;
    }

    static #createSingleNode(plan, goal, lower) {
        let tool = 'SYNTHESIS';
        let riskLevel = RiskLevel.LOW;
        if (/(hitung|kalkulasi|\d+\s*[*+\/-]\s*\d+)/i.test(lower)) tool = 'CALCULATOR';
        else if (/(spek|memory|ram|cpu|sistem|status)/i.test(lower)) tool = 'SYSTEM_INFO';
        else if (/(jam|waktu|tanggal)/i.test(lower)) tool = 'DATE_TIME';
        else if (/(cari|search)/i.test(lower)) tool = 'WEB_SEARCH';
        else if (/(restart|reboot|shutdown|kill|hapus|delete)/i.test(lower)) {
            tool = 'SYSTEM_CONTROL';
            riskLevel = RiskLevel.HIGH;
        }

        plan.addNode(new TaskNode({
            id: 'step_1',
            title: goal.slice(0, 50),
            instruction: goal,
            tool,
            dependsOn: [],
            riskLevel
        }));
    }

    /**
     * Executes or drives the plan DAG to completion or checkpoint
     * @param {string|PlanGraph} planOrId
     * @param {Object} [context]
     * @param {Function} [customExecutor]
     * @returns {Promise<Object>}
     */
    static async execute(planOrId, context = {}, customExecutor = null) {
        const plan = typeof planOrId === 'string' ? this.getPlan(planOrId) : planOrId;
        if (!plan) {
            return { success: false, reason: 'PLAN_NOT_FOUND' };
        }
        this.#cachePlan(plan);

        // Validate DAG integrity first
        const validation = plan.validateDAG();
        if (validation.hasCycle) {
            plan.status = PlanStatus.FAILED;
            return { success: false, reason: 'CYCLE_DETECTED', details: validation.error };
        }

        plan.status = PlanStatus.RUNNING;
        plan.logEvent('EXECUTION_STARTED', { context });

        let executionHalted = false;
        let iteration = 0;
        const maxIterations = 20;

        while (!executionHalted && iteration < maxIterations) {
            iteration++;
            const executableNodes = plan.getExecutableNodes();

            if (executableNodes.length === 0) {
                const allNodes = plan.getAllNodes();
                const anyFailed = allNodes.some(n => n.state === TaskState.FAILED);
                const anyBlocked = allNodes.some(n => n.state === TaskState.BLOCKED || n.state === TaskState.WAITING_CONFIRMATION);
                const allDone = allNodes.every(n => n.state === TaskState.COMPLETED || n.state === TaskState.SKIPPED);

                if (allDone) {
                    plan.status = PlanStatus.COMPLETED;
                    plan.logEvent('EXECUTION_COMPLETED');
                } else if (anyBlocked) {
                    plan.status = PlanStatus.PAUSED_FOR_CONFIRMATION;
                    plan.logEvent('EXECUTION_PAUSED_FOR_AUTH');
                } else if (anyFailed) {
                    plan.status = PlanStatus.FAILED;
                    plan.logEvent('EXECUTION_FAILED');
                }
                break;
            }

            // Execute executable nodes in batch
            for (const node of executableNodes) {
                if ((node.riskLevel === RiskLevel.HIGH || node.riskLevel === RiskLevel.CRITICAL) && !context.authorized) {
                    node.state = TaskState.WAITING_CONFIRMATION;
                    plan.recordCheckpoint(node.id, TaskState.WAITING_CONFIRMATION);
                    executionHalted = true;
                    plan.status = PlanStatus.PAUSED_FOR_CONFIRMATION;
                    break;
                }

                node.state = TaskState.RUNNING;
                node.startedAt = Date.now();

                try {
                    let output = null;
                    if (customExecutor && typeof customExecutor === 'function') {
                        output = await customExecutor(node, plan, context);
                    } else {
                        output = await this.#defaultExecuteNode(node, plan);
                    }

                    node.result = output;
                    node.state = TaskState.COMPLETED;
                    node.completedAt = Date.now();
                    plan.recordCheckpoint(node.id, TaskState.COMPLETED, output);
                } catch (err) {
                    node.error = err.message;
                    node.retries++;

                    if (node.retries <= node.maxRetries) {
                        node.state = TaskState.PENDING;
                        plan.recordCheckpoint(node.id, 'RETRYING', null, err.message);
                    } else {
                        node.state = TaskState.FAILED;
                        node.completedAt = Date.now();
                        plan.recordCheckpoint(node.id, TaskState.FAILED, null, err.message);
                        executionHalted = true;
                    }
                }
            }
        }

        return {
            success: plan.status === PlanStatus.COMPLETED,
            planId: plan.planId,
            status: plan.status,
            progress: plan.getProgress(),
            plan: plan.toJSON()
        };
    }

    /**
     * Resumes execution of a paused or interrupted plan without re-running completed nodes
     * @param {string} planId
     * @param {Object} [context]
     * @param {Function} [customExecutor]
     * @returns {Promise<Object>}
     */
    static async resume(planId, context = {}, customExecutor = null) {
        const plan = this.getPlan(planId);
        if (!plan) return { success: false, reason: 'PLAN_NOT_FOUND' };

        plan.logEvent('RESUMED', { context });

        if (context.authorized) {
            for (const node of plan.getAllNodes()) {
                if (node.state === TaskState.WAITING_CONFIRMATION || node.state === TaskState.BLOCKED) {
                    node.state = TaskState.PENDING;
                }
            }
        }

        return this.execute(plan, context, customExecutor);
    }

    /**
     * Dynamic replanning on failure: substitutes tool, injects compensation, or aborts
     * @param {string} planId
     * @param {string} failedNodeId
     * @param {string} strategy - 'RETRY' | 'ALTERNATIVE_TOOL' | 'ASK_USER' | 'ABORT'
     * @param {Object} [strategyDetails]
     * @returns {PlanGraph}
     */
    static replan(planId, failedNodeId, strategy = 'ALTERNATIVE_TOOL', strategyDetails = {}) {
        const plan = this.getPlan(planId);
        if (!plan) return null;

        const failedNode = plan.getNode(failedNodeId);
        if (!failedNode) return plan;

        plan.logEvent('REPLAN_TRIGGERED', { failedNodeId, strategy, strategyDetails });

        switch (strategy) {
            case 'ALTERNATIVE_TOOL': {
                failedNode.tool = strategyDetails.newTool || 'SYNTHESIS';
                failedNode.state = TaskState.PENDING;
                failedNode.error = null;
                plan.status = PlanStatus.READY;
                break;
            }

            case 'RETRY': {
                failedNode.retries = 0;
                failedNode.state = TaskState.PENDING;
                failedNode.error = null;
                plan.status = PlanStatus.READY;
                break;
            }

            case 'ASK_USER': {
                failedNode.state = TaskState.WAITING_CONFIRMATION;
                plan.status = PlanStatus.PAUSED_FOR_CONFIRMATION;
                break;
            }

            case 'ABORT': {
                failedNode.state = TaskState.FAILED;
                for (const node of plan.getAllNodes()) {
                    if (node.dependsOn.includes(failedNodeId) && node.state === TaskState.PENDING) {
                        node.state = TaskState.SKIPPED;
                    }
                }
                plan.status = PlanStatus.FAILED;
                break;
            }
        }

        return plan;
    }

    static async #defaultExecuteNode(node, plan) {
        switch (node.tool) {
            case 'CALCULATOR': {
                const exprMatch = node.instruction.match(/([\d.]+\s*[*+\/-]\s*[\d.]+)/);
                if (exprMatch) {
                    try {
                        const sanitized = exprMatch[1].replace(/[^0-9+\-*\/.]/g, '');
                        const fn = new Function('return (' + sanitized + ');');
                        return { calculation: sanitized, result: fn() };
                    } catch {
                        return { calculation: exprMatch[1], result: 'ERR' };
                    }
                }
                return { result: 'EVALUATED' };
            }

            case 'SYSTEM_INFO': {
                return {
                    memoryMB: Math.round(process.memoryUsage().rss / (1024 * 1024)),
                    uptimeSec: Math.round(process.uptime()),
                    platform: process.platform
                };
            }

            case 'DATE_TIME': {
                return {
                    iso: new Date().toISOString(),
                    wib: new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })
                };
            }

            case 'SYNTHESIS':
            default: {
                const depResults = node.dependsOn.map(dId => {
                    const dNode = plan.getNode(dId);
                    return dNode ? { from: dId, res: dNode.result } : null;
                }).filter(Boolean);

                return {
                    synthesizedInstruction: node.instruction,
                    inputsReceived: depResults.length,
                    status: 'RESOLVED'
                };
            }
        }
    }

    /**
     * Formats the plan into an attractive, WhatsApp-friendly status card
     * @param {PlanGraph} plan
     * @returns {string}
     */
    static formatPlanCard(plan) {
        if (!plan) return '📋 *Tidak ada rencana aktif.*';

        const { total, completed, percent } = plan.getProgress();
        let card = '🎯 *AGENT PLAN: ' + plan.goal.slice(0, 45) + '*\n';
        card += '────────────────────\n';
        card += 'Status: *' + plan.status + '* (' + completed + '/' + total + ' Selesai — ' + percent + '%)\n\n';

        const nodes = plan.getAllNodes();
        nodes.forEach((n, idx) => {
            const isLast = idx === nodes.length - 1;
            const branch = isLast ? '└─' : '├─';

            let icon = '⏳';
            if (n.state === TaskState.COMPLETED) icon = '✅';
            else if (n.state === TaskState.RUNNING) icon = '🔄';
            else if (n.state === TaskState.FAILED) icon = '❌';
            else if (n.state === TaskState.BLOCKED || n.state === TaskState.WAITING_CONFIRMATION) icon = '🛑';
            else if (n.state === TaskState.SKIPPED) icon = '⏭️';

            card += branch + ' [' + icon + '] ' + n.title + ' (' + n.tool + ')\n';
            if (n.error) {
                card += '    ⚠️ Err: ' + n.error + '\n';
            }
        });

        if (plan.status === PlanStatus.PAUSED_FOR_CONFIRMATION) {
            card += '\n⚠️ *Perhatian:* Ada langkah berisiko yang memerlukan konfirmasi kamu.';
        }

        return card;
    }

    static #cachePlan(plan) {
        if (this.#plans.size >= this.#maxCachedPlans) {
            const oldestKey = this.#plans.keys().next().value;
            this.#plans.delete(oldestKey);
        }
        this.#plans.set(plan.planId, plan);
    }

    static getPlan(planId) {
        return this.#plans.get(planId) || null;
    }

    static clear() {
        this.#plans.clear();
    }
}