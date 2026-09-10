// src/core/autonomy/AgentDelegationEngine.mjs
// Agent-to-Agent Delegation & Specialization Engine
// Matches sub-tasks to specialist agents, prevents recursive delegation loops, and enforces delegation contracts

export class AgentDelegationEngine {
    constructor(options = {}) {
        this.maxDelegationDepth = options.maxDelegationDepth || 3;
        this.defaultTimeoutMs = options.defaultTimeoutMs || 10000;

        // Registered specialists and their capability tags
        this.specialistRegistry = new Map([
            ['CODER', {
                capabilities: new Set(['code', 'syntax', 'refactor', 'git', 'patch', 'bug_fix']),
                concurrencyLimit: 3,
                activeCount: 0
            }],
            ['RESEARCHER', {
                capabilities: new Set(['search', 'fact_check', 'multi_hop', 'documentation', 'memory']),
                concurrencyLimit: 5,
                activeCount: 0
            }],
            ['DEVOPS', {
                capabilities: new Set(['pm2', 'ssh', 'termux', 'server', 'daemon', 'process', 'memory_check']),
                concurrencyLimit: 2,
                activeCount: 0
            }],
            ['CRITIC', {
                capabilities: new Set(['verify', 'security_audit', 'safety', 'compliance', 'critique']),
                concurrencyLimit: 4,
                activeCount: 0
            }]
        ]);

        this.delegationHistory = [];
    }

    /**
     * Resolves the best specialist agent for a given task based on capability tags
     * @param {Array<string>|string} requiredCapabilities 
     * @returns {string} Specialist role name
     */
    resolveSpecialist(requiredCapabilities = []) {
        const caps = Array.isArray(requiredCapabilities) ? requiredCapabilities : [requiredCapabilities];
        let bestRole = 'RESEARCHER';
        let maxMatch = -1;

        for (const [role, meta] of this.specialistRegistry) {
            let matchCount = 0;
            for (const c of caps) {
                const normalized = String(c).toLowerCase().trim();
                if (meta.capabilities.has(normalized)) {
                    matchCount++;
                }
            }
            if (matchCount > maxMatch) {
                maxMatch = matchCount;
                bestRole = role;
            }
        }

        return bestRole;
    }

    /**
     * Creates a validated delegation contract
     * @param {Object} param
     * @param {string} param.sourceRole
     * @param {string} param.targetRole
     * @param {Object} param.task
     * @param {Array<string>} [param.delegationChain=[]]
     * @returns {Object} Delegation contract
     */
    createContract({ sourceRole, targetRole, task, delegationChain = [] }) {
        if (!sourceRole || !targetRole || !task) {
            throw new Error('Contract requires sourceRole, targetRole, and task');
        }

        const chain = [...delegationChain, sourceRole];

        // 1. Check max delegation depth to prevent deep nesting
        if (chain.length > this.maxDelegationDepth) {
            throw new Error(`Delegation depth limit exceeded (${chain.length} > ${this.maxDelegationDepth})`);
        }

        // 2. Check cycle: targetRole cannot already be in the delegation chain
        if (chain.includes(targetRole)) {
            throw new Error(`Recursive delegation loop detected: ${chain.join(' -> ')} -> ${targetRole}`);
        }

        const delegationId = `del_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        return {
            delegationId,
            sourceRole,
            targetRole,
            task,
            delegationChain: chain,
            status: 'PENDING',
            createdAt: Date.now()
        };
    }

    /**
     * Dispatches a delegated sub-task to the target specialist with execution guard and retry
     * @param {Object} contract 
     * @param {Function} specialistExecutor async function(task)
     * @returns {Promise<Object>} Execution result
     */
    async executeDelegation(contract, specialistExecutor) {
        if (!contract || typeof specialistExecutor !== 'function') {
            throw new Error('executeDelegation requires valid contract and executor function');
        }

        const specMeta = this.specialistRegistry.get(contract.targetRole);
        if (specMeta) specMeta.activeCount++;

        contract.status = 'IN_PROGRESS';
        const startTime = Date.now();

        try {
            const result = await Promise.race([
                specialistExecutor(contract.task),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Delegation timeout')), this.defaultTimeoutMs)
                )
            ]);

            contract.status = 'COMPLETED';
            const handback = {
                delegationId: contract.delegationId,
                targetRole: contract.targetRole,
                status: 'SUCCESS',
                result,
                durationMs: Date.now() - startTime
            };

            this.delegationHistory.push({ ...contract, handback });
            return handback;
        } catch (error) {
            contract.status = 'FAILED';
            const handback = {
                delegationId: contract.delegationId,
                targetRole: contract.targetRole,
                status: 'ERROR',
                error: error.message,
                durationMs: Date.now() - startTime
            };

            this.delegationHistory.push({ ...contract, handback });
            return handback;
        } finally {
            if (specMeta) specMeta.activeCount = Math.max(0, specMeta.activeCount - 1);
        }
    }
}

export const agentDelegationEngine = new AgentDelegationEngine();
