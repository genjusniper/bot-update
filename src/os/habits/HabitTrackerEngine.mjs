// src/os/habits/HabitTrackerEngine.mjs
// Daily Habit Tracker & Streak Counter for Salim OS
// Persisted in SQLite with natural Indonesian language parser and streak milestones

import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

export class HabitTrackerEngine {
    static db = null;
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
            CREATE TABLE IF NOT EXISTS habits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id TEXT NOT NULL,
                habit_name TEXT NOT NULL,
                normalized_name TEXT NOT NULL,
                target_frequency TEXT DEFAULT 'DAILY',
                current_streak INTEGER DEFAULT 0,
                longest_streak INTEGER DEFAULT 0,
                last_completed_date TEXT,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS habit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                habit_id INTEGER NOT NULL,
                chat_id TEXT NOT NULL,
                log_date TEXT NOT NULL,
                notes TEXT,
                created_at INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_habits_chat ON habits(chat_id, normalized_name);
            CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(habit_id, log_date);
        `);

        this.initialized = true;
        console.log('[HabitTracker] 🔥 Initialized SQLite tables for habits');
    }

    /**
     * Get today's date in YYYY-MM-DD (Asia/Jakarta)
     * @returns {string}
     */
    static getTodayDateStr() {
        const now = new Date();
        const jktStr = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
        return jktStr; // Returns YYYY-MM-DD
    }

    /**
     * Get yesterday's date in YYYY-MM-DD (Asia/Jakarta)
     * @returns {string}
     */
    static getYesterdayDateStr() {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    }

    /**
     * Parse natural completion report
     * e.g. "sudah push up 30x", "udah baca buku 15 menit", "tadi udah olahraga"
     * @param {string} text 
     * @returns {{ action: 'LOG' | 'LIST' | 'ADD' | 'HELP', habitName?: string, notes?: string } | null}
     */
    static parseNaturalHabit(text = '') {
        if (!text) return null;
        const clean = text.trim();

        // 1. List habits: "!habit", "!habits", "cek habit", "daftar habit"
        if (/^(!habit|!habits|cek\s+habit|daftar\s+habit|rekap\s+habit)$/i.test(clean)) {
            return { action: 'LIST' };
        }

        // 2. Add habit manually: "!habit tambah <nama habit>"
        const addMatch = clean.match(/^!habit\s+tambah\s+(.+)$/i);
        if (addMatch) {
            return { action: 'ADD', habitName: addMatch[1].trim() };
        }

        // 3. Mark completed via command: "!habit selesai <nama habit>"
        const doneMatch = clean.match(/^!habit\s+(?:selesai|done|check)\s+(.+)$/i);
        if (doneMatch) {
            return { action: 'LOG', habitName: doneMatch[1].trim(), notes: 'Via command' };
        }

        // 4. Natural Indonesian completion phrases:
        // "sudah push up 30x", "udah baca buku 20 menit", "tadi udah sholat tahajud", "tuntas olahraga"
        const naturalRegex = /^(?:tadi\s+)?(?:sudah|udah|tuntas|kelar|berhasil)\s+([a-zA-Z0-9_\s]{3,35})$/i;
        const match = clean.match(naturalRegex);
        if (match) {
            const rawBody = match[1].trim();

            // Filter out common conversational phrases that aren't habits
            const nonHabits = ['makan', 'tidur', 'bangun', 'mandi', 'nyampe', 'sampai', 'paham', 'mengerti', 'baca pesan', 'kirim', 'siap'];
            if (nonHabits.includes(rawBody.toLowerCase())) return null;

            return { action: 'LOG', habitName: rawBody, notes: clean };
        }

        return null;
    }

    /**
     * Logs a habit as completed for today
     * @param {string} chatId 
     * @param {string} habitName 
     * @param {string} notes 
     * @returns {string} Response formatted for WhatsApp
     */
    static logHabit(chatId, habitName, notes = '') {
        this.init();
        const cleanName = habitName.trim();
        const normName = cleanName.toLowerCase();
        const today = this.getTodayDateStr();
        const yesterday = this.getYesterdayDateStr();
        const now = Date.now();

        // Find existing habit by normalized name or partial match
        const selectStmt = this.db.prepare(`
            SELECT id, habit_name, current_streak, longest_streak, last_completed_date
            FROM habits
            WHERE chat_id = ? AND (normalized_name = ? OR normalized_name LIKE ? OR ? LIKE '%' || normalized_name || '%')
            LIMIT 1
        `);
        let habit = selectStmt.get(chatId, normName, `%${normName}%`, normName);

        // If not found, create new habit automatically
        if (!habit) {
            const insertStmt = this.db.prepare(`
                INSERT INTO habits (chat_id, habit_name, normalized_name, current_streak, longest_streak, last_completed_date, created_at)
                VALUES (?, ?, ?, 1, 1, ?, ?)
            `);
            const res = insertStmt.run(chatId, cleanName, normName, today, now);
            const newId = res.lastInsertRowid;

            // Log entry
            const logStmt = this.db.prepare(`
                INSERT INTO habit_logs (habit_id, chat_id, log_date, notes, created_at)
                VALUES (?, ?, ?, ?, ?)
            `);
            logStmt.run(newId, chatId, today, notes, now);

            return `🔥 *HABIT BARU DICATAT: ${cleanName}!* 🔥\n` +
                   `━━━━━━━━━━━━━━━━━━\n` +
                   `🎉 Langkah awal yang mantap Bos Agus Salim!\n` +
                   `🔥 *Streak:* 1 Hari (Hari Pertama)\n` +
                   `📝 *Catatan:* ${notes || cleanName}\n\n` +
                   `_Konsistensi harian adalah kunci transformasi diri._`;
        }

        // Check if already completed today
        if (habit.last_completed_date === today) {
            return `✅ *HABIT SUDAH TUNTAS HARI INI!*\n` +
                   `━━━━━━━━━━━━━━━━━━\n` +
                   `Habit *${habit.habit_name}* sudah tercatat tuntas untuk hari ini (${today}).\n` +
                   `🔥 *Streak Bertahan:* ${habit.current_streak} Hari berturut-turut!\n\n` +
                   `_Keren, pertahankan konsistensinya ya Bos!_`;
        }

        // Calculate streak
        let newStreak = 1;
        if (habit.last_completed_date === yesterday) {
            newStreak = habit.current_streak + 1;
        }

        const longest = Math.max(habit.longest_streak, newStreak);

        // Update habit
        const updateStmt = this.db.prepare(`
            UPDATE habits
            SET current_streak = ?, longest_streak = ?, last_completed_date = ?
            WHERE id = ?
        `);
        updateStmt.run(newStreak, longest, today, habit.id);

        // Insert log
        const logStmt = this.db.prepare(`
            INSERT INTO habit_logs (habit_id, chat_id, log_date, notes, created_at)
            VALUES (?, ?, ?, ?, ?)
        `);
        logStmt.run(habit.id, chatId, today, notes, now);

        let streakEmoji = '🔥';
        if (newStreak >= 7) streakEmoji = '⚡🔥';
        if (newStreak >= 30) streakEmoji = '👑🔥';

        return `${streakEmoji} *HABIT TUNTAS: ${habit.habit_name}!* ${streakEmoji}\n` +
               `━━━━━━━━━━━━━━━━━━\n` +
               `Mantap luar biasa Bos Agus Salim!\n` +
               `🔥 *Streak Saat Ini:* *${newStreak} Hari Berturut-turut!*\n` +
               `🏆 *Rekor Terpanjang:* ${longest} Hari\n` +
               `📅 *Tanggal:* ${today}\n\n` +
               `_Disiplin adalah jembatan antara tujuan dan pencapaian nyata._`;
    }

    /**
     * Lists all habits and their streaks
     * @param {string} chatId 
     * @returns {string}
     */
    static formatHabitList(chatId) {
        this.init();
        const stmt = this.db.prepare(`
            SELECT habit_name, current_streak, longest_streak, last_completed_date
            FROM habits
            WHERE chat_id = ?
            ORDER BY current_streak DESC
        `);
        const rows = stmt.all(chatId);

        if (!rows || rows.length === 0) {
            return `🌱 *DAFTAR HABIT & STREAK SALIM OS*\n━━━━━━━━━━━━━━━━━━\n` +
                   `Belum ada habit yang tercatat Bos.\n` +
                   `Cukup ketik santai ke bot:\n` +
                   `• \`sudah push up 30x\`\n` +
                   `• \`sudah baca buku 15m\`\n` +
                   `• \`sudah sholat tahajud\`\n` +
                   `Salim OS akan otomatis mencatat dan menghitung streak harianmu!`;
        }

        const today = this.getTodayDateStr();
        let out = `🔥 *MONITORING KEBIASAAN & STREAK BOS AGUS* 🔥\n━━━━━━━━━━━━━━━━━━\n`;

        rows.forEach((h, idx) => {
            const isDoneToday = h.last_completed_date === today;
            const statusIcon = isDoneToday ? '✅' : '⏳';
            out += `${idx + 1}. ${statusIcon} *${h.habit_name}*\n` +
                   `   • Streak: *${h.current_streak} Hari* 🔥 (Rekor: ${h.longest_streak} Hari)\n` +
                   `   • Status Hari Ini: ${isDoneToday ? '_Sudah Tuntas_' : '_Belum Selesai_'}\n\n`;
        });

        out += `━━━━━━━━━━━━━━━━━━\n_Ketik "sudah <nama habit>" untuk menandai selesai._`;
        return out;
    }

    /**
     * Returns brief status for Daily Briefing
     * @param {string} chatId 
     * @returns {{ total: number, doneCount: number, pendingList: string[] }}
     */
    static getBriefingStats(chatId) {
        this.init();
        const stmt = this.db.prepare(`
            SELECT habit_name, current_streak, last_completed_date
            FROM habits
            WHERE chat_id = ?
        `);
        const rows = stmt.all(chatId);
        const today = this.getTodayDateStr();

        let doneCount = 0;
        const pendingList = [];

        for (const h of rows) {
            if (h.last_completed_date === today) {
                doneCount++;
            } else {
                pendingList.push(h.habit_name);
            }
        }

        return {
            total: rows.length,
            doneCount,
            pendingList
        };
    }
}
