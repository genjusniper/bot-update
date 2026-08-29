// src/sales/SalesAutopilotGovernor.mjs
// SalesAutopilotGovernor — Hakim terakhir sebelum bot melakukan aksi apapun
//
// FILOSOFI: AI handle sebanyak mungkin.
// Human masuk HANYA ketika:
//   1. Keputusan bernilai tinggi (negosiasi besar, order besar)
//   2. Situasi butuh otorisasi manusia (harga di bawah floor)
//   3. Guardrail platform/hukum (rate limit, opt-out, blacklist)

import { BlacklistManager } from './BlacklistManager.mjs';
import { ConsentOutreachGuard } from './ConsentOutreachGuard.mjs';
import { LeadVerificationEngine, VerificationStatus } from './LeadVerificationEngine.mjs';
import { LeadScoringEngineV2 } from './LeadScoringEngineV2.mjs';
import { HumanHandoffEngine } from './HumanHandoffEngine.mjs';
import { FollowUpOptimizer, FollowUpDecision } from './FollowUpOptimizer.mjs';
import { MessageRiskGuard, RiskLevel } from './MessageRiskGuard.mjs';
import { SalesTimeline } from './SalesTimeline.mjs';

export const GovAction = {
    SEND:            'SEND',            // AI kirim pesan langsung
    FOLLOW_UP:       'FOLLOW_UP',       // AI kirim follow-up
    WAIT:            'WAIT',            // Tunda, coba lagi nanti
    SKIP:            'SKIP',            // Lead tidak layak, lewati
    HUMAN_HANDOFF:   'HUMAN_HANDOFF',   // Eskalasi ke manusia
    DO_NOT_CONTACT:  'DO_NOT_CONTACT',  // Permanen, jangan kontak
};

export class SalesAutopilotGovernor {
    /**
     * Evaluasi apakah dan bagaimana bot boleh menghubungi lead ini
     *
     * @param {Object} lead - lead dari CRM
     * @param {string} pendingMessage - pesan yang akan dikirim (opsional)
     * @param {Object} context - { incomingText, detectedPhase, priceObjCount, confusedCount }
     * @returns {Object} { action, reason, directive, meta }
     */
    static decide(lead, pendingMessage = '', context = {}) {
        const phone = lead.phone;

        // ══════════════════════════════════════════════════════════
        // LAYER 1: HARD STOPS — guardrail platform/hukum/privasi
        //   Satu-satunya "rem" yang wajib ditaati.
        // ══════════════════════════════════════════════════════════
        if (BlacklistManager.isBlacklisted(phone)) {
            return this._result(GovAction.DO_NOT_CONTACT, 'Blacklisted (DO_NOT_CONTACT)', lead);
        }

        // Opt-out terdeteksi dari pesan masuk
        if (context.incomingText) {
            const optOut = ConsentOutreachGuard.processIncoming(phone, context.incomingText);
            if (optOut.optOut) {
                return this._result(GovAction.DO_NOT_CONTACT, 'User opt-out terdeteksi', lead);
            }
        }

        // ══════════════════════════════════════════════════════════
        // LAYER 2: HUMAN HANDOFF — keputusan bernilai tinggi
        //   AI tidak berwenang memutuskan sendiri.
        // ══════════════════════════════════════════════════════════
        const handoff = HumanHandoffEngine.evaluate(
            lead,
            context.detectedPhase || lead.status,
            context.incomingText || '',
            { priceObjectionCount: context.priceObjCount, confusedCount: context.confusedCount }
        );
        if (handoff.needsHandoff) {
            return this._result(GovAction.HUMAN_HANDOFF, `Trigger: ${handoff.trigger} (${handoff.urgency})`, lead, { trigger: handoff.trigger });
        }

        // ══════════════════════════════════════════════════════════
        // LAYER 3: LEAD VERIFICATION — apakah lead ini valid?
        //   Hanya cegah outreach ke lead yang jelas-jelas salah.
        // ══════════════════════════════════════════════════════════
        const verification = LeadVerificationEngine.verify(lead);
        if (verification.status === VerificationStatus.SKIP) {
            return this._result(GovAction.SKIP, `Verifikasi gagal: ${verification.riskFlags.join(', ')}`, lead);
        }

        // ══════════════════════════════════════════════════════════
        // LAYER 4: RATE LIMIT — guardrail platform (WA ban risk)
        // ══════════════════════════════════════════════════════════
        const guardCheck = ConsentOutreachGuard.check(phone);
        if (!guardCheck.allowed && guardCheck.result === 'BLOCKED_RATE') {
            return this._result(GovAction.WAIT, `Rate limit: ${guardCheck.reason}`, lead, { retryInMinutes: 60 });
        }

        // ══════════════════════════════════════════════════════════
        // LAYER 5: LEAD SCORING — tentukan urgency aksi
        // ══════════════════════════════════════════════════════════
        const { label: scoreLabel, dynamicScore } = LeadScoringEngineV2.calculate(lead);

        // ══════════════════════════════════════════════════════════
        // LAYER 6: FOLLOW-UP OPTIMIZER — perlu follow-up atau tidak?
        // ══════════════════════════════════════════════════════════
        if (['THINKING', 'FOLLOW_UP', 'COOL', 'COLD'].includes(lead.status)) {
            const fuDecision = FollowUpOptimizer.decide(lead);
            if (fuDecision.decision === FollowUpDecision.DO_NOT) {
                return this._result(GovAction.SKIP, fuDecision.reason, lead);
            }
            if (fuDecision.decision === FollowUpDecision.WAIT) {
                return this._result(GovAction.WAIT, fuDecision.reason, lead, { waitDays: fuDecision.waitDays });
            }
            if (fuDecision.decision === FollowUpDecision.NOW) {
                // Cek message risk kalau ada pesan
                if (pendingMessage) {
                    const risk = MessageRiskGuard.evaluate(pendingMessage, lead);
                    if (risk.riskLevel === RiskLevel.BLOCK) {
                        return this._result(GovAction.WAIT, `MessageRiskGuard: ${risk.flags.join(', ')}`, lead);
                    }
                }
                return this._result(GovAction.FOLLOW_UP, `FollowUpOptimizer: ${fuDecision.reason}`, lead, {
                    scoreLabel, dynamicScore, fuDirective: fuDecision.directive,
                });
            }
        }

        // ══════════════════════════════════════════════════════════
        // LAYER 7: MESSAGE RISK — safety check pesan yang akan dikirim
        // ══════════════════════════════════════════════════════════
        if (pendingMessage) {
            const recentMessages = SalesTimeline.getLast(phone, 3).map(e => e.notes);
            const risk = MessageRiskGuard.evaluate(pendingMessage, lead, recentMessages);
            if (risk.riskLevel === RiskLevel.BLOCK) {
                return this._result(GovAction.WAIT, `MessageRiskGuard BLOCK: ${risk.flags.join(', ')}`, lead);
            }
        }

        // ══════════════════════════════════════════════════════════
        // DEFAULT: AI boleh kirim
        // ══════════════════════════════════════════════════════════
        ConsentOutreachGuard.recordSent(phone);
        return this._result(GovAction.SEND, `Semua layer lolos. Score: ${dynamicScore} (${scoreLabel})`, lead, {
            scoreLabel, dynamicScore, verificationSuspicious: verification.status === VerificationStatus.SUSPICIOUS,
        });
    }

