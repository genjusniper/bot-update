// src/agent/background/ProactiveBrain.mjs
import { OutboundQueueManager } from '../../sales/OutboundQueueManager.mjs';
import { SalesGuardOS } from '../../sales/SalesGuardOS.mjs';

export class ProactiveBrain {
    constructor(options = {}) {
        this.workerInterval = null;
        this.isProcessing = false;
    }

    async start(sock, memoryDB, allowedContacts, getGenerateReplyFn) {
        if (this.workerInterval) return;
        
        console.log(`🔥 [PHASE G3] ProactiveBrain (Sales Worker) ONLINE! Mode: ${SalesGuardOS.CONFIG.OUTBOUND_MODE}`);
        
        try {
            await OutboundQueueManager.recoverCrash();
        } catch (e) {
            console.error('[ProactiveBrain] Gagal menjalankan Crash Recovery:', e.message);
        }

        // Loop setiap 10 detik
        this.workerInterval = setInterval(async () => {
            if (this.isProcessing) return;
            this.isProcessing = true;
            
            try {
                const job = await OutboundQueueManager.claimNext();
                if (job) {
                    console.log(`\n[Outbound Worker] 📥 Memproses Job: ${job.idempotency_key}`);
                    
                    // 1. Lewati Sales Guard
                    const guardCheck = SalesGuardOS.canSend(job);
                    if (!guardCheck.allowed) {
                        console.log(`[Outbound Worker] 🛑 BLOCKED OLEH GUARD: ${guardCheck.reason}`);
                        await OutboundQueueManager.updateState(job.idempotency_key, 'FAILED_GUARD');
                        await SalesGuardOS.logAudit(job.campaign_id, job.phone, 'BLOCKED', guardCheck.reason);
                        this.isProcessing = false;
                        return;
                    }

                    // 2. Tandai SENDING (Titik kritis crash recovery)
                    await OutboundQueueManager.updateState(job.idempotency_key, 'SENDING');

                    // 3. Sanitasi Pesan (Pastikan THOUGHT hilang)
                    const cleanMessage = SalesGuardOS.sanitizePayload(job.draft_message);

                    // 4. Kirim via Baileys (Simulasi UX)
                    await sock.sendPresenceUpdate('composing', job.phone);
                    await new Promise(r => setTimeout(r, 2000));
                    await sock.sendPresenceUpdate('paused', job.phone);

                    await sock.sendMessage(job.phone, { text: cleanMessage });
                    console.log(`[Outbound Worker] 🚀 Pesan G3 terkirim ke: ${job.phone}`);
                    
                    // 5. Tandai SENT & Record Budget
                    await OutboundQueueManager.updateState(job.idempotency_key, 'SENT');
                    SalesGuardOS.recordSent();
                    await SalesGuardOS.logAudit(job.campaign_id, job.phone, 'SENT', 'G3 Live Delivery');
                    
                    console.log(`[Outbound Worker] ✅ Sisa Budget G3: ${SalesGuardOS.CONFIG.G3_BUDGET}`);
                    if (SalesGuardOS.CONFIG.OUTBOUND_MODE === 'DRY_RUN') {
                        console.log(`[Outbound Worker] 🔒 G3 BUDGET EXHAUSTED. KEMBALI KE DRY_RUN.`);
                    }
                }
            } catch (error) {
                console.error('[Outbound Worker] ❌ Kesalahan Eksekusi:', error);
            } finally {
                this.isProcessing = false;
            }
        }, 10000); // 10 Detik
    }

    stop() {
        if (this.workerInterval) {
            clearInterval(this.workerInterval);
            this.workerInterval = null;
            console.log('🛑 ProactiveBrain (Sales Worker): Dimatikan');
        }
    }
}
