// src/core/tools/ExpenseTracker.mjs
// Lightweight, zero-dependency expense tracker for WhatsApp
import fs from 'fs';
import path from 'path';

const EXPENSES_FILE = path.resolve(process.cwd(), 'data/expenses.json');

export class ExpenseTracker {
    static getExpenses() {
        try {
            if (fs.existsSync(EXPENSES_FILE)) {
                return JSON.parse(fs.readFileSync(EXPENSES_FILE, 'utf8'));
            }
        } catch (e) {}
        return [];
    }

    static saveExpenses(list) {
        try {
            const dir = path.dirname(EXPENSES_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(EXPENSES_FILE, JSON.stringify(list, null, 2), 'utf8');
        } catch (e) {
            console.error('[ExpenseTracker] Error saving:', e.message);
        }
    }

    static parseAmount(str) {
        if (!str) return 0;
        let s = str.toLowerCase().replace(/,/g, '').trim();
        let multiplier = 1;
        if (s.endsWith('jt') || s.endsWith('juta')) {
            multiplier = 1000000;
            s = s.replace(/jt|juta/g, '').trim();
        } else if (s.endsWith('rb') || s.endsWith('k') || s.endsWith('ribu')) {
            multiplier = 1000;
            s = s.replace(/rb|k|ribu/g, '').trim();
        }
        const num = parseFloat(s.replace(/\./g, ''));
        return isNaN(num) ? 0 : Math.round(num * multiplier);
    }

    /**
     * Inspects text for expense logging or report command
     * @param {string} text 
     * @param {string} senderJid 
     * @returns {{ handled: boolean, response?: string }}
     */
    static processText(text = '', senderJid = '') {
        const clean = (text || '').trim();
        const lower = clean.toLowerCase();

        // 1. Report request: "/rekap", "rekap pengeluaran", "cek pengeluaran"
        if (lower === '/rekap' || lower.includes('rekap pengeluaran') || lower.includes('total pengeluaran') || lower === 'rekap') {
            const list = this.getExpenses();
            if (list.length === 0) {
                return { handled: true, response: '📊 *REKAP PENGELUARAN*\nBelum ada catatan pengeluaran tersimpan.' };
            }

            const todayStr = new Date().toISOString().split('T')[0];
            const thisMonthStr = todayStr.slice(0, 7);

            let todayTotal = 0;
            let monthTotal = 0;
            const recent = list.slice(-5).reverse();

            for (const item of list) {
                const itemDay = new Date(item.timestamp).toISOString().split('T')[0];
                if (itemDay === todayStr) todayTotal += item.amount;
                if (itemDay.startsWith(thisMonthStr)) monthTotal += item.amount;
            }

            let out = '📊 *REKAP PENGELUARAN*\n──────────────────\n';
            out += '• *Hari ini:* Rp ' + todayTotal.toLocaleString('id-ID') + '\n';
            out += '• *Bulan ini:* Rp ' + monthTotal.toLocaleString('id-ID') + '\n\n';
            out += '📝 *5 Catatan Terakhir:*\n';
            for (const r of recent) {
                const time = new Date(r.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                out += '• ' + r.item + ': Rp ' + r.amount.toLocaleString('id-ID') + ' (' + time + ')\n';
            }
            return { handled: true, response: out.trim() };
        }

        // 2. Add expense: "catat bensin 50rb", "pengeluaran makan 25k", "catat 35000 buat makan"
        const match = lower.match(/^(?:catat|catet|tulis|tambah)?\s*(?:pengeluaran|jajan|beli|bayar)?\s*([a-zA-Z0-9\s]+?)\s*(\d+[\d\.,]*(?:rb|k|ribu|jt|juta)?)\s*$/i) ||
                      lower.match(/^(?:catat|catet)?\s*pengeluaran\s*:\s*([a-zA-Z0-9\s]+)\s+(\d+[\d\.,]*(?:rb|k|ribu|jt|juta)?)/i);

        if (match && (lower.startsWith('catat') || lower.startsWith('catet') || lower.startsWith('pengeluaran') || lower.startsWith('beli '))) {
            const itemDesc = match[1].replace(/^(beli|jajan|bayar|buat|untuk)\s+/i, '').trim();
            const amount = this.parseAmount(match[2]);

            if (amount > 0 && itemDesc.length >= 2) {
                const list = this.getExpenses();
                const record = {
                    id: Date.now().toString(),
                    item: itemDesc,
                    amount,
                    timestamp: Date.now(),
                    sender: senderJid
                };
                list.push(record);
                this.saveExpenses(list);

                const todayStr = new Date().toISOString().split('T')[0];
                const todayTotal = list
                    .filter(x => new Date(x.timestamp).toISOString().split('T')[0] === todayStr)
                    .reduce((sum, x) => sum + x.amount, 0);

                return {
                    handled: true,
                    response: '✅ *Dicatat:* ' + itemDesc + ' seharga *Rp ' + amount.toLocaleString('id-ID') + '*\n💰 *Total pengeluaran hari ini:* Rp ' + todayTotal.toLocaleString('id-ID')
                };
            }
        }

        return { handled: false };
    }
}
