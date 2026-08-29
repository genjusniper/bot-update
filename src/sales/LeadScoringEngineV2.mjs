// src/sales/LeadScoringEngineV2.mjs
// LeadScoringEngineV2 — Dynamic scoring berbasis aktivitas/reply

import { SalesTimeline, TimelineEvent } from './SalesTimeline.mjs';

// Delta skor per event/aktivitas
const SCORE_DELTAS = {
    [TimelineEvent.REPLIED]:      +15,
    [TimelineEvent.CURIOUS]:      +8,
    [TimelineEvent.INTERESTED]:   +12,
    [TimelineEvent.ASKED_PRICE]:  +10,
    [TimelineEvent.ORDER]:        +25,
    [TimelineEvent.OBJECTION]:    -5,
    [TimelineEvent.NEGOTIATION]:  +3,   // masih mau negosiasi = masih minat
    [TimelineEvent.THINKING]:     -3,
    [TimelineEvent.LOST]:         -50,
    [TimelineEvent.FOLLOW_UP]:    -2,   // perlu dikejar = engagement rendah
    [TimelineEvent.REPEAT]:       +30,
};

// Threshold label
const SCORE_LABELS = [
    { min: 90,  label: 'CHAMPION',   priority: 1 },
    { min: 75,  label: 'HOT',        priority: 2 },
    { min: 60,  label: 'WARM',       priority: 3 },
    { min: 40,  label: 'COOL',       priority: 4 },
    { min: 0,   label: 'COLD',       priority: 5 },
];

export class LeadScoringEngineV2 {
    /**
     * Hitung skor dinamis dari timeline + base score dari QualityGate
     * @param {Object} lead - lead dari CRM (punya .score dari QualityGate)
     * @returns {Object} { dynamicScore, label, priority, delta, breakdown }
     */
    static calculate(lead) {
        // Base score dari QualityGate (konversi string ke angka)
        const baseMap = { VERY_HIGH: 70, HIGH: 55, MEDIUM: 40, LOW: 20, IGNORE: 0 };
        let score = baseMap[lead.score] || 40;
        const breakdown = [`Base (${lead.score}): ${score}`];

        // Baca timeline
        const timeline = SalesTimeline.getAll(lead.phone);
        for (const event of timeline) {
            const delta = SCORE_DELTAS[event.event];
            if (delta !== undefined) {
                score += delta;
                breakdown.push(`${event.event}: ${delta >= 0 ? '+' : ''}${delta}`);
            }
        }

        // Penalti waktu — lead tidak aktif makin lama makin turun
        const lastEvent = timeline[timeline.length - 1];
        if (lastEvent) {
            const daysSinceLast = (Date.now() - new Date(lastEvent.ts).getTime()) / 86400000;
            if (daysSinceLast > 7) {
                const decay = -Math.min(20, Math.floor(daysSinceLast - 7) * 2);
                score += decay;
                breakdown.push(`Time decay (${Math.floor(daysSinceLast)}d): ${decay}`);
            }
        }

        score = Math.max(0, Math.min(100, score));
        const { label, priority } = SCORE_LABELS.find(l => score >= l.min) || SCORE_LABELS[SCORE_LABELS.length - 1];

        return { dynamicScore: score, label, priority, breakdown };
    }

    /**
     * Sorting helper — sort leads array berdasarkan dynamic score
     */
    static sortByScore(leads) {
        return leads
            .map(l => ({ ...l, _scoreResult: this.calculate(l) }))
            .sort((a, b) => b._scoreResult.dynamicScore - a._scoreResult.dynamicScore);
    }

    /**
     * Directive AI berdasarkan skor
     */
    static getDirective(lead) {
        const { label, dynamicScore } = this.calculate(lead);
        const directives = {
            CHAMPION: 'Lead sangat panas! Prioritaskan respons, tawarkan konfirmasi order langsung.',
            HOT:      'Lead menjanjikan. Dorong ke langkah konkret: coba sample atau konfirmasi kebutuhan.',
            WARM:     'Lead tertarik tapi belum commit. Perkuat dengan value proposition.',
            COOL:     'Lead masih dingin. Jangan terlalu push — bangun kepercayaan dulu.',
            COLD:     'Lead dingin atau stagnan. Pertimbangkan jeda sebelum follow-up.',
        };
        return `=== LEAD SCORE V2 ===\nSkor: ${dynamicScore}/100 (${label})\n${directives[label]}\n====================`;
    }
}
