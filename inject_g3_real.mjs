
      import { OutboundQueueManager } from './src/sales/OutboundQueueManager.mjs';
      (async () => {
          await OutboundQueueManager.enqueue('g3_live_real2', '6285741318412@s.whatsapp.net', { 
              score: 99,
              reason: 'Human Approved (G3 Real Test)',
              approvedAt: Date.now(),
              draft_message: 'Halo Mas Agus, ini pengujian langsung dari Live Server (Phase G3). SalesGuardOS berjalan sukses!'
          });
          console.log('✅ G3 Lead Injected untuk 6285741318412!');
      })();
    
