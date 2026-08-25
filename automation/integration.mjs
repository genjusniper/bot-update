import {
    handleAutomationCommand,
    startScheduler
} from "./engine.mjs";

export function installAutomation(sock) {

    if (!sock) {
        throw new Error("Socket WhatsApp tidak tersedia");
    }

    console.log("⏰ V4 Automation: mengaktifkan scheduler...");

    startScheduler(
        async (jid, content) => {

            try {

                await sock.sendMessage(
                    jid,
                    content
                );

                console.log(
                    `📨 V4 automation terkirim → ${jid}`
                );

            } catch (err) {

                console.log(
                    `❌ V4 gagal mengirim → ${jid}:`,
                    err.message
                );

                throw err;
            }
        }
    );

    console.log(
        "✅ V4 Automation Scheduler AKTIF"
    );
}

export async function processAutomationCommand(
    sock,
    jid,
    text
) {

    try {

        const result =
            handleAutomationCommand(
                jid,
                text
            );

        if (!result?.handled) {
            return false;
        }

        await sock.sendMessage(
            jid,
            {
                text: result.reply
            }
        );

        console.log(
            `🤖 V4 command: ${text}`
        );

        return true;

    } catch (err) {

        console.log(
            "❌ V4 command error:",
            err.message
        );

        try {

            await sock.sendMessage(
                jid,
                {
                    text:
`❌ V4 Automation Error

${err.message}`
                }
            );

        } catch {}

        return true;
    }
}
