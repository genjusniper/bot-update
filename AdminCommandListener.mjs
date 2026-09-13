import { EventBus } from './src/events/EventBus.mjs';
import { ApprovalEngine } from './src/sales/approval/ApprovalEngine.mjs';
import { SalesGuard } from './src/sales/guard/SalesGuard.mjs';
import { exec } from 'child_process';

export class AdminCommandListener {
    constructor(gateway, ownerIds, approvalEngine, outbox) {
        this.gateway = gateway;
        this.ownerIds = ownerIds.split(',').map(id => id.trim());
        this.approvalEngine = approvalEngine;
        this.outbox = outbox;
    }

    start() {
        EventBus.subscribe('whatsapp.message.received', async (event) => {
            const { unifiedMsg, rawKey } = event.payload;
            const sender = rawKey.remoteJid;
            const text = unifiedMsg.text?.trim() || '';

            if (!this.ownerIds.includes(sender)) return;

            if (text.toLowerCase().startsWith('/approve')) {
                await this.handleApprove(sender, text);
            } else if (text.toLowerCase().startsWith('/reject')) {
                await this.handleReject(sender, text);
            } else if (text.toLowerCase().startsWith('/leads')) {
                await this.handleListLeads(sender);
            }
        });
        console.log(`[AdminUI] Listening for admin commands from ${this.ownerIds.join(', ')}`);
    }

    async handleApprove(sender, text) {
        const parts = text.split(' ');
        if (parts.length < 2) return this.gateway.sendMessage(sender, 'Format: /approve <lead-id>');
        const leadId = parts[1];
        try {
            const result = await this.approvalEngine.approve(leadId, sender);
            
            this.outbox.push({
                leadId: leadId,
                status: 'READY_TO_SEND',
                approvedBy: sender,
                token: result.token
            });

            await this.gateway.sendMessage(sender, `✅ Lead ${leadId} APPROVED.\nToken: ${result.token}\nMenunggu pengiriman oleh OutboundWorker.`);
        } catch (e) {
            await this.gateway.sendMessage(sender, `❌ Gagal approve: ${e.message}`);
        }
    }

    async handleReject(sender, text) {
        const parts = text.split(' ');
        if (parts.length < 2) return this.gateway.sendMessage(sender, 'Format: /reject <lead-id>');
        const leadId = parts[1];
        try {
            await this.approvalEngine.reject(leadId, sender, 'Rejected via WA Admin');
            await this.gateway.sendMessage(sender, `🛑 Lead ${leadId} REJECTED.`);
        } catch (e) {
            await this.gateway.sendMessage(sender, `❌ Gagal reject: ${e.message}`);
        }
    }

    async handleListLeads(sender) {
        await this.gateway.sendMessage(sender, `Mengambil data pipeline...`);
        const cmd = 'node src/sales/run_sandbox.mjs';
        exec(cmd, async (error, stdout, stderr) => {
            let output = stdout.substring(stdout.length - 1500);
            await this.gateway.sendMessage(sender, `📊 STATUS PIPELINE:\n\n${output}`);
        });
    }
}
