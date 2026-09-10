// src/core/fabric/AutonomousPlanningLoop.mjs
// Goal -> Understand -> Plan -> Check Auth/Risk -> Tools -> Observe -> Verify -> Update Graph -> Learn

import { ToolExecutor } from '../tools/ToolExecutor.mjs';
import { AgentPlanner2, PlanStatus, RiskLevel } from '../autonomy/AgentPlanner2.mjs';

export class AutonomousPlanningLoop {
    /**
     * Executes an autonomous planning and tool dispatch cycle
     * @param {Object} params
     * @param {string} params.goal
     * @param {string} [params.initiatorTier='STRANGER']
     * @param {string[]} [params.steps=[]]
     * @param {boolean} [params.authorized=false]
     * @returns {Promise<Object>} Execution Outcome
     */
    static async executeGoal({ goal = '', initiatorTier = 'STRANGER', steps = [], authorized = false }) {
        if (!goal) return { success: false, reason: 'EMPTY_GOAL' };

        const isOwner = initiatorTier === 'OWNER' || authorized === true;

        // 1. Permission & Risk Gate
        const isDestructive = /format|wipe|delete|drop|shutdown|kill/i.test(goal);
        if (isDestructive && !isOwner) {
            return {
                success: false,
                blockedByRisk: true,
                reason: 'DESTRUCTIVE_ACTION_REQUIRES_EXPLICIT_OWNER_AUTHORITY'
            };
        }

        // 2. Generate PlanGraph via AgentPlanner2
        const plan = AgentPlanner2.decompose(goal, { initiatorTier });
        
        // Execute via AgentPlanner2
        const execRes = await AgentPlanner2.execute(plan, { authorized: isOwner }, async (node) => {
            if (node.tool === 'CALCULATOR') {
                const calcRes = ToolExecutor.execute('CALCULATOR', { expression: node.instruction });
                return calcRes.result;
            } else if (node.tool === 'DATE_TIME') {
                const dtRes = ToolExecutor.execute('DATE_TIME');
                return dtRes.formattedWIB;
            } else if (node.tool === 'SYSTEM_INFO') {
                const sysRes = ToolExecutor.execute('SYSTEM_INFO');
                return `Heap: ${sysRes.heapUsedMB}MB`;
            }
            return 'EXECUTED_LOGICAL_STEP';
        });

        const allNodes = plan.getAllNodes();
        const stepResults = allNodes.map((n, idx) => ({
            stepNumber: idx + 1,
            instruction: n.instruction,
            toolUsed: n.tool,
            output: n.result,
            status: n.state
        }));

        return {
            success: execRes.success,
            goal,
            planId: plan.planId,
            planStatus: plan.status,
            stepCount: stepResults.length,
            stepResults,
            card: AgentPlanner2.formatPlanCard(plan)
        };
    }
}
