// src/conversation/ConversationFSM.mjs — FIXED JOB CONTEXT EMISSION
import { EventEmitter } from 'events';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

export const FSMEventBus = new EventEmitter();

export class ConversationFSM {
    static db = null;
    
    static init() {
        if (this.db) return;
        const memDir = path.resolve(process.cwd(), 'memory');
        if (!fs.existsSync(memDir)) fs.mkdirSync(memDir, { recursive: true });

        const dbPath = path.join(memDir, 'fsm_state_v10.sqlite');
        this.db = new DatabaseSync(dbPath);
        this.db.exec("PRAGMA busy_timeout = 5000;");
        this.db.exec("PRAGMA journal_mode = WAL;");
        
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS fsm_states (
            chatId TEXT PRIMARY KEY,
            state TEXT DEFAULT 'IDLE',
            version INTEGER DEFAULT 0,
            correlationId TEXT,
            generationId TEXT,
            updatedAt INTEGER
          );
        `);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_fsm_state ON fsm_states(state);`);
    }

    static close() {
        if (this.db) {
            try { this.db.close(); } catch(e) {}
            this.db = null;
            console.log('[FSM] DB connection closed.');
        }
    }

    static getState(chatId) {
        if (!this.db) this.init();
        const row = this.db.prepare("SELECT * FROM fsm_states WHERE chatId = ?").get(chatId);
        if (!row) return { current: 'IDLE', version: 0, correlationId: null, generationId: null };
        return { 
            current: row.state, 
            version: row.version,
            correlationId: row.correlationId,
            generationId: row.generationId
        };
    }

    static transition(chatId, toState, ctx = {}, expectedVersion = null) {
        if (!this.db) this.init();
        
        const currentState = this.getState(chatId);
        const version = expectedVersion !== null ? expectedVersion : currentState.version;
        const now = Date.now();
        const corrId = ctx.correlationId || currentState.correlationId;
        const genId = ctx.generationId || currentState.generationId;

        this.db.prepare("INSERT OR IGNORE INTO fsm_states (chatId, state, version, updatedAt) VALUES (?, 'IDLE', 0, ?)").run(chatId, now);

        const info = this.db.prepare(`
            UPDATE fsm_states 
            SET state = ?, version = version + 1, correlationId = ?, generationId = ?, updatedAt = ?
            WHERE chatId = ? AND version = ?
        `).run(toState, corrId, genId, now, chatId, version);
        
        if (info.changes === 0) {
            console.warn(`[FSM] ⚠️ Transition lost for ${chatId}. Expected v${version}, got v${this.getState(chatId).version}. Aborting.`);
            return false;
        }

        console.log(`[FSM] ${chatId}: ${currentState.current} -> ${toState} (v${version + 1})`);
        
        if (toState === 'THINKING') {
            FSMEventBus.emit('state.thinking', { 
                chatId, 
                payload: ctx.payload, 
                jobId: ctx.jobId, 
                claimToken: ctx.claimToken, 
                version: version + 1 
            });
        }
        if (toState === 'IDLE') {
            FSMEventBus.emit('state.idle', { chatId });
        }
        return true;
    }

    static recover(chatId, reason) {
        if (!this.db) this.init();
        const now = Date.now();
        this.db.prepare(`
            UPDATE fsm_states 
            SET state = 'IDLE', version = version + 1, correlationId = NULL, generationId = NULL, updatedAt = ?
            WHERE chatId = ?
        `).run(now, chatId);
        console.warn(`[FSM] ⚠️ RECOVERY triggered for ${chatId}. Reason: ${reason}`);
        FSMEventBus.emit('state.idle', { chatId });
    }
}
