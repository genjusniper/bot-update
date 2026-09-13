import { OutboundQueueManager } from './src/sales/OutboundQueueManager.mjs';

// Mock Socket Baileys
const MockSock = {
    sendPresenceUpdate: async (status, jid) => {
        console.log(`[WhatsApp API] 🟢 Presence Update: ${status} for ${jid}`);
    },
    sendMessage: async (jid, payload) => {
        console.log(`[WhatsApp API] 🚀 SENDING MESSAGE TO ${jid}`);
        console.log(`[WhatsApp API] 📄 Content: "${payload.text}"`);
        return { key: { id: `MOCK_ID_${Date.now()}` } };
    }
};

(async () => {
    console.log('👷 STANDALONE CANARY WORKER (PHASE G) STARTED');
    
    // Recovery Phase
    await OutboundQueueManager.recoverCrash();

    console.log('🔍 Checking for PENDING jobs...');
    let processed = 0;

    // Loop untuk memproses semua job yang ada di queue
    while (true) {
        const job = await OutboundQueueManager.claimNext();
        if (!job) {
            console.log('📭 Antrian kosong. Pekerjaan selesai.');
            break;
        }

        console.log(`\n📥 Memproses Job: ${job.idempotency_key}`);
        
        await OutboundQueueManager.updateState(job.idempotency_key, 'SENDING');

        // Simulasi pengiriman
        await MockSock.sendPresenceUpdate('composing', job.phone);
        await new Promise(r => setTimeout(r, 1500)); // Simulasi jeda ngetik
        await MockSock.sendPresenceUpdate('paused', job.phone);

        await MockSock.sendMessage(job.phone, { text: job.draft_message });
        
        await OutboundQueueManager.updateState(job.idempotency_key, 'SENT');
        console.log(`✅ Job ${job.idempotency_key} selesai dan dilock dengan status SENT.`);
        processed++;
    }

    console.log(`\n🎉 Total job diproses pada batch ini: ${processed}`);
    
    // Verifikasi Database
    const finalQueue = await OutboundQueueManager._loadQueue();
    console.log('\n📊 STATUS ANTRIAN SAAT INI (DB):');
    Object.values(finalQueue).forEach(j => {
        console.log(`- ${j.idempotency_key} | Status: ${j.state} | Attempts: ${j.attempt_count}`);
    });

})();
