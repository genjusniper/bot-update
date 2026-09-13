// src/platform/policy/ActionPermissionEngine.mjs
// ============================================================================
// SALIM AI ENTERPRISE PLATFORM - ACTION PERMISSION & GOVERNANCE ENGINE
// Enforces least-privilege, risk thresholds, and human-in-the-loop approvals
// ============================================================================

export class ActionPermissionEngine {
    static pendingApprovals = new Map();
    static approvalIdCounter = 1;

    static PERMISSION_RULES = {
        // Safe Read Actions
        'READ_CATALOG': { level: 'PERMITTED', requiresApproval: false },
        'READ_FAQ': { level: 'PERMITTED', requiresApproval: false },
        'CHECK_ORDER_STATUS': { level: 'PERMITTED', requiresApproval: false },
        'SEND_CUSTOMER_MESSAGE': { level: 'PERMITTED', requiresApproval: false },

        // Moderate Operations
        'CREATE_ORDER_DRAFT': { level: 'PERMITTED', requiresApproval: false },
        'UPDATE_CUSTOMER_NOTE': { level: 'PERMITTED', requiresApproval: false },

        // High Risk Operations (Human-in-the-Loop required)
        'PROCESS_REFUND': {
            level: 'HIGH_RISK',
            requiresApproval: true,
            checkThreshold: (payload) => (payload?.amount || 0) > 0 // Any refund needs approval
        },
        'GIVE_DISCOUNT': {
            level: 'HIGH_RISK',
            requiresApproval: true,
            checkThreshold: (payload) => (payload?.discountPercent || 0) > 10 // > 10% requires human
        },
        'CANCEL_ORDER': {
            level: 'HIGH_RISK',
            requiresApproval: true,
            checkThreshold: () => true
        },
        'CHANGE_PRICE': {
            level: 'HIGH_RISK',
            requiresApproval: true,
            checkThreshold: () => true
        },

        // Forbidden Operations (Zero tolerance)
        'DELETE_CUSTOMER': { level: 'FORBIDDEN', requiresApproval: false },
        'MUTATE_SYSTEM_CONFIG': { level: 'FORBIDDEN', requiresApproval: false },
        'BYPASS_SECURITY': { level: 'FORBIDDEN', requiresApproval: false }
    };

    /**
     * Evaluates whether an action proposed by the AI can proceed
     */
    static evaluateAction({ tenantId, actionType, payload = {}, suggestedBy = 'AI_AGENT' }) {
        const rule = this.PERMISSION_RULES[actionType];

        // 1. Unknown action -> Default Deny
        if (!rule) {
            return {
                verdict: 'BLOCKED',
                reason: `Tindakan '${actionType}' tidak dikenal dalam kebijakan keamanan.`,
                requiresHuman: false
            };
        }

        // 2. Forbidden action -> Block immediately
        if (rule.level === 'FORBIDDEN') {
            return {
                verdict: 'BLOCKED',
                reason: `Tindakan '${actionType}' dilarang keras oleh sistem kebijakan enterprise.`,
                requiresHuman: false
            };
        }

        // 3. High Risk with Approval Check
        if (rule.requiresApproval && rule.checkThreshold(payload)) {
            const approvalId = `req_${Date.now()}_${this.approvalIdCounter++}`;
            const requestRecord = {
                approvalId,
                tenantId,
                actionType,
                payload,
                suggestedBy,
                status: 'PENDING_APPROVAL',
                requestedAt: new Date().toISOString()
            };

            this.pendingApprovals.set(approvalId, requestRecord);

            return {
                verdict: 'REQUIRES_APPROVAL',
                approvalId,
                reason: `Tindakan '${actionType}' bernilai tinggi/berisiko dan membutuhkan persetujuan manusia.`,
                requiresHuman: true,
                approvalCard: `⚠️ *PERSETUJUAN DIBUTUHKAN (HUMAN-IN-THE-LOOP)*\n` +
                              `ID: \`${approvalId}\`\n` +
                              `Aksi: *${actionType}*\n` +
                              `Detail: ${JSON.stringify(payload)}\n` +
                              `_Ketik \`!approve ${approvalId}\` untuk eksekusi, atau \`!reject ${approvalId}\` untuk batalkan._`
            };
        }

        // 4. Permitted
        return {
            verdict: 'PERMITTED',
            reason: `Tindakan '${actionType}' diizinkan otomatis sesuai kebijakan.`,
            requiresHuman: false
        };
    }

    /**
     * Approves a pending action
     */
    static approveAction(approvalId, approvedBy = 'OWNER') {
        const req = this.pendingApprovals.get(approvalId);
        if (!req) return { success: false, message: 'ID permintaan tidak ditemukan.' };

        req.status = 'APPROVED';
        req.approvedBy = approvedBy;
        req.decidedAt = new Date().toISOString();

        return {
            success: true,
            message: `✅ Permintaan *${approvalId}* (${req.actionType}) berhasil disetujui!`,
            record: req
        };
    }

    /**
     * Rejects a pending action
     */
    static rejectAction(approvalId, rejectedBy = 'OWNER') {
        const req = this.pendingApprovals.get(approvalId);
        if (!req) return { success: false, message: 'ID permintaan tidak ditemukan.' };

        req.status = 'REJECTED';
        req.rejectedBy = rejectedBy;
        req.decidedAt = new Date().toISOString();

        return {
            success: true,
            message: `🛑 Permintaan *${approvalId}* (${req.actionType}) telah ditolak.`,
            record: req
        };
    }
}
