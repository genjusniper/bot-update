// src/agent/background/ProactiveBrain.mjs
// V15.0 - Proactive Sales Engine (Misi 3: The Aggressive Collector)

import cron from 'node-cron';
import { ProactiveSalesEngine } from '../../sales/ProactiveSalesEngine.mjs';

export class ProactiveBrain {
    constructor(options = {}) {
        this.task = null;
    }

    start(sock, memoryDB, allowedContacts, getGenerateReplyFn) {
        if (this.task) return;
        
        console.log("⏰ ProactiveBrain (Sales Mode): Diaktifkan! Jadwal Weker: 20:00 WIB tiap hari.");
        
        // Jadwal: Setiap hari jam 20:00 malam waktu lokal server
        this.task = cron.schedule('0 20 * * *', async () => {
            console.log('\n[ProactiveBrain] 🔔 WAKTU FOLLOW-UP! Menyisir OrderLedger...');
            
            try {
                const targets = await ProactiveSalesEngine.getFollowUpTargets();
                
                if (targets.length === 0) {
                    console.log('[ProactiveBrain] ✅ Semua pelanggan VIP sudah order hari ini.');
                    return;
                }

                console.log(`[ProactiveBrain] 🎯 Menemukan ${targets.length} target penagihan pesanan.`);

                for (const target of targets) {
                    const message = ProactiveSalesEngine.generateMessage(target.name);
                    console.log(`  -> Mengirim ke ${target.name} (${target.chatId}): "${message}"`);
                    
                    try {
                        // Jeda acak antara 5-15 detik per pesan agar tidak kena blokir WhatsApp
                        const delayMs = Math.floor(Math.random() * 10000) + 5000;
                        await new Promise(r => setTimeout(r, delayMs));

                        await sock.sendPresenceUpdate('composing', target.chatId);
                        await new Promise(r => setTimeout(r, 2000)); // Pura-pura ngetik
                        await sock.sendPresenceUpdate('paused', target.chatId);

                        await sock.sendMessage(target.chatId, { text: message });
                        console.log(`  ✅ Pesan penagihan sukses terkirim ke ${target.name}`);
                    } catch (e) {
                        console.error(`  ❌ Gagal kirim ke ${target.name}:`, e.message);
                    }
                }
                console.log('[ProactiveBrain] 🏁 Misi penagihan selesai!\n');
            } catch (error) {
                console.error('[ProactiveBrain] ❌ Error saat eksekusi cron:', error);
            }
        });
    }

    stop() {
        if (this.task) {
            this.task.stop();
            this.task = null;
            console.log('🛑 ProactiveBrain: Dimatikan');
        }
    }
}
