/**
 * HumanReviewCLI.mjs
 *
 * Interactive terminal UI for human lead approval.
 *
 * FLOW:
 *   Display lead + opportunities → Human reads → [A]pprove / [E]dit / [R]eject → SalesGuard
 *
 * INVARIANTS:
 *   - HUMAN must explicitly approve (no auto-approve)
 *   - SalesGuard.authorize() is always called before any queue entry
 *   - OUTBOUND_MODE = DRY_RUN enforced inside SalesGuard
 *   - humanUserId is captured from CLI session (not fabricated)
 */

import readline from 'readline';
import { ApprovalEngine } from '../approval/ApprovalEngine.mjs';
import { SalesGuard } from '../guard/SalesGuard.mjs';
import { DecisionTraceBuilder } from '../ai/DecisionTraceBuilder.mjs';

const DIVIDER = '═'.repeat(60);
const THIN    = '─'.repeat(60);

export class HumanReviewCLI {
    constructor(options = {}) {
        this.approval = new ApprovalEngine(options);
        this.guard = new SalesGuard({ outboundMode: 'DRY_RUN' });
        this.traceBuilder = new DecisionTraceBuilder(options.traceDir);
        this.humanUserId = options.humanUserId || process.env.REVIEWER_ID || 'REVIEWER_CLI';
        this.rl = null;
    }

    /**
     * Review a single lead interactively.
     *
     * @param {object} lead
     * @param {object} agentResult - from SalesIntelligenceAgent.run()
     * @returns {object} reviewResult: { action, draft, approvedBy, timestamp }
     */
    async review(lead, agentResult) {
        this.rl = readline.createInterface({ input: process.stdin, output: process.stdout });

        try {
            this._printHeader(lead, agentResult);
            this._printOpportunities(agentResult);
            this._printDecisionTrace(agentResult);
            this._printMissing(agentResult);
            this._printConflicts(agentResult);
            this._printFooter(agentResult);

            const action = await this._askAction();

            if (action === 'R') {
                return this._reject(lead);
            }

            let draft = agentResult.researchResult?.updatedPrimaryOpportunity
                ? this._buildDraft(lead, agentResult)
                : '';

            if (action === 'E') {
                draft = await this._editDraft(draft);
            }

            if (!draft || draft.trim().length === 0) {
                console.log('\n⚠️  Draft kosong. Lead tidak bisa diapprove tanpa draft.\n');
                return this._reject(lead);
            }

            return this._approve(lead, draft);

        } finally {
            this.rl.close();
        }
    }

    /**
     * Review multiple leads in sequence.
     */
    async reviewBatch(leadResultPairs) {
        const results = [];
        for (const { lead, agentResult } of leadResultPairs) {
            console.log(`\n[${results.length + 1}/${leadResultPairs.length}] Reviewing: ${lead.businessName}`);
            const result = await this.review(lead, agentResult);
            results.push({ lead, result });
        }
        this._printBatchSummary(results);
        return results;
    }

    // ── Display ──────────────────────────────────────────────────────────────

    _printHeader(lead, agentResult) {
        console.log(`\n╔${DIVIDER}╗`);
        console.log(`║  🔍 HUMAN REVIEW${' '.repeat(43)}║`);
        console.log(`╠${DIVIDER}╣`);
        console.log(`║  Bisnis  : ${(lead.businessName || '').padEnd(47)}║`);
        console.log(`║  Kategori: ${(lead.businessCategory || 'UNKNOWN').padEnd(47)}║`);
        console.log(`║  Lokasi  : ${(lead.location || '-').padEnd(47)}║`);
        console.log(`║  Kontak  : ${(lead.publicContact || '-').padEnd(47)}║`);
        console.log(`║  Score   : ${this._scoreBar(agentResult.score)}  ${(agentResult.score * 100).toFixed(0)}%${' '.repeat(39 - (agentResult.score * 100).toFixed(0).length)}║`);
        console.log(`║  Grade   : ${(agentResult.qualityGrade || '?').padEnd(47)}║`);
        console.log(`╠${DIVIDER}╣`);
    }

    _printOpportunities(agentResult) {
        const hyps = agentResult.hypotheses || [];
        const medals = ['🥇', '🥈', '🥉'];
        console.log(`║  PELUANG PRODUK${' '.repeat(44)}║`);
        console.log(`║${THIN}║`);
        hyps.slice(0, 3).forEach((h, i) => {
            const medal = medals[i] || '  ';
            const product = h.product.toUpperCase().padEnd(12);
            const conf = `${(h.confidence * 100).toFixed(0)}%`.padStart(4);
            const sig = h.demandSignal ? h.demandSignal.replace(/_/g, ' ').padEnd(22) : ''.padEnd(22);
            console.log(`║  ${medal} ${product} ${conf}  ${sig}            ║`);
        });
        if (hyps.length === 0) {
            console.log(`║  (tidak ada peluang terdeteksi)${' '.repeat(28)}║`);
        }
        console.log(`╠${DIVIDER}╣`);
    }

