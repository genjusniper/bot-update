# WA BOT V4 AUTOMATION

Engine:
automation/engine.mjs

Database:
automation/automation.json

Commands:

/help
/status
/remind YYYY-MM-DD HH:mm | pesan
/schedule YYYY-MM-DD HH:mm | pesan
/list
/cancel ID

Contoh:

/remind 2026-08-19 07:00 | Kasih makan ikan

/schedule 2026-08-20 20:00 | Cek stok

/cancel 1

Engine harus dihubungkan ke socket WhatsApp:

import {
    handleAutomationCommand,
    startScheduler
} from "./automation/engine.mjs";

Pada message handler:

const result =
    handleAutomationCommand(
        jid,
        text
    );

if (result.handled) {
    await sock.sendMessage(
        jid,
        {
            text: result.reply
        }
    );

    return;
}

Setelah socket berhasil dibuat:

startScheduler(
    (jid, content) =>
        sock.sendMessage(
            jid,
            content
        )
);
