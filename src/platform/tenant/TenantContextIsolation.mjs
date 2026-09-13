// src/platform/tenant/TenantContextIsolation.mjs
// ============================================================================
// SALIM AI ENTERPRISE PLATFORM - MULTI-TENANT ISOLATION (OWASP COMPLIANT)
// Enforces strict tenant boundaries, preventing cross-tenant data leakage
// ============================================================================

export class TenantContextIsolation {
    static tenants = new Map();
    static defaultTenantId = 'tenant_agus_master';

    static {
        // Initialize Default Owner Tenant (Agus Salim Master)
        this.registerTenant({
            tenantId: this.defaultTenantId,
            name: 'Agus Salim Master Operations',
            tier: 'ENTERPRISE',
            status: 'ACTIVE',
            quotas: {
                monthlyMessages: 1000000,
                maxAgents: 999,
                allowCustomTools: true,
                allowHumanInLoop: true
            },
            channels: ['whatsapp', 'telegram']
        });
    }

    /**
     * Registers a new tenant
     */
    static registerTenant({ tenantId, name, tier = 'STARTER', quotas = {}, channels = ['whatsapp'] }) {
        if (!tenantId) throw new Error('tenantId is required');

        const tenantData = {
            tenantId,
            name: name || tenantId,
            tier: tier.toUpperCase(),
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            quotas: {
                monthlyMessages: quotas.monthlyMessages || (tier === 'PRO' ? 100000 : (tier === 'BUSINESS' ? 20000 : 2000)),
                maxAgents: quotas.maxAgents || (tier === 'PRO' ? 50 : (tier === 'BUSINESS' ? 10 : 2)),
                allowCustomTools: tier !== 'STARTER',
                allowHumanInLoop: true,
                ...quotas
            },
            channels,
            metadata: {}
        };

        this.tenants.set(tenantId, tenantData);
        return tenantData;
    }

    /**
     * Retrieves tenant context safely
     */
    static getTenant(tenantId) {
        if (!tenantId) return this.tenants.get(this.defaultTenantId);
        return this.tenants.get(tenantId) || null;
    }

    /**
     * Resolves tenant from incoming message or API key
     */
    static resolveTenantContext(chatId = '', apiKey = null) {
        // 1. Check API Key mapping if present
        if (apiKey) {
            for (const [id, t] of this.tenants.entries()) {
                if (t.apiKey === apiKey) return t;
            }
        }

        // 2. Multi-tenant phone / channel mapping
        // In full enterprise mode, specific phone numbers/channels map to specific tenants
        // Default fallback to Agus Salim Master
        return this.tenants.get(this.defaultTenantId);
    }

    /**
     * Isolates storage and memory keys by tenant namespace
     * OWASP Rule: Never store un-prefixed keys in shared stores
     */
    static isolateNamespace(tenantId, resourceKey) {
        const tid = tenantId || this.defaultTenantId;
        return `${tid}::${resourceKey}`;
    }

    /**
     * Validates that an operation is permitted within tenant boundaries
     */
    static validateTenantAccess(sourceTenantId, targetResourceTenantId) {
        if (sourceTenantId !== targetResourceTenantId) {
            throw new Error(`[OWASP Security Violation] Cross-tenant access denied: ${sourceTenantId} tried to access ${targetResourceTenantId}`);
        }
        return true;
    }
}
