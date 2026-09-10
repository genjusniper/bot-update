// src/core/world/DecisionOutcomeStore.mjs
// Persistent store tracking decisions, rationale, outcomes, and lessons learned

import { DatabaseSync } from 'node:sqlite';
import path from 'path';

export class DecisionOutcomeStore {
    constructor(dbPath = 'memory/bot_memory.db') {
        try {
            this.db = new DatabaseSync(dbPath);
            this.initTable();
        } catch (e) {
            this.db = null;
        }
    }

    initTable() {
        if (!this.db) return;
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS personal_decision_memories (
                decision_id TEXT PRIMARY KEY,
                context_summary TEXT NOT NULL,
                options_considered TEXT,
                decision_made TEXT NOT NULL,
                rationale TEXT NOT NULL,
                outcome TEXT,
                lesson_learned TEXT,
                timestamp INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_pdm_timestamp ON personal_decision_memories(timestamp);
        `);
    }

    /**
     * Records an architectural or life decision
     */
    recordDecision({ decisionId, contextSummary, optionsConsidered = [], decisionMade, rationale, outcome = null, lessonLearned = null }) {
        if (!this.db) return false;
        try {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO personal_decision_memories 
                (decision_id, context_summary, options_considered, decision_made, rationale, outcome, lesson_learned, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            stmt.run(
                decisionId || `dec_${Date.now()}`,
                contextSummary,
                JSON.stringify(optionsConsidered),
                decisionMade,
                rationale,
                outcome,
                lessonLearned,
                Date.now()
            );
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Retrieves recent decisions
     */
    getRecentDecisions(limit = 5) {
        if (!this.db) return [];
        try {
            const rows = this.db.prepare('SELECT * FROM personal_decision_memories ORDER BY timestamp DESC LIMIT ?').all(limit);
            return rows.map(r => ({
                ...r,
                options_considered: JSON.parse(r.options_considered || '[]')
            }));
        } catch (e) {
            return [];
        }
    }
}
