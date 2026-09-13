// src/platform/policy/GranularPermissionPolicy.mjs
// ============================================================================
// SALIM AI OPERATING SYSTEM - GRANULAR PERMISSION & POLICY ENGINE
// Comprehensive RBAC: Roles, Granular Permissions, and Action Risk Tiers
// ============================================================================

export class GranularPermissionPolicy {
    static PERMISSIONS = {
        READ_CUSTOMER: 'READ_CUSTOMER',
        WRITE_CUSTOMER: 'WRITE_CUSTOMER',
        READ_PRODUCT: 'READ_PRODUCT',
        WRITE_PRODUCT: 'WRITE_PRODUCT',
        CHANGE_PRICE: 'CHANGE_PRICE',
        CREATE_ORDER: 'CREATE_ORDER',
        CANCEL_ORDER: 'CANCEL_ORDER',
        PROCESS_REFUND: 'PROCESS_REFUND',
        EXPORT_DATA: 'EXPORT_DATA',
        SYSTEM_ADMIN: 'SYSTEM_ADMIN'
    };

    static ROLES = {
        ADMIN: ['*'], // All permissions
        OPERATOR: [
            'READ_CUSTOMER', 'WRITE_CUSTOMER', 'READ_PRODUCT', 'CREATE_ORDER', 'CHECK_STATUS'
        ],
        AI_AGENT: [
            'READ_CUSTOMER', 'READ_PRODUCT', 'CREATE_ORDER' // AI has safe read & draft permissions
        ]
    };

    /**
     * Checks if a role has the required permission
     */
    static hasPermission(role, requiredPermission) {
        const perms = this.ROLES[role] || [];
        if (perms.includes('*')) return true;
        return perms.includes(requiredPermission);
    }

    /**
     * Evaluates permission and action safety level
     */
    static evaluate({ role = 'AI_AGENT', permission, payload = {} }) {
        // 1. Check basic permission
        const authorized = this.hasPermission(role, permission);
        if (!authorized) {
            // High-risk actions can be escalated to human approval
            const escalatableActions = ['CHANGE_PRICE', 'PROCESS_REFUND', 'CANCEL_ORDER', 'EXPORT_DATA'];
            if (escalatableActions.includes(permission)) {
                return {
                    status: 'REQUIRES_APPROVAL',
                    reason: `Role '${role}' tidak memiliki izin langsung untuk '${permission}'. Memerlukan otorisasi manusia.`,
                    requiresHuman: true
                };
            }

            return {
                status: 'FORBIDDEN',
                reason: `Role '${role}' dilarang mengakses permission '${permission}'.`,
                requiresHuman: false
            };
        }

        // 2. Value-based safety thresholds even if permitted
        if (permission === 'PROCESS_REFUND' && (payload.amount || 0) > 0) {
            return {
                status: 'REQUIRES_APPROVAL',
                reason: `Refund sebesar Rp ${(payload.amount || 0).toLocaleString('id-ID')} melampaui batas otomatis. Wajib persetujuan pemilik bisnis.`,
                requiresHuman: true
            };
        }

        return {
            status: 'ALLOWED',
            reason: `Izin '${permission}' diverifikasi dan diizinkan otomatis.`,
            requiresHuman: false
        };
    }
}
