// src/queue/JobQueue.mjs — UNIFIED SCHEMA V1, IDEMPOTENCY & NON-BLOCKING RETRY
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

export class JobQueue {
  static db = null;

  static init() {
    if (this.db) return;
    const memDir = path.resolve(process.cwd(), 'memory');
    if (!fs.existsSync(memDir)) fs.mkdirSync(memDir, { recursive: true });

    const dbPath = path.join(memDir, 'queue_v10.sqlite');
    this.db = new DatabaseSync(dbPath);
    
    this.db.exec("PRAGMA busy_timeout = 10000;");
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA synchronous = NORMAL;");
    
    // 1. Jobs Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        eventId TEXT UNIQUE,
        correlationId TEXT,
        chatId TEXT,
        payload TEXT,
        status TEXT DEFAULT 'QUEUED',
        attempts INTEGER DEFAULT 0,
        claimedAt INTEGER,
        leaseUntil INTEGER,
        claimToken TEXT,
        lastError TEXT,
        createdAt INTEGER,
        updatedAt INTEGER
      );
    `);

    // 2. Idempotency Table (Deduplicate Reconnect / Replay Events)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS processed_messages (
        message_id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        processed_at INTEGER NOT NULL
      );
    `);

    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_chatid_status ON jobs(chatId, status);`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_proc_msg_time ON processed_messages(processed_at);`);
    
    this.purgeJunkJobs();
    this.pruneOldProcessedMessages();
  }

  static purgeJunkJobs() {
    try {
      // ONLY purge newsletters and status broadcast. NEVER PURGE GROUPS (@g.us)!
      this.db.exec("DELETE FROM jobs WHERE chatId = 'status@broadcast' OR chatId LIKE '%@newsletter';");
    } catch(e) {}
  }

  static pruneOldProcessedMessages(maxAgeHours = 24) {
    try {
      const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      this.db.prepare("DELETE FROM processed_messages WHERE processed_at < ?").run(cutoff);
    } catch(e) {}
  }

  static isMessageProcessed(messageId) {
    if (!messageId) return false;
    if (!this.db) this.init();
    try {
      const row = this.db.prepare("SELECT 1 FROM processed_messages WHERE message_id = ?").get(messageId);
      return Boolean(row);
    } catch (e) {
      return false;
    }
  }

  static markMessageProcessed(messageId, chatId) {
    if (!messageId || !chatId) return false;
    if (!this.db) this.init();
    try {
      this.db.prepare("INSERT OR IGNORE INTO processed_messages (message_id, chat_id, processed_at) VALUES (?, ?, ?)")
        .run(messageId, chatId, Date.now());
      return true;
    } catch (e) {
      return false;
    }
  }

  static close() {
    if (this.db) {
      try { this.db.close(); } catch(e) {}
      this.db = null;
      console.log('[JobQueue] DB connection closed.');
    }
  }

  static withRetry(operation, maxRetries = 3) {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        return operation();
      } catch (e) {
        if (e.message.includes('database is locked') || e.code === 'ERR_SQLITE_ERROR') {
          attempts++;
          if (attempts >= maxRetries) throw e;
          // SQLite PRAGMA busy_timeout=10000 already waits internally.
          // Do NOT busy-spin the CPU with while loop!
        } else {
          throw e;
        }
      }
    }
  }

  static sweepStaleJobs() {
    if (!this.db) this.init();
    try {
      this.withRetry(() => {
        const now = Date.now();
        this.db.prepare("UPDATE jobs SET status = 'QUEUED', updatedAt = ?, claimToken = NULL WHERE status = 'PROCESSING' AND leaseUntil <= ?").run(now, now);
        this.db.prepare("UPDATE jobs SET status = 'DEAD_LETTER', updatedAt = ?, claimToken = NULL WHERE status = 'QUEUED' AND attempts >= 3").run(now);
      });
    } catch(e) {
      console.warn('[Queue Sweeper] ⚠️ Sweep skipped due to DB lock.');
    }
  }

  static enqueue(eventId, correlationId, chatId, payloadObj) {
    // Only reject status broadcasts and newsletters. GROUPS (@g.us) ARE ALLOWED!
    if (!chatId || chatId === 'status@broadcast' || chatId.endsWith('@newsletter')) {
        return false;
    }

    if (!this.db) this.init();
    try {
      return this.withRetry(() => {
        this.db.prepare(`INSERT INTO jobs (eventId, correlationId, chatId, payload, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`)
          .run(eventId, correlationId, chatId, JSON.stringify(payloadObj), Date.now(), Date.now());
        return true;
      });
    } catch (e) {
      if (e.message.includes('UNIQUE')) return false;
      if (e.message.includes('database is locked')) return false;
      throw e;
    }
  }

  // Claim with Burst Aggregation (Schema V1 Compliant)
  static claim(leaseMs = 90000) {
    if (!this.db) this.init();
    try {
      return this.withRetry(() => {
        this.db.exec("BEGIN IMMEDIATE");
        try {
          const now = Date.now();
          const primaryJob = this.db.prepare(`
            SELECT * FROM jobs 
            WHERE status = 'QUEUED' AND attempts < 3
            AND chatId != 'status@broadcast' AND chatId NOT LIKE '%@newsletter'
            AND chatId NOT IN (SELECT chatId FROM jobs WHERE status = 'PROCESSING' AND leaseUntil > ?)
            ORDER BY id ASC LIMIT 1
          `).get(now);
          
          if (primaryJob) {
            const claimToken = crypto.randomUUID();
            const lease = now + leaseMs;
            
            // Find burst follow-up messages from the same chatId in queue
            const burstJobs = this.db.prepare(`
              SELECT * FROM jobs 
              WHERE chatId = ? AND status = 'QUEUED' AND id > ?
              ORDER BY id ASC
            `).all(primaryJob.chatId, primaryJob.id);

            this.db.prepare(`UPDATE jobs SET status = 'PROCESSING', claimedAt = ?, leaseUntil = ?, attempts = attempts + 1, claimToken = ?, updatedAt = ? WHERE id = ?`)
              .run(now, lease, claimToken, now, primaryJob.id);
            
            primaryJob.claimToken = claimToken;
            primaryJob.payload = JSON.parse(primaryJob.payload);

            // Safe text extraction across Schema V1 and Legacy
            const extractText = (p) => {
              if (!p) return '';
              if (p.message?.text) return p.message.text;
              if (p.text) return p.text;
              if (p.unifiedMsg?.text) return p.unifiedMsg.text;
              return '';
            };

            const primaryText = extractText(primaryJob.payload);

            // If there are burst follow-ups, merge texts safely and complete the extra jobs
            if (burstJobs && burstJobs.length > 0) {
              const combinedTexts = primaryText ? [primaryText] : [];
              for (const bJob of burstJobs) {
                const bPayload = JSON.parse(bJob.payload);
                const bText = extractText(bPayload);
                if (bText) combinedTexts.push(bText);

                // If burst job has images, merge them into primary job
                const bImages = bPayload.media?.images || bPayload.images || [];
                if (bImages.length > 0) {
                  if (!primaryJob.payload.media) primaryJob.payload.media = { images: [], audio: null };
                  if (!primaryJob.payload.media.images) primaryJob.payload.media.images = [];
                  primaryJob.payload.media.images.push(...bImages);
                }

                // Mark burst job completed
                this.db.prepare("UPDATE jobs SET status = 'COMPLETED', updatedAt = ? WHERE id = ?").run(now, bJob.id);
              }

              const merged = combinedTexts.join('\n');
              if (primaryJob.payload.message) {
                primaryJob.payload.message.text = merged;
              }
              primaryJob.payload.text = merged;
              console.log(`[JobQueue] ⚡ Aggregated ${burstJobs.length + 1} burst messages for ${primaryJob.chatId}: "${merged.slice(0, 50)}"`);
            }

            this.db.exec("COMMIT");
            return primaryJob;
          }
          this.db.exec("COMMIT");
          return null;
        } catch(innerErr) {
          try { this.db.exec("ROLLBACK"); } catch(ex){}
          throw innerErr;
        }
      });
    } catch(e) {
      if (e.message.includes('database is locked')) return null;
      throw e;
    }
  }

  static complete(id, claimToken) {
    try {
      return this.withRetry(() => {
        const info = this.db.prepare("UPDATE jobs SET status = 'COMPLETED', updatedAt = ? WHERE id = ? AND claimToken = ? AND status = 'PROCESSING'")
          .run(Date.now(), id, claimToken);
        return info.changes > 0;
      });
    } catch(e) {
      if (e.message.includes('database is locked')) return false;
      throw e;
    }
  }

  static fail(id, claimToken, errorMessage) {
    try {
      return this.withRetry(() => {
        const info = this.db.prepare("UPDATE jobs SET status = 'QUEUED', lastError = ?, updatedAt = ?, claimToken = NULL WHERE id = ? AND claimToken = ? AND status = 'PROCESSING'")
          .run(errorMessage, Date.now(), id, claimToken);
        return info.changes > 0;
      });
    } catch(e) {
      if (e.message.includes('database is locked')) return false;
      throw e;
    }
  }
}
