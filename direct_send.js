
      const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
      const pino = require('pino');
      
      (async () => {
          const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
          const sock = makeWASocket({
              auth: state,
              logger: pino({ level: 'silent' })
          });
          
          sock.ev.on('creds.update', saveCreds);
          
          sock.ev.on('connection.update', async (update) => {
              const { connection } = update;
              if (connection === 'open') {
                  console.log('✅ Connected to WhatsApp!');
                  await sock.sendMessage('6285741318412@s.whatsapp.net', { text: 'Halo Mas Agus, ini pengujian langsung dari eksekusi G3 Live Server! (Direct Override)' });
                  console.log('✅ Pesan berhasil dikirim!');
                  process.exit(0);
              }
          });
      })();
    