    static _result(action, reason, lead, meta = {}) {
        const directive = this._buildDirective(action, reason, meta);
        console.log(`[Governor] ${action} → ${lead.businessName || lead.phone}: ${reason}`);
        return { action, reason, directive, meta };
    }

    static _buildDirective(action, reason, meta) {
        const directives = {
            [GovAction.SEND]:           `=== GOVERNOR ===\nACTION: SEND\nAI bebas merespons dan mengirim pesan.\n${meta.verificationSuspicious ? '⚠️  Lead agak meragukan — gunakan pembuka yang netral.' : ''}\n================`,
            [GovAction.FOLLOW_UP]:      `=== GOVERNOR ===\nACTION: FOLLOW_UP\n${meta.fuDirective || 'Kirim follow-up yang ringan, tidak memaksa.'}\n================`,
            [GovAction.WAIT]:           `=== GOVERNOR ===\nACTION: WAIT\nAlasan: ${reason}\nJangan kirim pesan dulu.\n================`,
            [GovAction.SKIP]:           `=== GOVERNOR ===\nACTION: SKIP\nAlasan: ${reason}\nLewati lead ini sekarang.\n================`,
            [GovAction.HUMAN_HANDOFF]:  `=== GOVERNOR ===\nACTION: HUMAN_HANDOFF\nTrigger: ${meta.trigger || reason}\nInformasikan ke user bahwa tim akan menghubungi lebih lanjut. Jangan lanjut negosiasi sendiri.\n================`,
            [GovAction.DO_NOT_CONTACT]: `=== GOVERNOR ===\nACTION: DO_NOT_CONTACT\nPermanen. Jangan kirim pesan apapun ke nomor ini.\n================`,
        };
        return directives[action] || '';
    }

    /**
     * Proses incoming message dari lead — update timeline + tentukan aksi
     * Ini yang dipanggil PersonalAIOS.mjs saat ada pesan masuk dari lead
     */
    static processIncoming(lead, text, detectedPhase, extras = {}) {
        // Catat di timeline
        SalesTimeline.append(lead.phone, detectedPhase || 'NOTE', text.slice(0, 100));
        return this.decide(lead, '', { incomingText: text, detectedPhase, ...extras });
    }
}
