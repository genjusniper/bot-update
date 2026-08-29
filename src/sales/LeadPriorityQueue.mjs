// src/sales/LeadPriorityQueue.mjs
// LeadPriorityQueue — Urutkan lead berdasarkan potensi & urgency

import { LeadCRM, LeadStatus } from './LeadCRM.mjs';
import { ConsentOutreachGuard } from './ConsentOutreachGuard.mjs';
import { BlacklistManager } from './BlacklistManager.mjs';

// Priority score per kombinasi score + status
const PRIORITY_MATRIX = {
    // Format: `${score}_${status}` → priority (lebih tinggi = lebih diprioritaskan)
    'VERY_HIGH_NEW':         100,
    'VERY_HIGH_FOLLOW_UP':   95,
    'HIGH_NEW':              85,
    'HIGH_FOLLOW_UP':        80,
    'VERY_HIGH_THINKING':    75,
    'HIGH_INTERESTED':       70,
    'HIGH_ASKED_PRICE':      70,
    'HIGH_THINKING':         65,
    'MEDIUM_NEW':            50,
    'MEDIUM_FOLLOW_UP':      45,
    'LOW_NEW':               20,
};

const DEFAULT_PRIORITY = 30;

export class LeadPriorityQueue {
    /**
     * Bangun antrian lead yang siap dioutreach, diurutkan berdasarkan prioritas
     * @param {Object} opts - { limit: 20, includeFollowUps: true }
     * @returns {Array} sorted lead array dengan priority score
     */
    static build({ limit = 20, includeFollowUps = true } = {}) {
        // Ambil semua lead yang masih aktif (bukan LOST atau ORDER selesai)
        const excludeStatuses = [LeadStatus.LOST, LeadStatus.ORDER, LeadStatus.REPEAT];
        const allLeads = LeadCRM.getByStatus(null).filter(l => !excludeStatuses.includes(l.status));

        const scored = allLeads
            .filter(lead => {
                // Filter yang tidak boleh dioutreach
                if (BlacklistManager.isBlacklisted(lead.phone)) return false;
                const guardCheck = ConsentOutreachGuard.check(lead.phone);
                return guardCheck.allowed;
            })
            .map(lead => {
                const key = `${lead.score}_${lead.status}`;
                let priority = PRIORITY_MATRIX[key] || DEFAULT_PRIORITY;

                // Bonus untuk follow-up yang sudah jatuh tempo
                if (lead.status === LeadStatus.FOLLOW_UP && lead.nextFollowUp) {
                    const overdueDays = (Date.now() - new Date(lead.nextFollowUp).getTime()) / 86400000;
                    if (overdueDays > 0) priority += Math.min(15, overdueDays * 3);
                }

                // Penalti untuk yang sudah terlalu sering difollow-up
                if ((lead.followUpCount || 0) > 2) priority -= 10;

                return { ...lead, _priority: Math.round(priority) };
            })
            .sort((a, b) => b._priority - a._priority);

        if (!includeFollowUps) {
            return scored.filter(l => l.status === LeadStatus.NEW).slice(0, limit);
        }

        return scored.slice(0, limit);
    }

    /**
     * Ambil N lead teratas yang siap untuk outreach sekarang
     * @param {number} n
     * @returns {Array} lead[]
     */
    static getTopN(n = 10) {
        return this.build({ limit: n });
    }

    /**
     * Format antrian sebagai teks untuk laporan operator
     */
    static formatQueue(n = 10) {
        const queue = this.getTopN(n);
        if (queue.length === 0) return '✅ Tidak ada lead yang siap di-outreach sekarang.';

        const lines = [`📋 *Lead Priority Queue (Top ${queue.length}):*`, ''];
        queue.forEach((lead, i) => {
            lines.push(`${i + 1}. [P${lead._priority}] ${lead.businessName} (${lead.score}) — ${lead.status} — ${lead.location || '-'}`);
        });
        return lines.join('\n');
    }
}
