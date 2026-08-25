import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "automation");
const DATA_FILE = path.join(DATA_DIR, "automation.json");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return {
                reminders: [],
                schedules: [],
                nextId: 1
            };
        }

        return JSON.parse(
            fs.readFileSync(DATA_FILE, "utf8")
        );
    } catch {
        return {
            reminders: [],
            schedules: [],
            nextId: 1
        };
    }
}

function saveData(data) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 2)
    );
}

const data = loadData();

function nextId() {
    const id = data.nextId++;
    saveData(data);
    return id;
}

function parseDateTime(text) {
    const match = text.match(
        /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/
    );

    if (!match) return null;

    const [, y, mo, d, h, m] = match;

    const date = new Date(
        Number(y),
        Number(mo) - 1,
        Number(d),
        Number(h),
        Number(m)
    );

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

export function createReminder(jid, datetime, text) {
    const date = parseDateTime(datetime);

    if (!date) {
        throw new Error(
            "Format tanggal salah. Gunakan YYYY-MM-DD HH:mm"
        );
    }

    const item = {
        id: nextId(),
        type: "reminder",
        jid,
        datetime: date.getTime(),
        text,
        createdAt: Date.now(),
        done: false
    };

    data.reminders.push(item);
    saveData(data);

    return item;
}

export function createSchedule(jid, datetime, text) {
    const date = parseDateTime(datetime);

    if (!date) {
        throw new Error(
            "Format tanggal salah. Gunakan YYYY-MM-DD HH:mm"
        );
    }

    const item = {
        id: nextId(),
        type: "schedule",
        jid,
        datetime: date.getTime(),
        text,
        createdAt: Date.now(),
        done: false
    };

    data.schedules.push(item);
    saveData(data);

    return item;
}

export function listJobs(jid) {
    return [
        ...data.reminders.filter(x =>
            x.jid === jid && !x.done
        ),
        ...data.schedules.filter(x =>
            x.jid === jid && !x.done
        )
    ].sort(
        (a, b) => a.datetime - b.datetime
    );
}

export function cancelJob(jid, id) {
    const number = Number(id);

    const all = [
        ...data.reminders,
        ...data.schedules
    ];

    const item = all.find(
        x => x.jid === jid && x.id === number && !x.done
    );

    if (!item) {
        return false;
    }

    item.done = true;
    item.cancelledAt = Date.now();

    saveData(data);

    return true;
}

export function getStats() {
    const reminders = data.reminders.filter(
        x => !x.done
    ).length;

    const schedules = data.schedules.filter(
        x => !x.done
    ).length;

    return {
        reminders,
        schedules,
        total: reminders + schedules
    };
}

export function startScheduler(sendMessage) {
    console.log("⏰ V4 Scheduler aktif");

    let running = false;

    setInterval(async () => {
        if (running) return;

        running = true;

        try {
            const now = Date.now();

            const jobs = [
                ...data.reminders,
                ...data.schedules
            ].filter(job =>
                !job.done &&
                job.datetime <= now
            );

            for (const job of jobs) {
                try {
                    const prefix =
                        job.type === "reminder"
                            ? "⏰ REMINDER"
                            : "📨 PESAN TERJADWAL";

                    await sendMessage(
                        job.jid,
                        {
                            text:
`${prefix}

${job.text}

🤖 WA Bot V4`
                        }
                    );

                    job.done = true;
                    job.executedAt = Date.now();

                    saveData(data);

                    console.log(
                        `✅ Automation #${job.id} selesai`
                    );

                } catch (err) {
                    console.log(
                        `❌ Automation #${job.id}:`,
                        err.message
                    );
                }
            }

        } finally {
            running = false;
        }

    }, 5000);
}

export function automationHelp() {
    return `
🤖 WA BOT V4 — AUTOMATION

Perintah:

/help
/status

/remind YYYY-MM-DD HH:mm | pesan

Contoh:
/remind 2026-08-19 07:00 | Kasih makan ikan

/schedule YYYY-MM-DD HH:mm | pesan

Contoh:
/schedule 2026-08-20 20:00 | Jangan lupa cek stok

/list
/cancel ID

Contoh:
/cancel 3

━━━━━━━━━━━━━━━━━━

⏰ Reminder = pengingat
📨 Schedule = pesan otomatis

Semua jadwal disimpan permanen.
Bot restart → jadwal tetap ada.
`;
}

export function handleAutomationCommand(jid, text) {

    const input = text.trim();

    if (
        input === "/help" ||
        input === "/automation"
    ) {
        return {
            handled: true,
            reply: automationHelp()
        };
    }

    if (input === "/list") {

        const jobs = listJobs(jid);

        if (!jobs.length) {
            return {
                handled: true,
                reply:
`📭 Tidak ada automation aktif.`
            };
        }

        const lines = jobs.map(job => {

            const date = new Date(job.datetime);

            const waktu =
                date.getFullYear() +
                "-" +
                String(date.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(date.getDate()).padStart(2, "0") +
                " " +
                String(date.getHours()).padStart(2, "0") +
                ":" +
                String(date.getMinutes()).padStart(2, "0");

            const type =
                job.type === "reminder"
                    ? "⏰"
                    : "📨";

            return `${type} #${job.id} — ${waktu}
${job.text}`;
        });

        return {
            handled: true,
            reply:
`📋 AUTOMATION AKTIF

${lines.join("\n\n")}`
        };
    }

    if (input.startsWith("/cancel ")) {

        const id =
            input.substring(8).trim();

        if (!/^\d+$/.test(id)) {
            return {
                handled: true,
                reply:
`❌ ID harus berupa angka.

Contoh:
/cancel 3`
            };
        }

        const ok =
            cancelJob(jid, id);

        return {
            handled: true,
            reply: ok
                ? `✅ Automation #${id} dibatalkan.`
                : `❌ Automation #${id} tidak ditemukan.`
        };
    }

    if (
        input.startsWith("/remind ")
    ) {

        const raw =
            input.substring(8);

        const parts =
            raw.split("|");

        if (parts.length < 2) {
            return {
                handled: true,
                reply:
`❌ Format salah.

Contoh:
/remind 2026-08-19 07:00 | Kasih makan ikan`
            };
        }

        const datetime =
            parts[0].trim();

        const message =
            parts.slice(1)
                .join("|")
                .trim();

        if (!message) {
            return {
                handled: true,
                reply:
`❌ Pesan reminder kosong.`
            };
        }

        try {

            const item =
                createReminder(
                    jid,
                    datetime,
                    message
                );

            return {
                handled: true,
                reply:
`✅ REMINDER DIBUAT

🆔 ID: ${item.id}
⏰ Waktu: ${datetime}
📝 Pesan: ${message}

Bot akan mengirim otomatis.`
            };

        } catch (err) {

            return {
                handled: true,
                reply:
`❌ ${err.message}`
            };
        }
    }

    if (
        input.startsWith("/schedule ")
    ) {

        const raw =
            input.substring(10);

        const parts =
            raw.split("|");

        if (parts.length < 2) {
            return {
                handled: true,
                reply:
`❌ Format salah.

Contoh:
/schedule 2026-08-20 20:00 | Cek stok ikan`
            };
        }

        const datetime =
            parts[0].trim();

        const message =
            parts.slice(1)
                .join("|")
                .trim();

        if (!message) {
            return {
                handled: true,
                reply:
`❌ Pesan schedule kosong.`
            };
        }

        try {

            const item =
                createSchedule(
                    jid,
                    datetime,
                    message
                );

            return {
                handled: true,
                reply:
`✅ PESAN TERJADWAL DIBUAT

🆔 ID: ${item.id}
⏰ Waktu: ${datetime}
📝 Pesan: ${message}

Bot akan mengirim otomatis.`
            };

        } catch (err) {

            return {
                handled: true,
                reply:
`❌ ${err.message}`
            };
        }
    }

    if (input === "/status") {

        const stats =
            getStats();

        return {
            handled: true,
            reply:
`📊 WA BOT V4 STATUS

🟢 Automation: ON
⏰ Reminder: ${stats.reminders}
📨 Schedule: ${stats.schedules}
📦 Total aktif: ${stats.total}

💾 Data: automation/automation.json`
        };
    }

    return {
        handled: false
    };
}
