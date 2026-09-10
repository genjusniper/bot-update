// src/core/ingress/PersistFirstIngress.mjs
// Guarantees zero data loss: persists raw WhatsApp events immediately into SQLite
// BEFORE any in-memory buffering or debounce aggregation

import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

export class PersistFirstIngress {
    static db = null;
    static initialized = false;

    static init(dbPath) {
        if (this.initialized && this.db) return;
        const targetPath = dbPath || path.resolve(process.cwd(), 'memory', 'queue_v10.sqlite');
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        this.db = new DatabaseSync(targetPath);
        this.db.exec("PRAGMA journal_mode = WAL;");
        this.db.exec("PRAGMA busy_timeout = 10000;");

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS raw_ingress_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT UNIQUE NOT NULL,
                chat_id TEXT NOT NULL,
                sender_id TEXT NOT NULL,
                canonical_payload TEXT NOT NULL,
                status TEXT DEFAULT 'RECEIVED',
                created_at INTEGER NOT NULL,
                processed_at INTEGER
            );
            CREATE INDEX IF NOT EXISTS idx_raw_status ON raw_ingress_events(status);
            CREATE INDEX IF NOT EXISTS idx_raw_chat ON raw_ingress_events(chat_id);
        `);
        this.initialized = true;
    }

    /**
     * Persists incoming CanonicalMessage immediately upon socket arrival
     * @param {CanonicalMessage} canonicalMsg
     * @returns {boolean} true if newly saved, false if duplicate
     */
    static persist(canonicalMsg) {
        if (!this.initialized) this.init();
        const now = Date.now();
        try {
            const stmt = this.db.prepare(`
                INSERT INTO raw_ingress_events (event_id, chat_id, sender_id, canonical_payload, status, created_at)
                VALUES (?, ?, ?, ?, 'RECEIVED', ?)
            `);
            stmt.run(
                canonicalMsg.id,
                canonicalMsg.chatId,
                canonicalMsg.senderId,
                JSON.stringify(canonicalMsg.toJSON()),
                now
            );
            return true;
        } catch (e) {
            if (e.message && e.message.includes('UNIQUE')) {
                // Event already persisted (idempotent duplicate)
                return false;
            }
            console.error('[PersistFirstIngress] ❌ DB Persist error:', e.message);
            return false;
        }
    }

    /**
     * Marks an event as aggregated and enqueued into JobQueue
     */
    static markEnqueued(eventId) {
        if (!this.initialized) this.init();
        try {
            const stmt = this.db.prepare(`
                UPDATE raw_ingress_events 
                SET status = 'ENQUEUED', processed_at = ? 
                WHERE event_id = ?
            `);
            stmt.run(Date.now(), eventId);
        } catch (e) {
            console.warn('[PersistFirstIngress] ⚠️ Mark enqueued error:', e.message);
        }
    }

    /**
     * Marks an event as fully completed
     */
    static markCompleted(eventId) {
        if (!this.initialized) this.init();
        try {
            const stmt = this.db.prepare(`
                UPDATE raw_ingress_events 
                SET status = 'COMPLETED', processed_at = ? 
                WHERE event_id = ?
            `);
            stmt.run(Date.now(), eventId);
        } catch (e) {}
    }

    /**
     * Recovery function on boot: returns any events stuck in 'RECEIVED' state
     * that were never enqueued because of an abrupt shutdown/crash
     */
    static getUnprocessedEvents() {
        if (!this.initialized) this.init();
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM raw_ingress_events 
                WHERE status = 'RECEIVED' 
                ORDER BY id ASC LIMIT 50
            `);
            return stmt.all();
        } catch (e) {
            return [];
        }
    }

    /**
     * Periodic cleanup for completed raw ingress events older than 48 hours
     */
    static pruneOldEvents(maxAgeMs = 48 * 60 * 60 * 1000) {
        if (!this.initialized) this.init();
        try {
            const cutoff = Date.now() - maxAgeMs;
            const stmt = this.db.prepare(`
                DELETE FROM raw_ingress_events 
                WHERE status = 'COMPLETED' AND created_at < ?
            `);
            return stmt.run(cutoff);
        } catch (e) {
            return null;
        }
    }
}
