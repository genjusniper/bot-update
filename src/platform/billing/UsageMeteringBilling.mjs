// src/platform/billing/UsageMeteringBilling.mjs
// ============================================================================
// SALIM AI ENTERPRISE PLATFORM - USAGE METERING & SAAS BILLING ENGINE
// Tracks messages, token consumption, human handoffs, and enforces quotas
// ============================================================================

import { TenantContextIsolation } from '../tenant/TenantContextIsolation.mjs';

export class UsageMeteringBilling {
    static tenantUsage = new Map();

    /**
     * Initializes or gets usage record for tenant
     */
    static getUsage(tenantId = 'tenant_agus_master') {
        const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
        const key = `${tenantId}::${monthKey}`;

        if (!this.tenantUsage.has(key)) {
            this.tenantUsage.set(key, {
                tenantId,
                period: monthKey,
                messagesCount: 0,
                tokensUsed: 0,
                humanEscalations: 0,
                toolsExecuted: 0,
                lastActivity: new Date().toISOString()
            });
        }

        return this.tenantUsage.get(key);
    }

    /**
     * Records a message transaction
     */
    static recordUsage({ tenantId = 'tenant_agus_master', tokens = 0, isEscalation = false, toolsCount = 0 }) {
        const usage = this.getUsage(tenantId);
        usage.messagesCount++;
        usage.tokensUsed += tokens;
        if (isEscalation) usage.humanEscalations++;
        usage.toolsExecuted += toolsCount;
        usage.lastActivity = new Date().toISOString();

        return usage;
    }

    /**
     * Checks if tenant has remaining quota
     */
    static checkQuota(tenantId = 'tenant_agus_master') {
        const tenant = TenantContextIsolation.getTenant(tenantId);
        const usage = this.getUsage(tenantId);

        const limit = tenant?.quotas?.monthlyMessages || 2000;
        const current = usage.messagesCount;
        const percentage = Math.min(100, Math.round((current / limit) * 100));

        return {
            allowed: current < limit,
            current,
            limit,
            percentage,
            isNearLimit: percentage >= 80,
            isExceeded: current >= limit
        };
    }

    /**
     * Formats usage report for client dashboard or WhatsApp
     */
    static formatUsageReport(tenantId = 'tenant_agus_master') {
        const tenant = TenantContextIsolation.getTenant(tenantId);
        const usage = this.getUsage(tenantId);
        const quota = this.checkQuota(tenantId);

        return (
            `📊 *LAPORAN PENGGUNAAN & KUOTA SAAS*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `🏢 *Perusahaan:* ${tenant?.name || 'Master Tenant'}\n` +
            `📦 *Paket:* ${tenant?.tier || 'ENTERPRISE'}\n` +
            `📅 *Periode:* ${usage.period}\n\n` +
            `💬 *Pesan Terproses:* ${usage.messagesCount.toLocaleString()} / ${quota.limit.toLocaleString()} (${quota.percentage}%)\n` +
            `🧠 *Token AI Terpakai:* ~${usage.tokensUsed.toLocaleString()} tokens\n` +
            `🧑‍💼 *Eskalasi ke Manusia:* ${usage.humanEscalations} kasus\n` +
            `⚙️ *Eksekusi Tools:* ${usage.toolsExecuted} aksi\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            (quota.isExceeded 
                ? `🚨 *KUOTA HABIS:* Pesan otomatis ditunda sampai paket di-upgrade.\n` 
                : (quota.isNearLimit ? `⚠️ *Peringatan:* Kuota telah mencapai ${quota.percentage}%!\n` : `✅ *Status:* Kuota aman dan operasional normal.\n`))
        );
    }
}
