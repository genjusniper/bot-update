// src/sales/FollowUpOptimizer.mjs
// FollowUpOptimizer — Tentukan perlu follow-up atau jangan ganggu

import { SalesTimeline, TimelineEvent } from './SalesTimeline.mjs';
import { LeadScoringEngineV2 } from './LeadScoringEngineV2.mjs';

export const FollowUpDecision = {
    NOW:         'FOLLOW_UP_NOW',
    WAIT:        'WAIT',
    DO_NOT:      'DO_NOT_FOLLOW_UP',
    HUMAN:       'ESCALATE_TO_HUMAN',
};

export class FollowUpOptimizer {
    /**
     * Tentukan apakah dan kapan harus follow-up
     * @param {Object} lead - lead dari CRM
     * @returns {Object} { decision, waitDays, reason, directive }
     */
    static decide(lead) {
        const phone = lead.phone;
        const timeline = SalesTimeline.getAll(phone);
        const lastEvent = timeline[timeline.length - 1];
        const warnings = SalesTimeline.detectWarnings(phone);

        // ── Hard stops ─────────────────────────────────────────────
        if (['ORDER', 'REPEAT', 'LOST'].includes(lead.status)) {
            return { decision: FollowUpDecision.DO_NOT, waitDays: 0, reason: `Lead status ${lead.status}` };
        }

        // Terlalu banyak follow-up sudah dilakukan
        const fuCount = SalesTimeline.countEvent(phone, TimelineEvent.FOLLOW_UP);
        if (fuCount >= 4 && lead.status !== 'INTERESTED') {
            return {
                decision: FollowUpDecision.DO_NOT,
                waitDays: 0,
                reason: `${fuCount}x follow-up, masih ${lead.status} — jangan ganggu lagi`,
            };
        }

        // Lead menyebut NO_NEED
        const hasNoNeed = timeline.some(e => e.notes?.includes('NO_NEED'));
        if (hasNoNeed) {
            return { decision: FollowUpDecision.DO_NOT, waitDays: 0, reason: 'Lead menyatakan tidak butuh' };
        }

        // ── Dynamic scoring ────────────────────────────────────────
        const { label, dynamicScore } = LeadScoringEngineV2.calculate(lead);

        // ── Timing check ───────────────────────────────────────────
        let daysSinceLast = 999;
        if (lastEvent) {
            daysSinceLast = (Date.now() - new Date(lastEvent.ts).getTime()) / 86400000;
        }

        // ── Decision matrix ────────────────────────────────────────
        // HOT/CHAMPION — follow up segera kalau sudah > 1 hari
        if (['CHAMPION', 'HOT'].includes(label)) {
            if (daysSinceLast >= 1) {
                return { decision: FollowUpDecision.NOW, waitDays: 0, reason: `Lead ${label}, sudah ${daysSinceLast.toFixed(1)} hari`, directive: this._directive('NOW', label) };
            }
            return { decision: FollowUpDecision.WAIT, waitDays: 1, reason: `Lead ${label}, terlalu segera (${daysSinceLast.toFixed(1)}h)` };
        }

        // WARM — follow up setelah 3 hari
        if (label === 'WARM') {
            if (daysSinceLast >= 3) {
                return { decision: FollowUpDecision.NOW, waitDays: 0, reason: `WARM lead, ${daysSinceLast.toFixed(0)} hari`, directive: this._directive('NOW', label) };
            }
            return { decision: FollowUpDecision.WAIT, waitDays: Math.ceil(3 - daysSinceLast), reason: `Tunggu ${Math.ceil(3 - daysSinceLast)} hari lagi` };
        }

        // COOL — follow up setelah 7 hari, tapi hanya 2x
        if (label === 'COOL') {
            if (fuCount >= 2) return { decision: FollowUpDecision.DO_NOT, waitDays: 0, reason: 'COOL + 2x follow-up sudah' };
            if (daysSinceLast >= 7) {
                return { decision: FollowUpDecision.NOW, waitDays: 0, reason: `COOL, ${daysSinceLast.toFixed(0)} hari`, directive: this._directive('NOW', label) };
            }
            return { decision: FollowUpDecision.WAIT, waitDays: Math.ceil(7 - daysSinceLast), reason: `COOL — tunggu ${Math.ceil(7 - daysSinceLast)} hari lagi` };
        }

        // COLD — jangan follow-up
        return { decision: FollowUpDecision.DO_NOT, waitDays: 0, reason: `Lead COLD (skor ${dynamicScore}) — tidak efektif difollow-up` };
    }

    static _directive(decision, label) {
        if (decision === 'NOW') {
            return label === 'CHAMPION' || label === 'HOT'
                ? '=== FOLLOW-UP OPTIMIZER ===\nLead perlu ditindaklanjuti sekarang. Tanyakan perkembangan/keputusan secara langsung — lead ini panas.\n============================='
                : '=== FOLLOW-UP OPTIMIZER ===\nFollow-up ringan — jangan push. Tanyakan kabar bisnis atau apakah ada pertanyaan soal produk.\n=============================';
        }
        return '';
    }

    /**
     * Jalankan optimizer untuk semua lead aktif
     * @param {Array} leads
     * @returns {Array} leads yang harus di-follow-up sekarang, diurutkan prioritas
     */
    static getReadyForFollowUp(leads) {
        return leads
            .map(l => ({ lead: l, decision: this.decide(l) }))
            .filter(r => r.decision.decision === FollowUpDecision.NOW)
            .sort((a, b) => {
                // Sort: HOT/CHAMPION dulu
                const scoreA = LeadScoringEngineV2.calculate(a.lead).dynamicScore;
                const scoreB = LeadScoringEngineV2.calculate(b.lead).dynamicScore;
                return scoreB - scoreA;
            });
    }
}
