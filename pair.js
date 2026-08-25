const { default: makeWASocket, useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

async function pair() {
    const { state, saveCreds } = await useMultiFileAuthState('auth-v7');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'fatal' }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'),
        syncFullHistory: false,
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000
    });

    sock.ev.on('creds.update', saveCreds);

    let codeRequested = false;

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update;

        if (qr && !codeRequested) {
            codeRequested = true;
            console.log('⏳ Menyiapkan socket... Tunggu 2 detik...');
            
            setTimeout(async () => {
                try {
                    console.log('📡 Meminta Pairing Code untuk nomor 6285741318412...');
                    let code = await sock.requestPairingCode('6285741318412');
                    code = code?.match(/.{1,4}/g)?.join("-") || code;
                    console.log('\n====================================');
                    console.log('🔑 KODE PAIRING ANDA:', code);
                    console.log('====================================\n');
                } catch (e) {
                    console.error('❌ Gagal meminta pairing code:', e.message);
                    codeRequested = false;
                }
            }, 2000);
        }

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            console.log(`🔌 Koneksi terputus (Status: ${code}).`);
            codeRequested = false;
        } else if (connection === 'open') {
            console.log('✅ BERHASIL LOGIN!');
            process.exit(0);
        }
    });
}

pair();
