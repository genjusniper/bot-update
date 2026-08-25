// src/resilience/DuplicateResponseGuard.mjs
// V13.7 — Smarter duplicate detection: similarity-based (not exact), shorter TTL for Emergency Brain

export class DuplicateResponseGuard {
    static recentResponses = new Map(); // chatId -> [{ text, timestamp }]
    static TTL_MS = 90000; // 90 seconds TTL (was 60s)
    static MAX_HISTORY = 5;  // Keep last 5 responses per chat

    static normalize(text) {
        return (text || '').trim().toLowerCase()
            .replace(/[^\w\s]/g, '') // strip punctuation
            .replace(/\s+/g, ' ')
            .substring(0, 80); // only compare first 80 chars
    }

    static isSimilar(a, b) {
        if (a === b) return true;
        // Simple 80% overlap check on normalized first 60 chars
        const minLen = Math.min(a.length, b.length, 60);
        if (minLen < 10) return a === b;
        let matches = 0;
        for (let i = 0; i < minLen; i++) {
            if (a[i] === b[i]) matches++;
        }
        return (matches / minLen) > 0.85;
    }

    static shouldSend(chatId, responseText) {
        const clean = this.normalize(responseText);
        const now = Date.now();

        if (!this.recentResponses.has(chatId)) {
            this.recentResponses.set(chatId, []);
        }

        const history = this.recentResponses.get(chatId);
        // Expire old entries
        const validHistory = history.filter(h => (now - h.timestamp) < this.TTL_MS);
        this.recentResponses.set(chatId, validHistory);

        // Check similarity against recent history
        const isDuplicate = validHistory.some(h => this.isSimilar(h.text, clean));
        if (isDuplicate) {
            console.warn(`[DuplicateResponseGuard] 🛑 Blocked near-duplicate to ${chatId}: "${responseText.slice(0, 40)}..."`);
            return false;
        }

        // Keep only last N
        validHistory.push({ text: clean, timestamp: now });
        if (validHistory.length > this.MAX_HISTORY) {
            validHistory.shift();
        }
        return true;
    }

    static record(chatId, responseText) {
        this.shouldSend(chatId, responseText);
    }

    // Force clear history for a chat (e.g. after long silence)
    static reset(chatId) {
        this.recentResponses.delete(chatId);
    }
}
