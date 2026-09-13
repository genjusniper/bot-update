// src/os/finance/SmartBudgetGuard.mjs
// Personal Financial Tracking & Smart Budget Overspend Guard for Salim OS
// Backed by SQLite persistence + natural expense parsing + weekly limit alerts

import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

export class SmartBudgetGuard {
    static db = null;
    static initialized = false;
    static DEFAULT_WEEKLY_BUDGET = 600000; // Rp 600.000 / week discretionary spending

    static init(dbPath) {
        if (this.initialized && this.db) return;
        const targetPath = dbPath || path.resolve(process.cwd(), 'memory', 'queue_v10.sqlite');
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        this.db = new DatabaseSync(targetPath);
        this.db.exec("PRAGMA journal_mode = WAL;");
        this.db.exec("PRAGMA busy_timeout = 5000;");

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS daily_expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id TEXT NOT NULL,
                amount INTEGER NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                date_str TEXT NOT NULL,
                created_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_expenses_date ON daily_expenses(date_str);
        `);

        this.initialized = true;
        console.log('[BudgetGuard] 💰 Initialized SQLite table for daily expenses');
    }

    static formatDateStr(date = new Date()) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    /**
     * Normalizes currency string (e.g. "25k", "25rb", "25.000", "25000") to integer
     */
    static parseAmount(str) {
        if (!str) return 0;
        let clean = str.toLowerCase().trim().replace(/rp/g, '').trim();

        if (clean.endsWith('k') || clean.endsWith('rb') || clean.endsWith('ribu')) {
            const num = parseFloat(clean.replace(/(k|rb|ribu)/g, '').replace(',', '.'));
            return Math.round(num * 1000);
        }

        clean = clean.replace(/[.,]/g, '');
        const parsed = parseInt(clean, 10);
        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * Detects expense category
     */
    static detectCategory(desc) {
        const d = desc.toLowerCase();
        if (d.includes('makan') || d.includes('kopi') || d.includes('jajan') || d.includes('nasi') || d.includes('es ') || d.includes('mie')) return 'Makan & Minum';
        if (d.includes('bensin') || d.includes('pertalite') || d.includes('pertamax') || d.includes('parkir') || d.includes('toll')) return 'Transport & Bensin';
        if (d.includes('wifi') || d.includes('pulsa') || d.includes('kuota') || d.includes('listrik')) return 'Tagihan & Utilitas';
        if (d.includes('tenda') || d.includes('gunung') || d.includes('carrier') || d.includes('gas') || d.includes('muncak')) return 'Hobi & Pendakian';
        return 'Lain-lain';
    }

    /**
     * Records an expense transaction
     */
    static recordExpense({ chatId, amount, description }) {
        if (!this.initialized) this.init();
        const now = Date.now();
        const dateStr = this.formatDateStr();
        const category = this.detectCategory(description);

        const stmt = this.db.prepare(`
            INSERT INTO daily_expenses (chat_id, amount, category, description, date_str, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(chatId, amount, category, description, dateStr, now);
        return {
            id: Number(result.lastInsertRowid),
            amount,
            category,
            description,
            dateStr
        };
    }

    /**
     * Gets total expenses for the current week (last 7 days)
     */
    static getWeeklyStats(chatId) {
        if (!this.initialized) this.init();
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const stmt = this.db.prepare(`
            SELECT SUM(amount) as total, COUNT(*) as count 
            FROM daily_expenses 
            WHERE created_at >= ?
        `);
        const row = stmt.get(sevenDaysAgo);
        return {
            total: row?.total || 0,
            count: row?.count || 0
        };
    }

    /**
     * Gets today's expenses list
     */
    static getTodayList(chatId) {
        if (!this.initialized) this.init();
        const dateStr = this.formatDateStr();
        const stmt = this.db.prepare(`
            SELECT id, amount, category, description, created_at 
            FROM daily_expenses 
            WHERE date_str = ?
            ORDER BY id ASC
        `);
        return stmt.all(dateStr) || [];
    }

    /**
     * Formats financial summary message
     */
    static formatSummary(chatId, weeklyLimit = this.DEFAULT_WEEKLY_BUDGET) {
        const todayItems = this.getTodayList(chatId);
        const weeklyStats = this.getWeeklyStats(chatId);

        const todayTotal = todayItems.reduce((acc, cur) => acc + cur.amount, 0);
        const remainingWeekly = Math.max(0, weeklyLimit - weeklyStats.total);
        const percentUsed = Math.min(100, Math.round((weeklyStats.total / weeklyLimit) * 100));

        let msg = `💰 *CATATAN PENGELUARAN BOS AGUS*\n━━━━━━━━━━━━━━━━━━\n`;
        msg += `📅 *Hari Ini:* Rp ${todayTotal.toLocaleString('id-ID')}\n`;

        if (todayItems.length > 0) {
            for (const item of todayItems) {
                msg += ` • ${item.description}: Rp ${item.amount.toLocaleString('id-ID')}\n`;
            }
        } else {
            msg += ` _(Belum ada pengeluaran dicatat hari ini)_\n`;
        }

        msg += `\n📊 *Total 7 Hari Terakhir:* Rp ${weeklyStats.total.toLocaleString('id-ID')} (${percentUsed}% dari jatah Rp ${weeklyLimit.toLocaleString('id-ID')})\n`;
        msg += `💵 *Sisa Jatah Mingguan:* Rp ${remainingWeekly.toLocaleString('id-ID')}\n`;

        if (percentUsed >= 80) {
            msg += `\n⚠️ *Peringatan:* Sudah pakai ${percentUsed}% dari batas budget. Rem jajan dulu ya Bos biar gak boncos!`;
        } else {
            msg += `\n✅ *Status Budget:* Aman & terkendali!`;
        }

        msg += `\n━━━━━━━━━━━━━━━━━━\n_Contoh catat: \`catat makan siang 25rb\` atau \`beli bensin 30000\`_`;
        return msg;
    }

    /**
     * Parses natural language expense text
     */
    static parseNaturalExpense(text) {
        if (!text) return null;
        const clean = text.trim();

        // Query summary
        if (/^(?:!pengeluaran|!rekapduit|!uang|rekap pengeluaran|cek pengeluaran)\b/i.test(clean)) {
            return { action: 'QUERY' };
        }

        // Pattern 1: "catat makan siang 25000", "beli bensin 30k", "jajan kopi 18rb", "bayar wifi 150rb"
        const p1 = clean.match(/^(?:catat\s+)?(?:beli|bayar|makan|jajan|pengeluaran|habis)\s+(.+?)\s+(\d+[\d.,]*\s*(?:k|rb|ribu)?)$/i);
        if (p1) {
            const desc = p1[1].trim();
            const amount = this.parseAmount(p1[2]);
            if (amount > 0 && desc.length > 1) {
                return { action: 'ADD', amount, description: desc };
            }
        }

        // Pattern 2: "catat pengeluaran 25000 buat makan siang"
        const p2 = clean.match(/^(?:catat\s+)?(?:pengeluaran|belanja)\s+(\d+[\d.,]*\s*(?:k|rb|ribu)?)\s*(?:buat|untuk)?\s+(.+)$/i);
        if (p2) {
            const amount = this.parseAmount(p2[1]);
            const desc = p2[2].trim();
            if (amount > 0 && desc.length > 1) {
                return { action: 'ADD', amount, description: desc };
            }
        }

        return null;
    }
}
