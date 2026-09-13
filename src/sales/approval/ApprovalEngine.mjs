import fs from 'fs';
import path from 'path';
import { EventLedger } from '../ledger/EventLedger.mjs';
import { SalesGuard } from '../guard/SalesGuard.mjs';

export class ApprovalEngine {
    constructor(leadStorage) {
        this.storage = leadStorage;
        this.outboundQueuePath = './data/queues/outbound.json';
        this.ledger = new EventLedger();
        this.guard = new SalesGuard({ outboundMode: 'DRY_RUN' });
    }

    async approve(leadId, humanUserId = 'ADMIN') {
        const lead = await this.storage.getLead(leadId);
        if (!lead) throw new Error("Lead tidak ditemukan.");

        if (lead.status === 'APPROVED_PENDING_OUTBOUND') {
            return; // Idempotent
        }

        // 1. SalesGuard Authorization (MUST PASS BEFORE QUEUE)
        const guardContext = this.guard.authorize(lead, lead.draft, { approvedBy: humanUserId });
        
        // 2. Lifecycle
        lead.status = 'APPROVED_PENDING_OUTBOUND';
        lead.guardId = guardContext.guardId;
        lead.version += 1;
        
        await this.storage.saveLead(lead);
        await this.ledger.logEvent(`corr-appr-${Date.now()}`, leadId, 'ACTION_APPROVED', { version: lead.version, guardId: guardContext.guardId });

        // 3. Enqueue
        this.enqueue(lead, guardContext.mode);
    }

    async reject(leadId) {
        const lead = await this.storage.getLead(leadId);
        if (!lead) return;

        lead.status = 'REJECTED';
        lead.version += 1;
        await this.storage.saveLead(lead);
        
        // Use transition guard to set terminal state
        await this.ledger.transitionState(`corr-rej-${Date.now()}`, leadId, 'LOST', 'REJECTED_BY_OPERATOR');
    }

    async edit(leadId, newDraft) {
        const lead = await this.storage.getLead(leadId);
        if (!lead) throw new Error("Lead tidak ditemukan.");

        lead.draft = newDraft;
        lead.status = 'PENDING_APPROVAL'; 
        lead.version += 1;
        
        await this.storage.saveLead(lead);
        await this.ledger.logEvent(`corr-edit-${Date.now()}`, leadId, 'ACTION_DRAFT_EDITED', { newDraftLength: newDraft.length });
    }

    enqueue(lead, outboundMode) {
        const dir = path.dirname(this.outboundQueuePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        let queue = [];
        if (fs.existsSync(this.outboundQueuePath)) {
            queue = JSON.parse(fs.readFileSync(this.outboundQueuePath, 'utf-8'));
        }

        const existing = queue.find(q => q.id === lead.id);
        if (existing) {
            if (existing.version >= lead.version) return; 
            queue = queue.filter(q => q.id !== lead.id);
        }

        queue.push({
            id: lead.id,
            businessName: lead.businessName,
            draft: lead.draft,
            version: lead.version,
            guardId: lead.guardId,
            outboundMode: outboundMode,
            enqueuedAt: new Date().toISOString()
        });

        fs.writeFileSync(this.outboundQueuePath, JSON.stringify(queue, null, 2));
    }
}
