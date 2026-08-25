// src/queue/JobQueue.mjs — WITH BURST AGGREGATION & ZERO NOISE
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

    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_chatid_status ON jobs(chatId, status);`);
    
    this.purgeJunkJobs();
  }

  static purgeJunkJobs() {
    try {
      this.db.exec("DELETE FROM jobs WHERE chatId = 'status@broadcast' OR chatId LIKE '%@g.us' OR chatId LIKE '%@newsletter';");
    } catch(e) {}
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
          const jitter = Math.floor(Math.random() * 150) + 50;
          const start = Date.now();
          while (Date.now() - start < jitter) {}
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
    if (!chatId || chatId === 'status@broadcast' || chatId.endsWith('@g.us') || chatId.endsWith('@newsletter')) {
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

  // Claim with Burst Aggregation: bundles multiple messages from same user into 1 turn!
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
            AND chatId != 'status@broadcast' AND chatId NOT LIKE '%@g.us' AND chatId NOT LIKE '%@newsletter'
            AND chatId NOT IN (SELECT chatId FROM jobs WHERE status = 'PROCESSING' AND leaseUntil > ?)
            ORDER BY id ASC LIMIT 1
          `).get(now);
          
          if (primaryJob) {
            const claimToken = crypto.randomUUID();
            const lease = now + leaseMs;
            
            // Find burst messages from the same chatId in queue to aggregate
            const burstJobs = this.db.prepare(`
              SELECT * FROM jobs 
              WHERE chatId = ? AND status = 'QUEUED' AND id > ?
              ORDER BY id ASC
            `).all(primaryJob.chatId, primaryJob.id);

            this.db.prepare(`UPDATE jobs SET status = 'PROCESSING', claimedAt = ?, leaseUntil = ?, attempts = attempts + 1, claimToken = ?, updatedAt = ? WHERE id = ?`)
              .run(now, lease, claimToken, now, primaryJob.id);
            
            primaryJob.claimToken = claimToken;
            primaryJob.payload = JSON.parse(primaryJob.payload);

            // If there are burst follow-ups, merge text and complete them
            if (burstJobs && burstJobs.length > 0) {
              const combinedTexts = [primaryJob.payload.unifiedMsg.text];
              for (const bJob of burstJobs) {
                const bPayload = JSON.parse(bJob.payload);
                if (bPayload.unifiedMsg?.text) {
                  combinedTexts.push(bPayload.unifiedMsg.text);
                }
                // Mark burst job completed
                this.db.prepare("UPDATE jobs SET status = 'COMPLETED', updatedAt = ? WHERE id = ?").run(now, bJob.id);
              }
              primaryJob.payload.unifiedMsg.text = combinedTexts.join('\n');
              console.log(`[JobQueue] ⚡ Aggregated ${burstJobs.length + 1} burst messages for ${primaryJob.chatId}: "${primaryJob.payload.unifiedMsg.text}"`);
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
