// src/security/copilot/OwnerPresenceEngine.mjs
// Owner Presence & Human Takeover Engine: Automatically yields control when the owner chats manually

export class OwnerPresenceEngine {
    static lastGlobalOwnerActivity = 0;
    static activeTakeovers = new Map(); // chatId -> timestampOfLastOwnerMessage
    static takeoverCooldownMs = 10 * 60 * 1000; // 10 minutes pause per chat after owner replies

    static recordOwnerMessage(chatId) {
        const now = Date.now();
        this.lastGlobalOwnerActivity = now;
        this.activeTakeovers.set(chatId, now);
        console.log(`[OwnerPresence] 👤 Human Takeover active on ${chatId} (AI Paused for 10 mins).`);
    }

    static isTakeoverActive(chatId) {
        const lastActivity = this.activeTakeovers.get(chatId);
        if (!lastActivity) return false;

        const elapsed = Date.now() - lastActivity;
        if (elapsed < this.takeoverCooldownMs) {
            return true; // Owner is currently chatting manually
        }

        // Expired
        this.activeTakeovers.delete(chatId);
        return false;
    }

    static getOwnerPresenceState() {
        const elapsed = Date.now() - this.lastGlobalOwnerActivity;
        if (elapsed < 3 * 60 * 1000) {
            return 'USER_ACTIVE'; // Active in last 3 mins
        }
        if (elapsed < 15 * 60 * 1000) {
            return 'USER_IDLE'; // Idle 3-15 mins
        }
        return 'USER_AWAY'; // Away > 15 mins
    }
}
