// src/os/crm/PeopleMemoryCRM.mjs
// People Memory & Dossier CRM for Salim OS
// Allows Bos to naturally record, search, and recall details about contacts, friends, and coworkers

import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

export class PeopleMemoryCRM {
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
            CREATE TABLE IF NOT EXISTS people_dossier (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                person_name TEXT NOT NULL,
                normalized_name TEXT NOT NULL UNIQUE,
                note_content TEXT NOT NULL,
                category TEXT DEFAULT 'general',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_crm_norm_name ON people_dossier(normalized_name);
        `);

        this.initialized = true;
        console.log('[PeopleCRM] 📇 Initialized SQLite table for people dossier');
    }

    /**
     * Add or update notes for a person
     * @param {string} personName 
     * @param {string} noteText 
     * @param {string} category 
     * @returns {string} Response confirmation
     */
    static recordNote(personName, noteText, category = 'general') {
        this.init();
        const cleanName = personName.trim();
        const normName = cleanName.toLowerCase();
        const cleanNote = noteText.trim();
        const now = Date.now();
        const dateStr = new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        const selectStmt = this.db.prepare(`
            SELECT id, person_name, note_content FROM people_dossier WHERE normalized_name = ?
        `);
        const existing = selectStmt.get(normName);

        if (existing) {
            const updatedContent = `${existing.note_content}\n• [${dateStr}] ${cleanNote}`;
            const updateStmt = this.db.prepare(`
                UPDATE people_dossier
                SET note_content = ?, updated_at = ?
                WHERE id = ?
            `);
            updateStmt.run(updatedContent, now, existing.id);

            return `📝 *CATATAN DIPERBARUI!*\n━━━━━━━━━━━━━━━━━━\n👤 *Nama:* *${existing.person_name}*\n📌 *Catatan Baru:* ${cleanNote}\n\n_Total riwayat tersimpan untuk ${existing.person_name}._`;
        } else {
            const initialContent = `• [${dateStr}] ${cleanNote}`;
            const insertStmt = this.db.prepare(`
                INSERT INTO people_dossier (person_name, normalized_name, note_content, category, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            insertStmt.run(cleanName, normName, initialContent, category, now, now);

            return `📇 *PROFIL BARU TERCATAT!*\n━━━━━━━━━━━━━━━━━━\n👤 *Nama:* *${cleanName}*\n📝 *Info:* ${cleanNote}\n\n_Tersimpan di Buku Catatan Teman Salim OS._`;
        }
    }

    /**
     * Look up dossier for a person
     * @param {string} personName 
     * @returns {string}
     */
    static getDossier(personName) {
        this.init();
        const normName = personName.trim().toLowerCase();

        // Exact match or partial match
        const stmt = this.db.prepare(`
            SELECT person_name, note_content, updated_at
            FROM people_dossier
            WHERE normalized_name = ? OR normalized_name LIKE ?
            LIMIT 1
        `);
        const row = stmt.get(normName, `%${normName}%`);

        if (!row) {
            return `🔍 Belum ada catatan untuk *"${personName}"* di memori Salim OS.\nBos bisa catat dengan format:\n\`catat tentang ${personName}: <info penting>\``;
        }

        const lastUpdated = new Date(row.updated_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `📇 *BUKU CATATAN TEMAN: ${row.person_name}*\n━━━━━━━━━━━━━━━━━━\n${row.note_content}\n\n━━━━━━━━━━━━━━━━━━\n_Terakhir diperbarui: ${lastUpdated} WIB_`;
    }

    /**
     * Search dossiers across all notes (e.g. "siapa yang punya tenda")
     * @param {string} query 
     * @returns {string}
     */
    static searchByKeyword(query) {
        this.init();
        const cleanQuery = query.trim().toLowerCase();

        const stmt = this.db.prepare(`
            SELECT person_name, note_content
            FROM people_dossier
            WHERE LOWER(note_content) LIKE ? OR normalized_name LIKE ?
            LIMIT 5
        `);
        const rows = stmt.all(`%${cleanQuery}%`, `%${cleanQuery}%`);

        if (!rows || rows.length === 0) {
            return `🔍 Tidak ditemukan catatan teman yang cocok dengan kata kunci: *"${query}"*.`;
        }

        let out = `🔍 *HASIL PENCARIAN MEMORI TEMAN: "${query}"*\n━━━━━━━━━━━━━━━━━━\n`;
        for (const r of rows) {
            out += `\n👤 *${r.person_name}*:\n${r.note_content}\n`;
        }
        out += `\n━━━━━━━━━━━━━━━━━━\n_Salim OS People CRM_`;
        return out;
    }

    /**
     * List all recorded contacts
     * @returns {string}
     */
    static listAll() {
        this.init();
        const stmt = this.db.prepare(`
            SELECT person_name, updated_at FROM people_dossier ORDER BY updated_at DESC LIMIT 30
        `);
        const rows = stmt.all();

        if (!rows || rows.length === 0) {
            return `📇 Buku Catatan Teman masih kosong Bos.\nKetik: \`catat tentang <nama>: <info>\` untuk mulai mencatat.`;
        }

        let out = `📇 *DAFTAR BUKU CATATAN TEMAN (${rows.length})*\n━━━━━━━━━━━━━━━━━━\n`;
        rows.forEach((r, idx) => {
            out += `${idx + 1}. *${r.person_name}*\n`;
        });
        out += `━━━━━━━━━━━━━━━━━━\n_Ketik \`info <nama>\` untuk melihat detail profil._`;
        return out;
    }

    /**
     * Natural command dispatcher
     * @param {string} text 
     * @returns {string | null}
     */
    static handleNaturalInput(text) {
        if (!text) return null;
        const clean = text.trim();

        // 1. Catat info baru: "catat tentang Hanif: ..." or "ingat tentang Hanif: ..." or "!crm catat Hanif: ..."
        const recordMatch = clean.match(/^(?:!crm\s+catat\s+|(?:tolong\s+)?(?:catat|ingat)(?:\s+tentang|\s+info)?\s+)([a-zA-Z0-9_\s]{2,25})[:,-]\s*(.+)$/i);
        if (recordMatch) {
            const name = recordMatch[1].trim();
            const note = recordMatch[2].trim();
            if (name && note) {
                return this.recordNote(name, note);
            }
        }

        // 2. Daftar semua: "!crm list" or "daftar teman"
        if (/^(!crm\s+list|daftar\s+catatan\s+teman|list\s+crm)$/i.test(clean)) {
            return this.listAll();
        }

        // 3. Cari siapa yang ...: "siapa yang punya tenda", "siapa yang kerja di ..."
        const whoMatch = clean.match(/^(?:siapa\s+yang\s+|siapa\s+punya\s+|cari\s+siapa\s+)(.+)$/i);
        if (whoMatch) {
            const kw = whoMatch[1].trim();
            if (kw.length >= 3) {
                return this.searchByKeyword(kw);
            }
        }

        // 4. Tanya profil: "!crm <nama>", "info <nama>", "siapa <nama>", "catatan tentang <nama>"
        const queryMatch = clean.match(/^(?:!crm\s+|(?:info|catatan\s+tentang|profil)\s+)([a-zA-Z0-9_\s]{2,25})$/i);
        if (queryMatch) {
            const targetName = queryMatch[1].trim();
            // Skip common commands
            if (!['hari ini', 'besok', 'shift', 'cuaca', 'gempa', 'sistem'].includes(targetName.toLowerCase())) {
                return this.getDossier(targetName);
            }
        }

        return null;
    }
}
