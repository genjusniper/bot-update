// src/os/reminders/NaturalReminderEngine.mjs
// Natural Language Smart Reminder & Alarm Engine for Salim OS
// Backed by SQLite persistence + tick daemon + Voice Note alarms

import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import { VoiceSynthesizer } from '../../multimodal/VoiceSynthesizer.mjs';

export class NaturalReminderEngine {
    static db = null;
    static daemonInterval = null;
    static waGateway = null;
    static initialized = false;

    static init(dbPath) {
        if (this.initialized && this.db) return;
        const targetPath = dbPath || path.resolve(process.cwd(), 'memory', 'queue_v10.sqlite');
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        this.db = new DatabaseSync(targetPath);
        this.db.exec("PRAGMA journal_mode = WAL;");
        this.db.exec("PRAGMA busy_timeout = 5000;");

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id TEXT NOT NULL,
                sender_id TEXT NOT NULL,
                reminder_text TEXT NOT NULL,
                target_timestamp INTEGER NOT NULL,
                status TEXT DEFAULT 'PENDING',
                created_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status, target_timestamp);
        `);

        this.initialized = true;
        console.log('[ReminderEngine] ⏰ Initialized SQLite table for reminders');
    }

    /**
     * Parses natural language reminder request in Indonesian
     * @param {string} text 
     * @returns {{ text: string, targetTimestamp: number, formattedTime: string } | null}
     */
    static parseNaturalReminder(text) {
        if (!text) return null;
        const clean = text.trim();

        // 1. Strip leading trigger prefixes
        // e.g. "!ingatkan", "/ingatkan", "ingatkan aku", "ingetin gue", "tolong ingatkan"
        const prefixRegex = /^(?:!ingatkan|\/ingatkan|!remind|\/remind|(?:tolong\s+)?(?:ingatkan|ingetin)(?:\s+(?:aku|gue|saya|gw|bos))?)\s+/i;
        if (!prefixRegex.test(clean)) {
            return null;
        }

        let body = clean.replace(prefixRegex, '').trim();
        const now = Date.now();
        let targetTimestamp = null;
        let reminderText = '';

        // Pattern A: Relative minutes / hours / seconds (e.g. "10 menit lagi angkat jemuran" or "10m angkat jemuran")
        const relMatch = body.match(/^(\d+)\s*(menit|mnt|m|jam|jm|j|detik|dtk|s)(?:\s+lagi)?\s*(?:(?:buat|untuk|bahwa|agar|kalo|kalau)\s+)?(.*)$/i);
        if (relMatch) {
            const val = parseInt(relMatch[1], 10);
            const unit = relMatch[2].toLowerCase();
            reminderText = (relMatch[3] || '').trim() || 'Pengingat tanpa judul';

            let ms = 0;
            if (['menit', 'mnt', 'm'].includes(unit)) ms = val * 60 * 1000;
            else if (['jam', 'jm', 'j'].includes(unit)) ms = val * 3600 * 1000;
            else if (['detik', 'dtk', 's'].includes(unit)) ms = val * 1000;

            targetTimestamp = now + ms;
        }

        // Pattern B: Specific time today or tomorrow (e.g. "jam 15:30 nelpon Hanif" or "besok jam 04:30 bangun pagi")
        if (!targetTimestamp) {
            const timeMatch = body.match(/^(?:(besok|nanti)\s+)?jam\s*(\d{1,2})[:.](\d{2})(?:\s*wib)?\s*(?:(?:buat|untuk|bahwa|agar|kalo|kalau)\s+)?(.*)$/i);
            if (timeMatch) {
                const isBesok = (timeMatch[1] || '').toLowerCase() === 'besok';
                const hour = parseInt(timeMatch[2], 10);
                const minute = parseInt(timeMatch[3], 10);
                reminderText = (timeMatch[4] || '').trim() || 'Pengingat tanpa judul';

                const target = new Date();
                target.setHours(hour, minute, 0, 0);

                if (isBesok || target.getTime() <= now) {
                    // If marked tomorrow OR if the time already passed today, push to tomorrow
                    target.setDate(target.getDate() + 1);
                }
                targetTimestamp = target.getTime();
            }
        }

        // Pattern C: Natural date (e.g. "tanggal 25 jam 09:00 bayar wifi")
        if (!targetTimestamp) {
            const dateMatch = body.match(/^tanggal\s*(\d{1,2})\s*(?:jam\s*)?(\d{1,2})[:.](\d{2})(?:\s*wib)?\s*(.*)$/i);
            if (dateMatch) {
                const day = parseInt(dateMatch[1], 10);
                const hour = parseInt(dateMatch[2], 10);
                const minute = parseInt(dateMatch[3], 10);
                reminderText = (dateMatch[4] || '').trim() || 'Pengingat tanpa judul';

                const target = new Date();
                target.setDate(day);
                target.setHours(hour, minute, 0, 0);

                if (target.getTime() <= now) {
                    // Push to next month
                    target.setMonth(target.getMonth() + 1);
                }
                targetTimestamp = target.getTime();
            }
        }

        if (!targetTimestamp) {
            return null;
        }

        const formattedTime = new Date(targetTimestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }) + ' WIB';

        return {
            text: reminderText,
            targetTimestamp,
            formattedTime
        };
    }

    /**
     * Schedules a new reminder into database
     */
    static addReminder({ chatId, senderId, text, targetTimestamp }) {
        if (!this.initialized) this.init();
        const now = Date.now();
        const stmt = this.db.prepare(`
            INSERT INTO reminders (chat_id, sender_id, reminder_text, target_timestamp, status, created_at)
            VALUES (?, ?, ?, ?, 'PENDING', ?)
        `);
        const result = stmt.run(chatId, senderId, text, targetTimestamp, now);
        return {
            id: Number(result.lastInsertRowid),
            chatId,
            senderId,
            text,
            targetTimestamp
        };
    }

    /**
     * Lists all pending reminders for a specific chat or globally
     */
    static listActiveReminders(chatId) {
        if (!this.initialized) this.init();
        const now = Date.now();
        let stmt;
        if (chatId) {
            stmt = this.db.prepare(`
                SELECT id, reminder_text, target_timestamp, created_at 
                FROM reminders 
                WHERE chat_id = ? AND status = 'PENDING' AND target_timestamp > ?
                ORDER BY target_timestamp ASC
            `);
            return stmt.all(chatId, now);
        } else {
            stmt = this.db.prepare(`
                SELECT id, chat_id, reminder_text, target_timestamp 
                FROM reminders 
                WHERE status = 'PENDING' AND target_timestamp > ?
                ORDER BY target_timestamp ASC
            `);
            return stmt.all(now);
        }
    }

    /**
     * Cancels a reminder
     */
    static cancelReminder(id, chatId) {
        if (!this.initialized) this.init();
        const stmt = this.db.prepare(`
            UPDATE reminders 
            SET status = 'CANCELLED' 
            WHERE id = ? AND (chat_id = ? OR ? IS NULL) AND status = 'PENDING'
        `);
        const res = stmt.run(id, chatId || null, chatId || null);
        return res.changes > 0;
    }

    /**
     * Starts the daemon loop checking for due reminders
     */
    static startDaemon(waGateway) {
        if (!this.initialized) this.init();
        this.waGateway = waGateway;

        if (this.daemonInterval) {
            clearInterval(this.daemonInterval);
        }

        this.daemonInterval = setInterval(async () => {
            await this.checkDueReminders();
        }, 10000); // check every 10s

        console.log('[ReminderEngine] 🚀 Reminder daemon running (10s tick)');
    }

    /**
     * Ticks and triggers any due reminders
     */
    static async checkDueReminders() {
        if (!this.waGateway?.sock) return;

        try {
            const now = Date.now();
            const dueStmt = this.db.prepare(`
                SELECT id, chat_id, sender_id, reminder_text, target_timestamp 
                FROM reminders 
                WHERE status = 'PENDING' AND target_timestamp <= ?
            `);
            const dueList = dueStmt.all(now);

            for (const item of dueList) {
                // Mark TRIGGERED immediately to avoid double firing
                const updateStmt = this.db.prepare("UPDATE reminders SET status = 'TRIGGERED' WHERE id = ?");
                updateStmt.run(item.id);

                console.log(`[ReminderEngine] 🔔 Triggering reminder #${item.id}: "${item.reminder_text}" to ${item.chat_id}`);