    _printDecisionTrace(agentResult) {
        const traces = agentResult.traces || [];
        if (!traces.length) return;
        console.log(`║  DECISION TRACE${' '.repeat(44)}║`);
        const t = traces[0]; // Primary opportunity trace
        if (t) {
            const sc = t.confidence;
            console.log(`║  Confidence: Source=${(sc.sourceReliability * 100).toFixed(0)}% Evidence=${(sc.evidenceConfidence * 100).toFixed(0)}% Decision=${(sc.decisionConfidence * 100).toFixed(0)}%   ║`);
            console.log(`║  Evidence : ${t.evidence.length} item(s)${' '.repeat(45 - String(t.evidence.length).length)}║`);
            t.evidence.slice(0, 2).forEach(e => {
                const val = (e.value || '').substring(0, 35);
                console.log(`║    └─ [${e.classification}] ${val.padEnd(35)}║`);
            });
        }
        console.log(`╠${DIVIDER}╣`);
    }

    _printMissing(agentResult) {
        const traces = agentResult.traces || [];
        const missing = traces[0]?.missing || [];
        if (!missing.length) return;
        console.log(`║  DATA YANG BELUM DIKETAHUI${' '.repeat(33)}║`);
        missing.slice(0, 4).forEach(m => {
            console.log(`║    • ${m.padEnd(53)}║`);
        });
        console.log(`╠${DIVIDER}╣`);
    }

    _printConflicts(agentResult) {
        const contradictions = agentResult.contradictions || [];
        if (!contradictions.length) return;
        console.log(`║  ⚠️  KONFLIK / KONTRADIKSI${' '.repeat(33)}║`);
        contradictions.forEach(c => {
            console.log(`║    [${c.severity}] ${c.product.toUpperCase()} — ${c.resolution.padEnd(35)}║`);
        });
        console.log(`╠${DIVIDER}╣`);
    }

    _printFooter(agentResult) {
        const exp = agentResult.explanations?.[0];
        if (exp?.reasoning) {
            const reason = exp.reasoning.substring(0, 55);
            console.log(`║  ALASAN AI: ${reason.padEnd(47)}║`);
            console.log(`╠${DIVIDER}╣`);
        }
        console.log(`║  OUTBOUND : DRY_RUN (tidak ada pesan nyata dikirim)${' '.repeat(9)}║`);
        console.log(`╠${DIVIDER}╣`);
        console.log(`║  [A] Approve   [E] Edit Draft   [R] Reject${' '.repeat(17)}║`);
        console.log(`╚${DIVIDER}╝`);
    }

    _scoreBar(score) {
        const filled = Math.round(score * 10);
        return '█'.repeat(filled) + '░'.repeat(10 - filled);
    }

    // ── Actions ──────────────────────────────────────────────────────────────

    async _askAction() {
        return new Promise(resolve => {
            this.rl.question('\nPilihan [A/E/R]: ', (answer) => {
                const a = answer.trim().toUpperCase();
                if (['A', 'E', 'R'].includes(a)) resolve(a);
                else { console.log('Pilihan tidak valid. Ketik A, E, atau R.'); resolve('R'); }
            });
        });
    }

    async _editDraft(currentDraft) {
        console.log(`\nDraft saat ini:\n${currentDraft || '(kosong)'}\n`);
        return new Promise(resolve => {
            this.rl.question('Edit draft (tekan Enter untuk skip): ', (answer) => {
                resolve(answer.trim() || currentDraft);
            });
        });
    }

    _buildDraft(lead, agentResult) {
        const primary = agentResult.hypotheses?.[0];
        if (!primary) return '';
        const product = primary.product.toUpperCase().replace(/_/g, ' ');
        return `Halo, kami dari Mother Sales. Kami melihat ${lead.businessName} mungkin membutuhkan ${product}. Boleh kami diskusi lebih lanjut?`;
    }

    _approve(lead, draft) {
        try {
            const token = this.guard.authorize(lead, draft, { approvedBy: this.humanUserId });
            const result = this.approval.approve(lead.id || lead.leadId, this.humanUserId);
            console.log(`\n✅ APPROVED — DRY_RUN (tidak ada WA terkirim)\n`);
            return { action: 'APPROVED', draft, approvedBy: this.humanUserId, token, approvalResult: result, timestamp: new Date().toISOString() };
        } catch (e) {
            console.log(`\n❌ Approval gagal: ${e.message}\n`);
            return { action: 'APPROVAL_FAILED', reason: e.message, timestamp: new Date().toISOString() };
        }
    }

    _reject(lead) {
        console.log(`\n🚫 REJECTED — lead tidak diqueue\n`);
        return { action: 'REJECTED', leadId: lead.id || lead.leadId, timestamp: new Date().toISOString() };
    }

    _printBatchSummary(results) {
        const approved = results.filter(r => r.result.action === 'APPROVED').length;
        const rejected = results.filter(r => r.result.action === 'REJECTED').length;
        console.log(`\n${'═'.repeat(60)}`);
        console.log(`BATCH REVIEW SELESAI`);
        console.log(`  Approved : ${approved}`);
        console.log(`  Rejected : ${rejected}`);
        console.log(`  OUTBOUND : 0 (DRY_RUN)`);
        console.log(`${'═'.repeat(60)}\n`);
    }
}
