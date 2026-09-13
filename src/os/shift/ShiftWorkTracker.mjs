// src/os/shift/ShiftWorkTracker.mjs
// Work Shift & Tukar Shift Tracker for Salim OS
// Persisted in SQLite, integrated with auto-alarms and daily briefings

import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

export class ShiftWorkTracker {
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
            CREATE TABLE IF NOT EXISTS work_shifts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date_str TEXT UNIQUE NOT NULL,
                shift_type TEXT NOT NULL,
                notes TEXT,
                swapped_with TEXT,
                updated_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_shifts_date ON work_shifts(date_str);
        `);

        this.initialized = true;
        console.log('[ShiftTracker] 🗓️ Initialized SQLite table for work shifts');
    }

    /**
     * Formats Date to 'YYYY-MM-DD'
     * @param {Date} [date]
     * @returns {string}
     */
    static formatDateStr(date = new Date()) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    /**
     * Sets or updates shift for a given date
     */
    static setShift({ dateStr, shiftType, notes = '', swappedWith = '' }) {
        if (!this.initialized) this.init();
        const cleanType = (shiftType || '').toUpperCase().trim();
        const validTypes = ['PAGI', 'SIANG', 'MALAM', 'LIBUR', 'OFF'];
        const normalizedType = validTypes.includes(cleanType) ? (cleanType === 'OFF' ? 'LIBUR' : cleanType) : 'PAGI';

        const now = Date.now();
        const stmt = this.db.prepare(`
            INSERT INTO work_shifts (date_str, shift_type, notes, swapped_with, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(date_str) DO UPDATE SET
                shift_type = excluded.shift_type,
                notes = excluded.notes,
                swapped_with = excluded.swapped_with,
                updated_at = excluded.updated_at
        `);
        stmt.run(dateStr, normalizedType, notes, swappedWith, now);
        return { dateStr, shiftType: normalizedType, notes, swappedWith };
    }

    /**
     * Gets shift for a specific date
     */
    static getShift(dateStr) {
        if (!this.initialized) this.init();
        const stmt = this.db.prepare('SELECT * FROM work_shifts WHERE date_str = ?');
        return stmt.get(dateStr) || null;
    }

    /**
     * Gets shift for today
     */
    static getTodayShift() {
        return this.getShift(this.formatDateStr());
    }

    /**
     * Gets shift for tomorrow
     */
    static getTomorrowShift() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.getShift(this.formatDateStr(tomorrow));
    }

    /**
     * Gets upcoming shifts for the next N days
     */
    static getUpcomingShifts(days = 7) {
        if (!this.initialized) this.init();
        const shifts = [];
        const today = new Date();

        for (let i = 0; i < days; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const dStr = this.formatDateStr(d);
            const shift = this.getShift(dStr);
            shifts.push({
                date: d,
                dateStr: dStr,
                shiftType: shift?.shift_type || 'BELUM DICATAT',
                notes: shift?.notes || '',
                swappedWith: shift?.swapped_with || ''
            });
        }
        return shifts;
    }

    /**
     * Formats upcoming shifts as clean WhatsApp message
     */
    static formatScheduleMessage(days = 7) {
        const list = this.getUpcomingShifts(days);
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        let msg = `🗓️ *JADWAL KERJA SHIFT BOS AGUS*\n━━━━━━━━━━━━━━━━━━\n`;

        for (const item of list) {
            const dayName = dayNames[item.date.getDay()];
            const dateDisplay = `${item.date.getDate()} ${monthNames[item.date.getMonth()]}`;

            let icon = '🔹';
            let shiftTime = '';
            if (item.shiftType === 'PAGI') {
                icon = '🌅';
                shiftTime = ' (07:00 - 15:00)';
            } else if (item.shiftType === 'SIANG') {
                icon = '☀️';
                shiftTime = ' (15:00 - 23:00)';
            } else if (item.shiftType === 'MALAM') {
                icon = '🌙';
                shiftTime = ' (23:00 - 07:00)';
            } else if (item.shiftType === 'LIBUR') {
                icon = '🏖️';
                shiftTime = ' (Libur / Off)';
            }

            let swapInfo = item.swappedWith ? ` _(Tukar dg ${item.swappedWith})_` : '';
            let noteInfo = item.notes ? ` - ${item.notes}` : '';

            msg += `${icon} *${dayName}, ${dateDisplay}:* ${item.shiftType}${shiftTime}${swapInfo}${noteInfo}\n`;
        }

        msg += `━━━━━━━━━━━━━━━━━━\n` +
               `_Tips: Ketik \`besok aku shift pagi\` atau \`tukar shift sama Fikri jadi shift siang\` untuk update instan._`;
        return msg;
    }

