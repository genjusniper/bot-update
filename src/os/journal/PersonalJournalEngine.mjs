// src/os/journal/PersonalJournalEngine.mjs
// Daily Journal & Psychological Growth Reflection Engine for Salim OS
// Persisted in SQLite with AI-driven psychological feedback & Stoic mental models

import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

export class PersonalJournalEngine {
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
            CREATE TABLE IF NOT EXISTS personal_journal (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id TEXT NOT NULL,
                entry_date TEXT NOT NULL,
                content TEXT NOT NULL,
                psychological_feedback TEXT,
                sentiment TEXT DEFAULT 'REFLECTIVE',
                created_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_journal_chat ON personal_journal(chat_id, entry_date);
        `);

        this.initialized = true;
        console.log('[PersonalJournal] 📖 Initialized SQLite table for personal journal');
    }

    /**
     * Parse natural journal request
     * @param {string} text 
     * @returns {{ action: 'RECORD' | 'RECAP' | 'HELP', content?: string } | null}
     */
    static parseNaturalJournal(text = '') {
        if (!text) return null;
        const clean = text.trim();

        // 1. Recap: "!jurnal rekap", "!jurnal list", "baca jurnal"
        if (/^(!jurnal\s+rekap|!jurnal\s+list|rekap\s+jurnal|baca\s+jurnal)$/i.test(clean)) {
            return { action: 'RECAP' };
        }

        // 2. Record: "catat jurnal: ...", "tulis jurnal: ...", "!jurnal <isi>", "jurnal hari ini: ..."
        const recordRegex = /^(?:!jurnal|(?:tolong\s+)?(?:catat|tulis)\s+jurnal|jurnal\s+hari\s+ini)[:\s-]+(.+)$/is;
        const match = clean.match(recordRegex);
        if (match) {
            const body = match[1].trim();
            if (body.length >= 5) {
                return { action: 'RECORD', content: body };
            }
        }

        return null;
    }

    /**
     * Generate psychological insight using Gemini Flash Lite or Stoic fallback
     * @param {string} journalText 
     * @returns {Promise<string>}
     */
    static async generatePsychologicalInsight(journalText) {
        const rawKey = process.env.GEMINI_API_KEY || '';
        const apiKey = rawKey.split(',')[0].trim();

        if (apiKey) {
            const prompt = `Kamu adalah psikolog pribadi & mentor hidup yang bijaksana, hangat, dan realistis untuk Bos Agus Salim.
Bos baru saja menuliskan refleksi / jurnal harian berikut:

"""
${journalText}
"""

TUGASMU:
Berikan umpan balik psikologis (2-3 kalimat saja) yang:
1. Mengapresiasi kejujuran perasaannya dan validasi emosinya.
2. Memberikan perspektif kedewasaan, ketenangan batin (Stoikisme/mindset bertumbuh), atau solusi realistis.
3. Gaya bahasa: hangat, cerdas, bersahabat, khas sahabat seperjuangan. Jangan menggurui atau memakai klise berlebihan.`;

            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.3,
                            maxOutputTokens: 300
                        }
                    }),
                    signal: AbortSignal.timeout(8000)
                });

                if (res.ok) {
                    const data = await res.json();
                    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (reply) return reply.trim();
                }
            } catch (err) {
                console.warn('[PersonalJournal] ⚠️ AI insight failed, using Stoic fallback:', err.message);
            }
        }

        // Fallback Stoic Reflections
        const fallbacks = [
            "Kemampuanmu menyadari dan merefleksikan dinamika hari ini adalah tanda kedewasaan mental yang nyata. Fokuslah pada apa yang berada di bawah kendalimu, dan lepaskan sisanya dengan tenang.",
            "Setiap pengalaman hari ini adalah bahan bakar untuk mempertajam kebijaksanaanmu. Tidak ada hari yang sia-sia selama ada pelajaran berharga yang dipetik.",
            "Keberanian untuk jujur pada diri sendiri adalah fondasi ketenangan sejati. Teruslah melangkah dengan kepala dingin dan hati yang lapang."
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    /**
     * Records a journal entry into SQLite
     * @param {string} chatId 
     * @param {string} content 
     * @returns {Promise<string>}
     */
    static async recordEntry(chatId, content) {
        this.init();
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'Asia/Jakarta'
        });
        const isoDate = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });

        const feedback = await this.generatePsychologicalInsight(content);

        const stmt = this.db.prepare(`
            INSERT INTO personal_journal (chat_id, entry_date, content, psychological_feedback, sentiment, created_at)
            VALUES (?, ?, ?, ?, 'REFLECTIVE', ?)
        `);
        stmt.run(chatId, isoDate, content, feedback, Date.now());

        return `📖 *JURNAL TERCATAT & TERSIMPAN AMAN* 📖\n` +
               `━━━━━━━━━━━━━━━━━━\n` +
               `📅 *Tanggal:* ${dateStr}\n` +
               `📝 *Refleksi Bos Agus:*\n"${content}"\n\n` +
               `🧠 *Catatan Psikologi & Kedewasaan Diri:*\n${feedback}\n` +
               `━━━━━━━━━━━━━━━━━━\n` +
               `_Tersimpan di brankas memori Salim OS._`;
    }

    /**
     * Reads recent journal entries
     * @param {string} chatId 
     * @returns {string}
     */
    static getRecentEntries(chatId, limit = 5) {
        this.init();
        const stmt = this.db.prepare(`
            SELECT entry_date, content, psychological_feedback, created_at
            FROM personal_journal
            WHERE chat_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        `);
        const rows = stmt.all(chatId, limit);

        if (!rows || rows.length === 0) {
            return `📖 *JURNAL PRIBADI MASIH KOSONG*\n━━━━━━━━━━━━━━━━━━\n` +
                   `Bos belum menulis jurnal harian.\n` +
                   `Cukup ketik: \`catat jurnal: <apa yang Bos rasakan atau pelajari hari ini>\``;
        }

        let out = `📖 *REKAP JURNAL REFLEKSI BOS AGUS* 📖\n━━━━━━━━━━━━━━━━━━\n`;
        rows.forEach((r, idx) => {
            out += `\n📌 *Entri #${idx + 1} (${r.entry_date})*\n` +
                   `"${r.content}"\n` +
                   `💡 _Insight: ${r.psychological_feedback}_\n`;
        });
        out += `\n━━━━━━━━━━━━━━━━━━\n_Ketik \`catat jurnal: ...\` untuk menambah refleksi baru._`;
        return out;
    }
}
