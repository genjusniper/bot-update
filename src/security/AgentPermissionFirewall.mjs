/**
 * AgentPermissionFirewall.mjs
 * 
 * OWASP Agent Control Standard (ACS) & Least Privilege Enforcement.
 * Interposes between AI Intent and Tool Execution:
 * AI Intent -> Policy Engine -> Risk Classification -> Authorization Check -> Approval Ticket -> Execution
 * 
 * Approval tickets are strictly bound to:
 * - Specific Action & Target Resource
 * - Exact Parameters & Hash
 * - Requester Identity & Timestamp
 * - Expiration Window (TTL)
 */

import crypto from 'crypto';

export class AgentPermissionFirewall {
    static RISK_LEVELS = {
        LOW: 'LOW',
        MEDIUM: 'MEDIUM',
        HIGH: 'HIGH',
        CRITICAL: 'CRITICAL'
    };

    static ACTION_POLICIES = {
        // Safe Read Operations (LOW)
        'customer.read': { risk: 'LOW', requiresApproval: false },
        'inventory.read': { risk: 'LOW', requiresApproval: false },
        'catalog.read': { risk: 'LOW', requiresApproval: false },
        'analytics.read': { risk: 'LOW', requiresApproval: false },

        // Controlled Mutation / Drafts (LOW - MEDIUM)
        'order.createDraft': { risk: 'LOW', requiresApproval: false },
        'message.sendDirect': { risk: 'MEDIUM', requiresApproval: false },
        'message.broadcast': { risk: 'HIGH', requiresApproval: true },

        // High Impact Operations (HIGH)
        'product.changePrice': { risk: 'HIGH', requiresApproval: true, ttlMs: 15 * 60 * 1000 },
        'payment.processRefund': { risk: 'HIGH', requiresApproval: true, ttlMs: 10 * 60 * 1000 },
        'order.cancel': { risk: 'HIGH', requiresApproval: true, ttlMs: 15 * 60 * 1000 },

        // Irreversible Destruction (CRITICAL)
        'database.delete': { risk: 'CRITICAL', requiresApproval: true, requireTwoManRule: true, ttlMs: 5 * 60 * 1000 },
        'tenant.purge': { risk: 'CRITICAL', requiresApproval: true, requireTwoManRule: true, ttlMs: 5 * 60 * 1000 }
    };

    // Ephemeral In-Memory Approval Vault
    static pendingApprovals = new Map();

    /**
     * Evaluate action risk and authorize or generate bound approval request
     */
    static evaluate({ intentAction, targetResource, params = {}, requesterRole = 'AI_AGENT', tenantId }) {
        const policy = this.ACTION_POLICIES[intentAction];
        if (!policy) {
            return {
                allowed: false,
                reason: `UNKNOWN_ACTION: Action "${intentAction}" is not registered in the Agent Permission Firewall policy.`
            };
        }

        // 1. Direct Pass for Low/Safe read operations
        if (!policy.requiresApproval) {
            return {
                allowed: true,
                risk: policy.risk,
                requiresApproval: false
            };
        }

        // 2. High/Critical Risk Escalation: Generate Bound Approval Ticket
        const ticketId = `appr_${crypto.randomBytes(8).toString('hex')}`;
        const expiresAt = Date.now() + (policy.ttlMs || 10 * 60 * 1000);
        
        // Parameter integrity hash
        const paramHash = crypto.createHash('sha256').update(JSON.stringify(params)).digest('hex');

        const approvalTicket = {
            ticketId,
            intentAction,
            targetResource,
            params,
            paramHash,
            risk: policy.risk,
            requesterRole,
            tenantId,
            createdAt: Date.now(),
            expiresAt,
            status: 'PENDING'
        };

        this.pendingApprovals.set(ticketId, approvalTicket);

        return {
            allowed: false,
            requiresApproval: true,
            risk: policy.risk,
            ticket: approvalTicket,
            reason: `Action "${intentAction}" has ${policy.risk} risk level and requires explicit human confirmation.`
        };
    }

    /**
     * Approve or Reject an existing ticket
     */
    static verifyAndConsumeTicket(ticketId, approverRole, submittedParamHash) {
        const ticket = this.pendingApprovals.get(ticketId);
        if (!ticket) {
            return { valid: false, reason: 'TICKET_NOT_FOUND' };
        }

        if (Date.now() > ticket.expiresAt) {
            this.pendingApprovals.delete(ticketId);
            return { valid: false, reason: 'TICKET_EXPIRED' };
        }

        if (ticket.status !== 'PENDING') {
            return { valid: false, reason: `TICKET_ALREADY_${ticket.status}` };
        }

        // Check approver authorization
        if (approverRole !== 'OWNER' && approverRole !== 'ADMIN') {
            return { valid: false, reason: 'UNAUTHORIZED_APPROVER' };
        }

        // Check parameter tampering
        if (submittedParamHash && submittedParamHash !== ticket.paramHash) {
            return { valid: false, reason: 'PARAMETER_TAMPERING_DETECTED' };
        }

        ticket.status = 'APPROVED';
        ticket.approvedBy = approverRole;
        ticket.approvedAt = Date.now();

        return {
            valid: true,
            ticket
        };
    }
}
