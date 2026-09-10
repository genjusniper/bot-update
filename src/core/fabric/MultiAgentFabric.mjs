// src/core/fabric/MultiAgentFabric.mjs
// Multi-Agent Collaboration Fabric
// Orchestrates multi-agent teams (Coordinator, Researcher, Coder, Critic, DevOps) with shared blackboard and consensus synthesis

export const AgentRole = Object.freeze({
    COORDINATOR: 'COORDINATOR',
    RESEARCHER: 'RESEARCHER',
    CODER: 'CODER',
    CRITIC: 'CRITIC',
    DEVOPS: 'DEVOPS'
});

export class AgentBlackboard {
    constructor() {
        this.entries = new Map(); // key -> { value, authorRole, timestamp }
        this.history = [];        // array of audit records
    }

    set(key, value, authorRole = AgentRole.COORDINATOR) {
        const record = {
            key,
            value,
            authorRole,
            timestamp: Date.now()
        };
        this.entries.set(key, record);
        this.history.push(record);
        return record;
    }

    get(key) {
        return this.entries.get(key)?.value || null;
    }

    getAll() {
        const snapshot = {};
        for (const [k, v] of this.entries) {
            snapshot[k] = v.value;
        }
        return snapshot;
    }

    clear() {
        this.entries.clear();
        this.history = [];
    }
}

export class MultiAgentFabric {
    constructor(options = {}) {
        this.blackboard = options.blackboard || new AgentBlackboard();
        this.maxConcurrentAgents = options.maxConcurrentAgents || 5;
        this.activeSessions = new Map();
    }

    /**
     * Registers or runs a task for a specialist agent
     * @param {string} role 
     * @param {Function} handler async function(taskInput, blackboard)
     */
    createSpecialist(role, handler) {
        return {
            role,
            execute: async (taskInput, blackboard) => {
                const startTime = Date.now();
                try {
                    const result = await handler(taskInput, blackboard);
                    return {
                        role,
                        success: true,
                        result,
                        durationMs: Date.now() - startTime
                    };
                } catch (error) {
                    return {
                        role,
                        success: false,
                        error: error.message,
                        durationMs: Date.now() - startTime
                    };
                }
            }
        };
    }

    /**
     * Dispatches multi-agent collaboration with a team of specialists
     * @param {Object} param
     * @param {string} param.objective
     * @param {Array<Object>} param.specialists Array of specialist objects
     * @param {Object} [param.initialContext={}]
     * @returns {Promise<Object>} Synthesis output and agent audit trail
     */
    async dispatchCollaboration({ objective, specialists = [], initialContext = {} }) {
        if (!objective) throw new Error('Collaboration requires an objective');

        const sessionId = `collab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const sessionBoard = new AgentBlackboard();
        
        // Seed initial context into blackboard
        sessionBoard.set('objective', objective, AgentRole.COORDINATOR);
        for (const [k, v] of Object.entries(initialContext)) {
            sessionBoard.set(k, v, AgentRole.COORDINATOR);
        }

        const session = {
            id: sessionId,
            objective,
            status: 'RUNNING',
            startTime: Date.now(),
            agentOutputs: []
        };
        this.activeSessions.set(sessionId, session);

        try {
            // Execute specialists in parallel or sequential pipeline
            const executions = specialists.map(s => s.execute({ objective, ...initialContext }, sessionBoard));
            const results = await Promise.all(executions);

            session.agentOutputs = results;
            session.status = 'SYNTHESIZING';

            // Coordinator synthesis
            const successfulResults = results.filter(r => r.success);
            const criticResult = results.find(r => r.role === AgentRole.CRITIC && r.success);

            let approved = true;
            let critique = null;
            if (criticResult && criticResult.result) {
                approved = criticResult.result.approved !== false;
                critique = criticResult.result.critique || null;
            }

            const synthesis = {
                sessionId,
                objective,
                status: 'COMPLETED',
                approved,
                critique,
                teamSize: specialists.length,
                blackboardSnapshot: sessionBoard.getAll(),
                outputs: successfulResults.map(r => ({ role: r.role, result: r.result })),
                failedCount: results.length - successfulResults.length,
                durationMs: Date.now() - session.startTime
            };

            session.status = 'COMPLETED';
            return synthesis;
        } catch (error) {
            session.status = 'FAILED';
            session.error = error.message;
            throw error;
        }
    }
}

export const multiAgentFabric = new MultiAgentFabric();
