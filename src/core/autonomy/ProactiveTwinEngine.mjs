// src/core/autonomy/ProactiveTwinEngine.mjs
// Responsible, non-spammy proactive engagement engine authentic to Mas Agus

export class ProactiveTwinEngine {
    static #lastContactTime = new Map(); // chatId -> timestamp

    /**
     * Evaluates whether proactive reach-out is appropriate
     * @param {Object} params
     * @param {string} params.chatId
     * @param {string} params.relationshipTier - OWNER / CLOSE_FRIEND / CLIENT_VIP / etc.
     * @param {string} params.triggerType - OPEN_LOOP / CRITICAL_ALERT / GREETING
     * @param {number} [params.cooldownMs=14400000] - 4 hours minimum default cooldown
     * @returns {Object} Proactive decision
     */
    static shouldReachOut({ chatId, relationshipTier = 'STRANGER', triggerType = 'OPEN_LOOP', cooldownMs = 14400000 }) {
        const tier = String(relationshipTier).toUpperCase();

        // Rule 1: Strangers and regular users are NEVER proactively messaged
        if (tier !== 'OWNER' && tier !== 'CLOSE_FRIEND' && tier !== 'CLIENT_VIP') {
            return {
                allowed: false,
                reason: 'PROACTIVE_RESTRICTED_TO_HIGH_TIER'
            };
        }

        // Rule 2: Generic greetings without context are rejected (anti-spam)
        if (triggerType === 'GREETING' && tier !== 'OWNER') {
            return {
                allowed: false,
                reason: 'GENERIC_PROACTIVE_GREETINGS_FORBIDDEN'
            };
        }

        // Rule 3: Enforce strict cooldown per chat
        const lastTime = this.#lastContactTime.get(chatId) || 0;
        const elapsed = Date.now() - lastTime;
        if (elapsed < cooldownMs) {
            return {
                allowed: false,
                reason: 'COOLDOWN_ACTIVE',
                remainingMinutes: Math.ceil((cooldownMs - elapsed) / 60000)
            };
        }

        return {
            allowed: true,
            reason: 'VALID_PROACTIVE_ENGAGEMENT',
            style: tier === 'OWNER' ? 'DIRECT_ALERT' : 'NATURAL_FOLLOWUP'
        };
    }

    /**
     * Records that proactive contact occurred
     */
    static recordContact(chatId) {
        this.#lastContactTime.set(chatId, Date.now());
    }
}
