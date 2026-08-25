'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const baileys = require('@whiskeysockets/baileys');

const makeWASocket =
    baileys.default || baileys.makeWASocket;

const {
    useMultiFileAuthState,
    DisconnectReason,
} = baileys;

const SESSION_DIR = path.resolve('./auth-v7');
const MAX_RESTARTS = 3;
const RESTART_DELAY = 1500;

let socket = null;
let shuttingDown = false;
let restartCount = 0;
let pairingRequested = false;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function ask(text) {
    return new Promise(resolve => {
        rl.question(text, resolve);
    });
}

function normalizePhone(value) {
    return String(value || '').replace(/\D/g, '');
}

function statusCode(error) {
    return error?.output?.statusCode;
}

async function createConnection() {
    if (shuttingDown) return;

    console.log('');
    console.log('----------------------------------------');
    console.log(`🔌 Membuat koneksi #${restartCount + 1}`);
    console.log('----------------------------------------');

    const {
        state,
        saveCreds,
    } = await useMultiFileAuthState(SESSION_DIR);

    socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async update => {
        if (shuttingDown) return;

        const {
            connection,
            lastDisconnect,
        } = update;

        if (connection === 'connecting') {
            console.log('🔄 Connecting...');
        }

        if (connection === 'open') {
            console.log('');
            console.log('========================================');
            console.log('       ✅ BERHASIL TERSAMBUNG');
            console.log('========================================');
            console.log('');
            console.log(`📁 Session: ${SESSION_DIR}`);
            console.log('');
            console.log('Session siap digunakan bot utama.');
            console.log('');

            shuttingDown = true;

            setTimeout(() => {
                try {
                    socket?.ws?.close();
                } catch {}

                rl.close();
                process.exit(0);
            }, 2000);

            return;
        }

        if (connection === 'close') {
            const code = statusCode(lastDisconnect?.error);

            console.log('');
            console.log(`⚠️ Connection closed: ${code ?? 'unknown'}`);

            if (
                code === DisconnectReason.restartRequired &&
                !shuttingDown
            ) {
                if (restartCount >= MAX_RESTARTS) {
                    console.log('');
                    console.log('❌ Batas restart tercapai.');
                    console.log('Pairing belum berhasil.');
                    console.log('auth-v7 TIDAK dihapus otomatis.');

                    shuttingDown = true;
                    rl.close();
                    process.exit(1);
                }

                restartCount++;

                console.log('');
                console.log('🔄 WhatsApp meminta restart socket.');
                console.log(
                    `⏳ Restart ${restartCount}/${MAX_RESTARTS}...`
                );
                console.log('');

                setTimeout(async () => {
                    try {
                        await createConnection();
                    } catch (error) {
                        console.error('');
                        console.error('❌ Restart gagal:');
                        console.error(error?.message || error);

                        shuttingDown = true;
                        rl.close();
                        process.exit(1);
                    }
                }, RESTART_DELAY);

                return;
            }

            if (
                code === DisconnectReason.loggedOut
            ) {
                console.log('');
                console.log('❌ Session logout/ditolak.');
                console.log('auth-v7 tidak dihapus otomatis.');
                console.log('');

                shuttingDown = true;
                rl.close();
                process.exit(1);
            }

            console.log('');
            console.log('❌ Koneksi terputus.');
            console.log(`Status: ${code ?? 'unknown'}`);
            console.log('');

            shuttingDown = true;
            rl.close();
            process.exit(1);
        }
    });

    if (
        !state.creds.registered &&
        !pairingRequested
    ) {
        pairingRequested = true;

        console.log('');
        console.log('========================================');
        console.log('          📱 PAIRING CODE');
        console.log('========================================');
        console.log('');

        const input = await ask(
            'Nomor WhatsApp: '
        );

        const phoneNumber = normalizePhone(input);

        if (!phoneNumber || phoneNumber.length < 8) {
            console.log('');
            console.log('❌ Nomor tidak valid.');

            shuttingDown = true;
            rl.close();
            process.exit(1);
        }

        console.log('');
        console.log('⏳ Meminta pairing code...');

        try {
            const code =
                await socket.requestPairingCode(
                    phoneNumber
                );

            console.log('');
            console.log('========================================');
            console.log(`       🔐 CODE: ${code}`);
            console.log('========================================');
            console.log('');
            console.log(
                'WhatsApp → Perangkat Tertaut →'
            );
            console.log(
                'Tautkan perangkat → Tautkan dengan nomor telepon'
            );
            console.log('');
            console.log(
                '⏳ Menunggu proses pairing...'
            );
            console.log('');
        } catch (error) {
            console.error('');
            console.error('❌ Pairing code gagal:');
            console.error(error?.message || error);

            shuttingDown = true;
            rl.close();
            process.exit(1);
        }
    }
}

async function main() {
    console.log('');
    console.log('========================================');
    console.log('       WhatsApp Pair Utility V7');
    console.log('          Termux / Android');
    console.log('========================================');
    console.log('');

    fs.mkdirSync(SESSION_DIR, {
        recursive: true,
    });

    console.log(`📁 Session: ${SESSION_DIR}`);

    const {
        state,
    } = await useMultiFileAuthState(
        SESSION_DIR
    );

    if (state.creds.registered) {
        console.log('');
        console.log('ℹ️ auth-v7 sudah terdaftar.');
        console.log('🔌 Menggunakan session yang ada.');
    } else {
        console.log('');
        console.log('🆕 auth-v7 belum terdaftar.');
        console.log('📱 Pairing Code akan digunakan.');
    }

    await createConnection();
}

process.on('SIGINT', () => {
    shuttingDown = true;

    console.log('');
    console.log('👋 Utility dihentikan.');

    try {
        socket?.ws?.close();
    } catch {}

    rl.close();
    process.exit(0);
});

process.on('uncaughtException', error => {
    console.error('');
    console.error('❌ Uncaught Exception:');
    console.error(error?.stack || error);
});

process.on('unhandledRejection', error => {
    console.error('');
    console.error('❌ Unhandled Rejection:');
    console.error(error?.stack || error);
});

main().catch(error => {
    console.error('');
    console.error('❌ Fatal Error:');
    console.error(error?.stack || error);

    rl.close();
    process.exit(1);
});
