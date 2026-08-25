const { default: makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

async function startPairing() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth-v7');
    console.log('Mengambil versi WA Web terbaru...');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Menggunakan WA Web versi: ${version.join('.')} | latest: ${isLatest}`);
    
    console.log('Inisialisasi socket...');
    const sock = makeWASocket({
        version: [2, 3000, 1015901307], // Explicit stable version
        logger: pino({ level: 'silent' }), // Hide debug logs for cleaner output
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.macOS('Desktop'),
        markOnlineOnConnect: false
    });

    let codeRequested = false;

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update;

        if (qr && !codeRequested) {
            codeRequested = true;
            console.log('📡 Koneksi siap. Meminta pairing code untuk 6285741318412...');
            try {
                let code = await sock.requestPairingCode('6285741318412');
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                fs.writeFileSync('qr.txt', `PAIRING_CODE: ${code}`);
                console.log("PAIRING CODE:", code);
            } catch (err) {
                console.error("Gagal meminta pairing code:", err);
                codeRequested = false; // Allow retry on next QR update
            }
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log(`🔌 Koneksi terputus (Status: ${statusCode}). Mencoba reconnect otomatis...`);
            codeRequested = false;
            
            if (statusCode === 401) {
                console.log('❌ Sesi ditolak/Logged out. Menghentikan proses.');
                fs.writeFileSync('qr.txt', 'DISCONNECTED');
                process.exit(1);
            }
        } else if (connection === 'open') {
            fs.writeFileSync('qr.txt', 'CONNECTED');
            console.log('✅ Berhasil terhubung!');
            process.exit(0);
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

console.log('Starting pairing...');
startPairing();
