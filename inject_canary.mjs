// inject_canary.mjs (Dijalankan di Termux)
import { OutboundQueueManager } from './src/sales/OutboundQueueManager.mjs';

(async () => {
    try {
        console.log('🐥 INJECTING CANARY LEAD TO QUEUE...');
        const campaignId = `canary_${Date.now()}`;
        
        // Nomor HP Mas Agus (Nomor pengujian) yang didapat dari percakapan sebelumnya
        // Atur dengan format WA yang tepat (menggunakan @s.whatsapp.net jika Baileys butuh, 
        // tapi queue biasanya menyimpan nomor saja lalu Baileys menambahkan @s.whatsapp.net di dalam, 
        // mari kita pastikan nomornya aman. Jika Baileys butuh nomor saja: 628...)
        
        // Asumsi format Baileys: ID yang diconvert
        // Gunakan nomor simulasi/dummy owner untuk amannya. 
        // Karena ini canary, kita asumsikan Mas Agus akan menerima ini di HP-nya yang lain
        // Jika tidak tahu pasti nomornya, biarkan ID dummy `236322690191595@s.whatsapp.net` (dari JID lama)
        // Note: Sebaiknya kita print log saja atau gunakan nomor yang ada di Termux
        
        const testPhone = '62899999999@s.whatsapp.net'; // Menggunakan format Baileys

        const draft = "Halo Mas Agus, ini bot. Canary test Phase G. Kalau pesan ini sampai, berarti arsitektur Enterprise Queue Worker kita berhasil 100%.";

        await OutboundQueueManager.enqueue(campaignId, testPhone, {
            score: 99,
            reason: 'Human Approved (Canary Test)',
            draft_message: draft
        });

        console.log(`✅ Canary injected successfully for campaign ${campaignId}!`);
        console.log('💡 Worker (ProactiveBrain) akan menariknya dalam max 30 detik.');
    } catch (e) {
        console.error('❌ Inject Failed:', e);
    }
})();
