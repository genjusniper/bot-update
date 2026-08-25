// src/resilience/DuplicateResponseGuard.mjs
// Duplicate Response Guard — Prevents Repeating the Same Message

export class DuplicateResponseGuard {
    static recentResponses = new Map(); // chatId -> [{ text, timestamp }]

    static shouldSend(chatId, responseText) {
        const clean = (responseText || '').trim().toLowerCase();
        const now = Date.now();

        if (!this.recentResponses.has(chatId)) {
            this.recentResponses.set(chatId, []);
        }

        const history = this.recentResponses.get(chatId);
        // Filter out records older than 60 seconds
        const validHistory = history.filter(h => (now - h.timestamp) < 60000);
        this.recentResponses.set(chatId, validHistory);

        // Check if identical message was sent in last 60 seconds
        const isDuplicate = validHistory.some(h => h.text === clean);
        if (isDuplicate) {
            console.warn(`[DuplicateResponseGuard] 🛑 Blocked duplicate response to ${chatId}: "${responseText.slice(0, 40)}..."`);
            return false;
        }

        validHistory.push({ text: clean, timestamp: now });
        return true;
    }

    static record(chatId, responseText) {
        this.shouldSend(chatId, responseText);
    }
}
