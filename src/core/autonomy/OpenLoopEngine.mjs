// src/core/autonomy/OpenLoopEngine.mjs
// Unfulfilled promises, conversational debts, and pending requests detector & tracker
// Enables ARKA to remember: "Aku janji besok cek", "Kemarin Dito minta data X", "Ada utang follow up"

import fs from 'fs';
import path from 'path';

const OPEN_LOOPS_FILE = path.resolve(process.cwd(), 'data/open_loops.json');

export class OpenLoopEngine {
    static loops = new Map();

    static init(customPath = null) {
        const filePath = customPath || OPEN_LOOPS_FILE;
        try {
            if (fs.existsSync(filePath)) {
                const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                this.loops.clear();
                for (const item of raw) {
                    this.loops.set(item.loopId, item);
                }
            } else {
                this.loops.clear();
                this.save(filePath);
            }
        } catch (e) {
            console.warn('[OpenLoopEngine] ⚠️ Failed to load open loops:', e.message);
        }
    }

    static save(filePath = OPEN_LOOPS_FILE) {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const list = Array.from(this.loops.values());
            fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
        } catch (e) {
            console.error('[OpenLoopEngine] ❌ Failed to save open loops:', e.message);
        }
    }

    /**
     * Inspects inbound or outbound message text for promissory statements and registers open loops
     * @param {string} text
     * @param {Object} meta
     * @returns {Object|null} Registered Open Loop or null
     */
    static inspectAndRecord(text = '', { chatId = '', senderId = '', temporalAnchor = null } = {}) {
        if (!text) return null;
        const lower = text.toLowerCase();

        // Detect promises: "besok tak ...", "nanti tak ...", "janji ...", "tolong ingetin ...", "jangan lupa ..."
        const isPromise = /\b(besok tak|nanti tak|aku janji|gue janji|nanti tak cek|besok tak kirim|tolong ingetin|jangan lupa|tar tak kabari)\b/i.test(lower);

        if (isPromise) {
            const loopId = `loop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            const loop = {
                loopId,
                chatId,
                speaker: senderId,
                statement: text.slice(0, 120),
                temporalDeadline: temporalAnchor?.rawPhrase || 'UNSPECIFIED',
                targetTimestamp: temporalAnchor?.targetTimestamp || null,
                status: 'OPEN',
                createdAt: Date.now()
            };

            this.loops.set(loopId, loop);
            this.save();
            return loop;
        }

        return null;
    }

    /**
     * Marks an open loop as resolved
     * @param {string} loopId
     */
    static resolveLoop(loopId) {
        const loop = this.loops.get(loopId);
        if (loop) {
            loop.status = 'RESOLVED';
            loop.resolvedAt = Date.now();
            this.save();
            return true;
        }
        return false;
    }

    /**
     * Gets all open loops for a chat or universally
     * @param {string} [chatId=null]
     * @returns {Array<Object>}
     */
    static getPendingLoops(chatId = null) {
        const all = Array.from(this.loops.values());
        if (chatId) {
            return all.filter(l => l.chatId === chatId && l.status === 'OPEN');
        }
        return all.filter(l => l.status === 'OPEN');
    }

    /**
     * Formats pending open loops as a concise markdown list
     * @param {string} [chatId=null]
     * @returns {string}
     */
    static formatOpenLoops(chatId = null) {
        const pending = this.getPendingLoops(chatId);
        if (pending.length === 0) return '';

        const lines = ['📋 *Pending Commitments & Open Loops:*'];
        for (const l of pending.slice(0, 5)) {
            lines.push(`- "${l.statement}" (deadline: ${l.temporalDeadline})`);
        }
        return lines.join('\n');
    }
}