    /**
     * Parses natural language shift inputs
     * @param {string} text 
     * @returns {{ action: string, data?: any } | null}
     */
    static parseNaturalShiftInput(text) {
        if (!text) return null;
        const clean = text.trim().toLowerCase();

        // 1. Query intent: "besok shift apa", "jadwal shift", "!shift", "hari ini shift apa"
        if (
            clean === '!shift' || clean === '/shift' || clean === '!jadwalshift' ||
            clean.includes('jadwal shift') || clean.includes('shift minggu ini') ||
            clean === 'besok shift apa' || clean === 'hari ini shift apa'
        ) {
            return { action: 'QUERY' };
        }

        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        // 2. Swapped shift: "tukar shift sama Fikri (besok/hari ini) jadi shift (pagi/siang/malam/libur)"
        const swapMatch = clean.match(/tukar\s+shift\s+(?:sama|dg|dengan)\s+([a-z0-9_]+)\s*(?:(besok|hari ini))?\s*(?:jadi\s+shift\s+|jadi\s+)?(pagi|siang|malam|libur|off)/i);
        if (swapMatch) {
            const person = swapMatch[1];
            const dayTarget = (swapMatch[2] || 'besok').toLowerCase();
            const shiftType = swapMatch[3].toUpperCase();
            const targetDate = dayTarget === 'hari ini' ? today : tomorrow;
            const dateStr = this.formatDateStr(targetDate);

            this.setShift({
                dateStr,
                shiftType,
                swappedWith: person,
                notes: `Tukar shift dengan ${person}`
            });

            return {
                action: 'SET',
                dateStr,
                targetDay: dayTarget,
                shiftType,
                swappedWith: person
            };
        }

        // 3. Simple single-day update: "besok (aku )?shift (pagi|siang|malam|libur)"
        const singleMatch = clean.match(/(?:catat\s+)?(besok|hari ini)\s+(?:aku\s+)?(?:masuk\s+)?shift\s+(pagi|siang|malam|libur|off)/i);
        if (singleMatch) {
            const dayTarget = singleMatch[1].toLowerCase();
            const shiftType = singleMatch[2].toUpperCase();
            const targetDate = dayTarget === 'hari ini' ? today : tomorrow;
            const dateStr = this.formatDateStr(targetDate);

            this.setShift({
                dateStr,
                shiftType
            });

            return {
                action: 'SET',
                dateStr,
                targetDay: dayTarget,
                shiftType
            };
        }

        // 4. Multi-day batch update: "catat shift: senin pagi, selasa pagi, rabu siang..."
        if (clean.startsWith('catat shift') || clean.startsWith('update shift')) {
            const dayMap = {
                senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6, minggu: 0
            };
            const items = clean.replace(/^(?:catat|update)\s+shift:?\s*/i, '').split(/[,;\n]+/);
            let recordedCount = 0;

            for (const item of items) {
                const m = item.trim().match(/(senin|selasa|rabu|kamis|jumat|sabtu|minggu)\s+(pagi|siang|malam|libur|off)/i);
                if (m) {
                    const targetDayIndex = dayMap[m[1].toLowerCase()];
                    const shiftType = m[2].toUpperCase();

                    // Calculate upcoming date with this day index
                    const d = new Date();
                    let diff = targetDayIndex - d.getDay();
                    if (diff < 0) diff += 7; // next occurrence
                    d.setDate(d.getDate() + diff);

                    this.setShift({
                        dateStr: this.formatDateStr(d),
                        shiftType
                    });
                    recordedCount++;
                }
            }

            if (recordedCount > 0) {
                return {
                    action: 'BATCH_SET',
                    count: recordedCount
                };
            }
        }

        return null;
    }
}
