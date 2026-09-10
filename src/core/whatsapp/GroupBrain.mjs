// src/core/whatsapp/GroupBrain.mjs
// Group State Model & Multi-Domain Privacy Boundary (PRIVATE_CONTEXT vs GROUP_CONTEXT vs PUBLIC_CONTEXT)

export class GroupBrain {
    static PRIVACY_LEVELS = Object.freeze({
        PRIVATE_CONTEXT: 'PRIVATE_CONTEXT',
        GROUP_CONTEXT: 'GROUP_CONTEXT',
        PUBLIC_CONTEXT: 'PUBLIC_CONTEXT'
    });

    static #groups = new Map(); // groupId -> GroupRecord

    /**
     * Ingests or updates a group event into GroupBrain
     * @param {Object} params
     * @param {string} params.groupId
     * @param {string} params.senderId
     * @param {string} [params.senderName='']
     * @param {string} [params.text='']
     * @param {boolean} [params.isAdmin=false]
     * @returns {Object} Group State Snapshot
     */
    static updateGroup({ groupId, senderId, senderName = '', text = '', isAdmin = false }) {
        if (!this.#groups.has(groupId)) {
            this.#groups.set(groupId, {
                groupId,
                members: new Set(),
                admins: new Set(),
                activeTopics: new Set(),
                conversationTemperature: 0.5,
                currentSpeaker: senderId,
                messageCount: 0,
                privacyLevel: this.PRIVACY_LEVELS.GROUP_CONTEXT,
                openLoops: []
            });
        }

        const group = this.#groups.get(groupId);
        group.members.add(senderId);
        if (isAdmin) group.admins.add(senderId);
        group.currentSpeaker = senderId;
        group.messageCount++;

        // Temperature heuristic: fast messages raise temperature
        group.conversationTemperature = Math.min(1.0, group.conversationTemperature + 0.05);

        return {
            groupId,
            memberCount: group.members.size,
            adminCount: group.admins.size,
            conversationTemperature: Number(group.conversationTemperature.toFixed(2)),
            privacyLevel: group.privacyLevel
        };
    }

    /**
     * Filters confidential / private memory data from leaking into group responses
     * @param {string} text - Proposed response text
     * @param {string} currentPrivacyLevel - Current target context
     * @returns {{ safeText: string, leakDetected: boolean, maskedCount: number }}
     */
    static sanitizeForPrivacy(text = '', currentPrivacyLevel = 'GROUP_CONTEXT') {
        if (currentPrivacyLevel === this.PRIVACY_LEVELS.PRIVATE_CONTEXT) {
            return { safeText: text, leakDetected: false, maskedCount: 0 };
        }

        let leakDetected = false;
        let maskedCount = 0;
        let sanitized = text;

        // Mask private financial, secret, and sensitive personal markers
        const sensitivePatterns = [
            /\b(password|pin|rekening|saldo|gaji|atm|token|api_key|secret)\s*[:=]\s*[^\s]+/gi,
            /\b(\d{10,16})\b/g // Credit cards / account numbers
        ];

        for (const pattern of sensitivePatterns) {
            if (pattern.test(sanitized)) {
                leakDetected = true;
                maskedCount++;
                sanitized = sanitized.replace(pattern, '[DATA_PRIVAT_TERLINDUNGI]');
            }
        }

        return {
            safeText: sanitized,
            leakDetected,
            maskedCount
        };
    }

    /**
     * Resets group brain for testing
     */
    static reset() {
        this.#groups.clear();
    }
}
