// src/core/fabric/CommitmentIntegrityEngine.mjs
// Tracks promises, tasks, and open loops to ensure zero dropped commitments

export class CommitmentIntegrityEngine {
    static #openLoops = new Map(); // loopId -> LoopRecord

    /**
     * Detects and records commitments from outgoing or incoming text
     * @param {Object} params
     * @param {string} params.text
     * @param {string} params.senderId
     * @param {string} params.chatId
     * @param {number} [params.dueTimestamp]
     * @returns {Object|null} Registered OpenLoop or null
     */
    static inspectCommitment({ text = '', senderId = '', chatId = '', dueTimestamp = null }) {
        if (!text) return null;

        const lower = text.toLowerCase();

        // Detection of promissory commitment
        const hasCommitment = /\b(besok (tak|aku|saya|kita)|nanti (tak|aku|saya|kita) (cek|kabari|kirim|lanjut)|tolong ingatkan|jangan lupa|deadline|janji)\b/i.test(lower);
        if (!hasCommitment) return null;

        const loopId = `loop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const loopRecord = {
            loopId,
            chatId,
            senderId,
            text,
            status: 'OPEN',
            createdAt: Date.now(),
            dueTimestamp: dueTimestamp || (Date.now() + 1000 * 60 * 60 * 24) // default 24h
        };

        this.#openLoops.set(loopId, loopRecord);
        return loopRecord;
    }

    /**
     * Resolves an open loop
     * @param {string} loopId
     * @returns {boolean}
     */
    static resolveLoop(loopId) {
        const loop = this.#openLoops.get(loopId);
        if (loop && loop.status === 'OPEN') {
            loop.status = 'RESOLVED';
            loop.resolvedAt = Date.now();
            return true;
        }
        return false;
    }

    /**
     * Lists active open loops for a chat
     * @param {string} chatId
     * @returns {Object[]}
     */
    static getActiveLoops(chatId) {
        const results = [];
        for (const [id, loop] of this.#openLoops.entries()) {
            if (loop.status === 'OPEN' && (!chatId || loop.chatId === chatId)) {
                results.push(loop);
            }
        }
        return results;
    }

    /**
     * Resets open loops for testing
     */
    static reset() {
        this.#openLoops.clear();
    }
}
