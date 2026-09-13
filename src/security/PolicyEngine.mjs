/**
 * PolicyEngine.mjs
 * 
 * Deterministic authorization engine decoupled from LLM prompt.
 * 
 * Separation of Duties:
 * AI: "According to my reasoning, execute action X."
 * Policy Engine: "Is action X permitted for this actor under current constraints?"
 * Execution Engine: "Execute action X safely."
 */

export class PolicyEngine {
    static ROLES = {
        OWNER: 'OWNER',
        ADMIN: 'ADMIN',
        OPERATOR: 'OPERATOR',
        AI_RESEARCHER: 'AI_RESEARCHER',
        AI_ANALYST: 'AI_ANALYST',
        AI_OPERATOR: 'AI_OPERATOR'
    };

    static PERMISSION_MATRIX = {
        // AI_RESEARCHER: Read & Search Only
        [this.ROLES.AI_RESEARCHER]: {
            allowedPrefixes: ['research.', 'search.', 'catalog.read', 'inventory.read', 'analytics.read'],
            forbiddenPrefixes: ['product.change', 'payment.', 'message.broadcast', 'order.create']
        },
        // AI_ANALYST: Read & Analyze Only
        [this.ROLES.AI_ANALYST]: {
            allowedPrefixes: ['analytics.', 'crm.read', 'inventory.read', 'catalog.read'],
            forbiddenPrefixes: ['product.changePrice', 'payment.processRefund', 'database.delete']
        },
        // AI_OPERATOR: Read, Draft, Low-risk Actions
        [this.ROLES.AI_OPERATOR]: {
            allowedPrefixes: ['order.createDraft', 'inventory.checkStock', 'crm.findInactiveCustomers'],
            requiresApprovalPrefixes: ['product.changePrice', 'payment.processRefund', 'message.broadcast']
        },
        // OWNER: Full Access
        [this.ROLES.OWNER]: {
            allowedPrefixes: ['*'],
            forbiddenPrefixes: []
        }
    };

    /**
     * Evaluate whether actor role can execute action
     */
    static checkPermission({ actorRole, actionName, parameters = {} }) {
        const matrix = this.PERMISSION_MATRIX[actorRole];
        if (!matrix) {
            return { allowed: false, reason: `UNREGISTERED_ROLE: Role "${actorRole}" is not defined in policy.` };
        }

        // Owner wildcard
        if (matrix.allowedPrefixes.includes('*')) {
            return { allowed: true, requiresApproval: false, reason: 'Owner unrestricted authority.' };
        }

        // Check explicit forbidden
        if (matrix.forbiddenPrefixes && matrix.forbiddenPrefixes.some(p => actionName.startsWith(p))) {
            return {
                allowed: false,
                reason: `POLICY_VIOLATION: Role "${actorRole}" is strictly prohibited from invoking "${actionName}".`
            };
        }

        // Check if approval required
        if (matrix.requiresApprovalPrefixes && matrix.requiresApprovalPrefixes.some(p => actionName.startsWith(p))) {
            return {
                allowed: true,
                requiresApproval: true,
                reason: `APPROVAL_REQUIRED: Action "${actionName}" requires human sign-off for role "${actorRole}".`
            };
        }

        // Check if allowed
        const isAllowed = matrix.allowedPrefixes.some(p => actionName.startsWith(p));
        if (isAllowed) {
            return { allowed: true, requiresApproval: false, reason: 'Allowed under least privilege policy.' };
        }

        return {
            allowed: false,
            reason: `UNAUTHORIZED_ACTION: Action "${actionName}" is not in role "${actorRole}" allowlist.`
        };
    }
}
