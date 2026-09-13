// src/os/reminders/AggressiveAlarmEngine.mjs
// Aggressive Wake-Up Alarm Engine (Anti-Kesiangan) for Salim OS
// Persisted in SQLite with persistent 60s repetitive alarm loop and password cancellation

import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import { VoiceSynthesizer } from '../../multimodal/VoiceSynthesizer.mjs';

export class AggressiveAlarmEngine {
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
            CREATE TABLE IF NOT EXISTS aggressive_alarms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id TEXT NOT NULL,
                target_timestamp INTEGER NOT NULL,
                alarm_text TEXT NOT NULL,
                status TEXT DEFAULT 'PENDING',
                created_at INTEGER NOT NULL,
                last_triggered INTEGER DEFAULT 0,
                trigger_count INTEGER DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_agg_alarms_status ON aggressive_alarms(status, target_timestamp);
        `);

        this.initialized = true;
        console.log('[AggressiveAlarm] ⏰ Initialized SQLite table for aggressive alarms');
    }

    /**
     * Parses aggressive alarm command or natural text
     * @param {string} text 
     * @returns {{ targetTimestamp: number, alarmText: string, formattedTime: string } | null}
     */
    static parseAlarmRequest(text) {
        if (!text) return null;
        const clean = text.trim();

        // Check trigger prefix
        // e.g. "!alarmgalak", "!alarm-galak", "pasang alarm galak", "alarm galak"
        const prefixRegex = /^(?:!alarmgalak|!alarm-galak|(?:tolong\s+)?(?:pasang\s+)?alarm\s+galak)\s+/i;
        if (!prefixRegex.test(clean)) {
            return null;
        }

        let body = clean.replace(prefixRegex, '').trim();
        const now = Date.now();
        let targetTimestamp = null;
        let alarmText = '';

        // Pattern 1: Relative minutes/hours (e.g. "10m bangun", "30 menit lagi")
        const relMatch = body.match(/^(\d+)\s*(menit|mnt|m|jam|jm|j)(?:\s+lagi)?\s*(.*)$/i);
        if (relMatch) {
            const val = parseInt(relMatch[1], 10);
            const unit = relMatch[2].toLowerCase();
            alarmText = (relMatch[3] || '').trim() || 'Waktunya Bangun!';

            let ms = 0;
            if (['menit', 'mnt', 'm'].includes(unit)) ms = val * 60 * 1000;
            else if (['jam', 'jm', 'j'].includes(unit)) ms = val * 3600 * 1000;

            targetTimestamp = now + ms;
        }

        // Pattern 2: Absolute time (e.g. "04:30", "05:00 subuh", "jam 5:30", "besok 04:30")
        if (!targetTimestamp) {
            const absMatch = body.match(/^(?:besok\s+)?(?:jam\s+)?(\d{1,2})[:.](\d{2})(?:\s+(pagi|siang|sore|malam))?\s*(.*)$/i);
            if (absMatch) {
                let hours = parseInt(absMatch[1], 10);
                const minutes = parseInt(absMatch[2], 10);
                const period = absMatch[3] ? absMatch[3].toLowerCase() : null;
                alarmText = (absMatch[4] || '').trim() || 'Waktunya Bangun!';

                const isTomorrow = body.toLowerCase().includes('besok');
                if (period === 'malam' && hours < 12) hours += 12;
                if (period === 'siang' && hours < 12 && hours >= 1) hours += 12;
                if (period === 'sore' && hours < 12) hours += 12;

                const targetDate = new Date();
                targetDate.setHours(hours, minutes, 0, 0);

                if (isTomorrow || targetDate.getTime() <= now) {
                    targetDate.setDate(targetDate.getDate() + 1);
                }

                targetTimestamp = targetDate.getTime();
            }
        }

        // Pattern 3: Simple hour format e.g. "jam 5 bangun", "jam 4 pagi bangun"
        if (!targetTimestamp) {
            const simpleMatch = body.match(/^(?:besok\s+)?jam\s+(\d{1,2})(?:\s+(pagi|siang|sore|malam))?\s*(.*)$/i);
            if (simpleMatch) {
                let hours = parseInt(simpleMatch[1], 10);
                const period = simpleMatch[2] ? simpleMatch[2].toLowerCase() : null;
                alarmText = (simpleMatch[3] || '').trim() || 'Waktunya Bangun!';

                if (period === 'malam' && hours < 12) hours += 12;
                if (period === 'siang' && hours < 12 && hours >= 1) hours += 12;
                if (period === 'sore' && hours < 12) hours += 12;

                const targetDate = new Date();
                targetDate.setHours(hours, 0, 0, 0);

                if (body.toLowerCase().includes('besok') || targetDate.getTime() <= now) {
                    targetDate.setDate(targetDate.getDate() + 1);
                }

                targetTimestamp = targetDate.getTime();
            }
        }

        if (!targetTimestamp) return null;

        const dateObj = new Date(targetTimestamp);
        const formattedTime = dateObj.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta'
        }) + ' WIB';

        return {
            targetTimestamp,
            alarmText,
            formattedTime
        };
    }

    /**
     * Creates a new aggressive alarm in SQLite
     * @param {string} chatId 
     * @param {number} targetTimestamp 
     * @param {string} alarmText 
     * @returns {number} Inserted ID
     */
    static createAlarm(chatId, targetTimestamp, alarmText) {
        this.init();
        const stmt = this.db.prepare(`
            INSERT INTO aggressive_alarms (chat_id, target_timestamp, alarm_text, status, created_at, last_triggered, trigger_count)
            VALUES (?, ?, ?, 'PENDING', ?, 0, 0)
        `);
        const result = stmt.run(chatId, targetTimestamp, alarmText, Date.now());
        return result.lastInsertRowid;
    }

    /**
     * Checks if user message contains the wake-up password to stop firing alarms
     * @param {string} text 
     * @param {string} chatId 
     * @returns {{ stopped: boolean, count: number, message: string } | null}
     */
    static checkStopPassword(text, chatId) {
        if (!text) return null;
        this.init();

        const clean = text.trim().toLowerCase();
        const stopKeywords = [
            'aku udah bangun', 'aku dah bangun', 'udah bangun', 'sudah bangun',
            'stop alarm', 'matiin alarm', 'matikan alarm', 'matikan', 'matiin'
        ];

        const isMatch = stopKeywords.some(kw => clean === kw || clean.includes(kw));
        if (!isMatch) return null;

        // Check if there are active firing or pending alarms
        const stmt = this.db.prepare(`
            SELECT id, alarm_text, status FROM aggressive_alarms
            WHERE status IN ('FIRING', 'PENDING')
        `);
        const activeRows = stmt.all();

        if (!activeRows || activeRows.length === 0) return null;

        // Update all firing or pending alarms to STOPPED
        const updateStmt = this.db.prepare(`
            UPDATE aggressive_alarms
            SET status = 'STOPPED'
            WHERE status IN ('FIRING', 'PENDING')
        `);
        updateStmt.run();

        const wasFiring = activeRows.some(r => r.status === 'FIRING');

        return {
            stopped: true,
            count: activeRows.length,
            wasFiring,
            message: wasFiring
                ? `☀️ *ALARM GALAK BERHASIL DIMATIKAN!*\n━━━━━━━━━━━━━━━━━━\nSelamat pagi Bos Agus Salim! 🚀\nAlarm sudah dimatikan total. Segera cuci muka dan minum air putih biar segar. Semoga harinya berkah & produktif! 💪`
                : `✅ *ALARM GALAK DIBATALKAN!*\n━━━━━━━━━━━━━━━━━━\nSemua antrean alarm galak (${activeRows.length}) telah dinonaktifkan.`
        };
    }

    /**
     * Get active alarms
     */
    static getActiveAlarms() {
        this.init();
        const stmt = this.db.prepare(`
            SELECT id, target_timestamp, alarm_text, status, trigger_count
            FROM aggressive_alarms
            WHERE status IN ('PENDING', 'FIRING')
            ORDER BY target_timestamp ASC
        `);
        return stmt.all();
    }

    /**
     * Start background daemon ticking every 15s
     * @param {any} waGateway 
     */
    static startDaemon(waGateway) {
        this.waGateway = waGateway;
        this.init();

        if (this.daemonInterval) {
            clearInterval(this.daemonInterval);
        }

        this.daemonInterval = setInterval(async () => {
            try {
                await this.tick();
            } catch (err) {
                console.error('[AggressiveAlarm] ❌ Daemon tick error:', err.message);
            }
        }, 15000);

        console.log('[AggressiveAlarm] 🚀 Background daemon active (checking every 15s, firing loop every 60s)');
    }

    /**
     * Daemon tick logic
     */
    static async tick() {
        if (!this.waGateway) return;
        this.init();

        const now = Date.now();

        // 1. Check PENDING alarms that reached target_timestamp
        const pendingStmt = this.db.prepare(`
            SELECT id, chat_id, target_timestamp, alarm_text
            FROM aggressive_alarms
            WHERE status = 'PENDING' AND target_timestamp <= ?
        `);
        const dueAlarms = pendingStmt.all(now);

        for (const alarm of dueAlarms) {
            const updateStmt = this.db.prepare(`
                UPDATE aggressive_alarms
                SET status = 'FIRING', last_triggered = ?, trigger_count = 1
                WHERE id = ?
            `);
            updateStmt.run(now, alarm.id);
            await this.fireAlarm(alarm, 1);
        }

        // 2. Check FIRING alarms that need repeat (every 60s)
        const firingStmt = this.db.prepare(`
            SELECT id, chat_id, target_timestamp, alarm_text, trigger_count, last_triggered
            FROM aggressive_alarms
            WHERE status = 'FIRING'
        `);
        const firingAlarms = firingStmt.all();

        for (const alarm of firingAlarms) {
            // Safety: cap at 15 repeats (~15 minutes) to prevent endless loop if phone abandoned
            if (alarm.trigger_count >= 15) {
                const dismissStmt = this.db.prepare(`
                    UPDATE aggressive_alarms SET status = 'EXPIRED' WHERE id = ?
                `);
                dismissStmt.run(alarm.id);
                const expiredMsg = `⚠️ *ALARM GALAK BERHENTI OTOMATIS*\nAlarm *"${alarm.alarm_text}"* sudah berbunyi 15 kali tanpa respon sandi. Alarm dinonaktifkan demi baterai perangkat.`;
                await this.waGateway.sendText(alarm.chat_id, expiredMsg);
                continue;
            }

            // If 60s passed since last triggered
            if (now - alarm.last_triggered >= 55000) {
                const newCount = alarm.trigger_count + 1;
                const updateStmt = this.db.prepare(`
                    UPDATE aggressive_alarms
                    SET last_triggered = ?, trigger_count = ?
                    WHERE id = ?
                `);
                updateStmt.run(now, newCount, alarm.id);
                await this.fireAlarm(alarm, newCount);
            }
        }
    }

    /**
     * Fires the alarm alert (Text + Voice Note PTT)
     * @param {any} alarm 
     * @param {number} count 
     */
    static async fireAlarm(alarm, count) {
        const timeStr = new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Jakarta'
        }) + ' WIB';

        const textMsg = `🚨🚨 *ALARM GALAK SALIM OS - BANGUN WOI!* 🚨🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Waktu Saat Ini: *${timeStr}*
🔔 Bunyi Ke: *${count}*
📝 Agenda / Pesan:
👉 *"${alarm.alarm_text}"*

⚠️ *ALARM INI AKAN TERUS BERBUNYI SETIAP 60 DETIK SAMPAI BOS BANGUN!*

Ketik sandi ini untuk mematikan:
👉 *"aku udah bangun"* atau *"stop alarm"*
━━━━━━━━━━━━━━━━━━━━━━━━━━`;

        try {
            await this.waGateway.sendText(alarm.chat_id, textMsg);
        } catch (err) {
            console.warn('[AggressiveAlarm] ⚠️ Failed sending text alert:', err.message);
        }

        // Voice Note Urgent Alert
        try {
            const voiceScript = `Bos Agus Salim, bangun sekarang! Waktu sudah jam ${timeStr}. Alarm ${alarm.alarm_text}. Bangun woi dan ketik aku udah bangun untuk mematikan alarm!`;
            const audioBuf = await VoiceSynthesizer.synthesizeVoiceNote(voiceScript);
            if (audioBuf && this.waGateway?.sock?.sendMessage) {
                await this.waGateway.sock.sendMessage(alarm.chat_id, {
                    audio: audioBuf,
                    mimetype: 'audio/mp4',
                    ptt: true
                });
            }
        } catch (err) {
            console.warn('[AggressiveAlarm] ⚠️ Failed sending alarm VN:', err.message);
        }
    }
}
