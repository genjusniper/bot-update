
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';
import pino from 'pino';

(async () => {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
        
        // Handle varying default export behaviors in ESM/Babel environments
        const sockInit = makeWASocket.default || makeWASocket;
        
        const sock = sockInit({
            auth: state,
            logger: pino({ level: 'silent' })
        });
        
        sock.ev.on('creds.update', saveCreds);
        
        sock.ev.on('connection.update', async (update) => {
            const { connection } = update;
            if (connection === 'open') {
                console.log('✅ Connected to WhatsApp!');
                await sock.sendMessage('6285741318412@s.whatsapp.net', { 
                    text: 'Halo Mas Agus, ini bot. Canary test Phase G. Pesan ini dikirim langsung dari Termux (Gembok SalesGuardOS telah dibuka sesaat).' 
                });
                console.log('✅ Pesan berhasil dikirim!');
                
                // Beri jeda 2 detik agar network stream tereksekusi sempurna sebelum exit
                setTimeout(() => {
                    process.exit(0);
                }, 2000);
            }
        });
    } catch (e) {
        console.error("ERROR:", e);
    }
})();
    
