// src/core/group/GroupContextEngine.mjs
// Tracks group conversation norms, participants, multi-speaker threads, and attention

export class GroupContextEngine {
    static #groupStates = new Map(); // groupId -> state

    /**
     * Ingests a group message and updates group context graph
     * @param {Object} params
     * @param {string} params.groupId
     * @param {string} params.senderJid
     * @param {string} params.senderName
     * @param {string} params.text
     * @param {boolean} params.isMentioned
     * @param {boolean} params.isReplyToBot
     * @returns {Object} Group context analysis
     */
    static processGroupEvent({ groupId, senderJid, senderName = 'Unknown', text = '', isMentioned = false, isReplyToBot = false }) {
        if (!groupId) return { isGroup: false };

        let state = this.#groupStates.get(groupId);
        if (!state) {
            state = {
                groupId,
                participants: new Map(), // senderJid -> { name, lastSeen, messageCount }
                recentSpeakers: [],
                activeTopic: 'GENERAL',
                lastBotInteraction: 0,
                messageCountTotal: 0
            };
            this.#groupStates.set(groupId, state);
        }

        state.messageCountTotal++;

        // Update participant
        const p = state.participants.get(senderJid) || { name: senderName, lastSeen: 0, messageCount: 0 };
        p.lastSeen = Date.now();
        p.messageCount++;
        p.name = senderName || p.name;
        state.participants.set(senderJid, p);

        // Keep rolling speaker list (last 10)
        state.recentSpeakers.push({ senderJid, senderName, timestamp: Date.now() });
        if (state.recentSpeakers.length > 10) state.recentSpeakers.shift();

        // Check if addressed
        const lower = text.toLowerCase();
        const hasArkaMention = lower.includes('arka') || lower.includes('@arka') || isMentioned;
        const isDirectlySummoned = hasArkaMention || isReplyToBot;

        // Norms calculation
        const crowdDensity = state.participants.size;
        const responseDiscretion = crowdDensity > 10 ? 'HIGH_RESTRAINT' : 'BALANCED';

        return {
            isGroup: true,
            groupId,
            crowdDensity,
            participantCount: state.participants.size,
            isDirectlySummoned,
            responseDiscretion,
            recommendation: isDirectlySummoned 
                ? 'ENGAGE_DIRECT_CONCISE' 
                : 'OBSERVE_PASSIVE'
        };
    }

    /**
     * Resets group state (for testing)
     */
    static reset() {
        this.#groupStates.clear();
    }
}
