
      import { OutboundQueueManager } from './src/sales/OutboundQueueManager.mjs';
      (async () => {
          await OutboundQueueManager.enqueue('g3_live', '628999999999@s.whatsapp.net', { // Nomor Dummy agar tidak merugikan siapapun
              score: 99,
              reason: 'Human Approved',
              approvedAt: Date.now(), // Fresh Approval
              draft_message: 'Halo, ini uji coba G3 LIVE (Controlled Observation) dari Termux. Mohon abaikan pesan ini.'
          });
          console.log('✅ G3 Lead Injected!');
      })();
    