                const timeStr = new Date(item.target_timestamp).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }) + ' WIB';

                // 1. Send High-Priority Text Alert
                const alertMessage = 
                    `⏰ *PENGINGAT DARI SALIM OS!*\n` +
                    `━━━━━━━━━━━━━━━━━━\n` +
                    `📌 *Agenda:* ${item.reminder_text}\n` +
                    `🕒 *Waktu:* ${timeStr}\n` +
                    `━━━━━━━━━━━━━━━━━━\n` +
                    `_Pemberitahuan otomatis asisten pribadi Bos Agus._`;

                await this.waGateway.sock.sendMessage(item.chat_id, { text: alertMessage }).catch(err => {
                    console.error('[ReminderEngine] ❌ Failed to send text reminder:', err.message);
                });

                // 2. Generate and Send Voice Note Audio Alarm (PTT)
                try {
                    const voiceText = `Halo Bos Agus! Mengingatkan agenda Anda sekarang: ${item.reminder_text}`;
                    const audioBuffer = await VoiceSynthesizer.synthesize(voiceText, 'id');
                    if (audioBuffer) {
                        await this.waGateway.sock.sendMessage(item.chat_id, {
                            audio: audioBuffer,
                            mimetype: 'audio/mp4',
                            ptt: true
                        });
                        console.log(`[ReminderEngine] 🎙️ Sent Voice Note alarm for reminder #${item.id}`);
                    }
                } catch (vErr) {
                    console.warn('[ReminderEngine] ⚠️ Voice alert failed (non-fatal):', vErr.message);
                }
            }
        } catch (err) {
            console.error('[ReminderEngine] ❌ Daemon loop error:', err.message);
        }
    }
}
