// src/core/control/RiskIntelligenceEngine.mjs
// Phase 36: Permission & Risk Intelligence
// 5-Tier Action Risk Gate, Scope Confinement, and WhatsApp Interactive Handshake.

import { ROLES } from './AuthorityManager.mjs';

export const RiskTier = Object.freeze({
    READ: 'READ',
    WRITE: 'WRITE',
    EXTERNAL: 'EXTERNAL',
    DESTRUCTIVE: 'DESTRUCTIVE',
    IRREVERSIBLE: 'IRREVERSIBLE'
});

export const RiskLevel = Object.freeze({
    [RiskTier.READ]: 0,
    [RiskTier.WRITE]: 1,
    [RiskTier.EXTERNAL]: 2,
    [RiskTier.DESTRUCTIVE]: 3,
    [RiskTier.IRREVERSIBLE]: 4
});

export const ActionDecision = Object.freeze({
    ALLOWED: 'ALLOWED',
    NEED_CONFIRMATION: 'NEED_CONFIRMATION',
    NEED_TWO_STEP_CODE: 'NEED_TWO_STEP_CODE',
    DENIED: 'DENIED'
});

export class RiskIntelligenceEngine {
    static #pendingChallenges = new Map(); // chatId -> challenge
    static #maxPending = 50;

    /**
     * Evaluates action risk against identity authority and scope boundaries
     * @param {Object} params
     * @param {string} params.actionName - e.g., 'RESTART_PROCESS', 'PURGE_MEMORIES'
     * @param {string} [params.riskTier=RiskTier.READ] - One of RiskTier
     * @param {string} [params.actorRole=ROLES.USER] - One of ROLES
     * @param {string} [params.actorChatId] - Chat ID of the requestor
     * @param {string} [params.targetScope] - Target resource scope (e.g. chatId, tenantId)
     * @param {boolean} [params.preConfirmed=false] - If caller already confirmed via handshake
     * @returns {{ decision: string, reason: string, challenge?: Object }}
     */
    static evaluateAction({
        actionName,
        riskTier = RiskTier.READ,
        actorRole = ROLES.USER,
        actorChatId = '',
        targetScope = '',
        preConfirmed = false
    }) {
        if (!actionName) {
            return { decision: ActionDecision.DENIED, reason: 'ACTION_NAME_REQUIRED' };
        }

        // 1. Scope Confinement Check (Prevent Cross-Tenant / Cross-Chat Manipulation)
        if (targetScope && actorChatId && targetScope !== actorChatId && actorRole !== ROLES.OWNER && actorRole !== ROLES.ADMIN) {
            return {
                decision: ActionDecision.DENIED,
                reason: 'SCOPE_CONFINEMENT_VIOLATION: Cannot modify resource outside of actor chat scope'
            };
        }

        // If pre-confirmed by valid interactive challenge
        if (preConfirmed) {
            return { decision: ActionDecision.ALLOWED, reason: 'PRE_CONFIRMED_VIA_HANDSHAKE' };
        }

        // 2. Risk Tier Gates
        switch (riskTier) {
            case RiskTier.READ:
                return { decision: ActionDecision.ALLOWED, reason: 'READ_TIER_AUTO_ALLOWED' };

            case RiskTier.WRITE:
                if (actorRole === ROLES.GUEST) {
                    return { decision: ActionDecision.DENIED, reason: 'GUEST_CANNOT_PERFORM_WRITE' };
                }
                return { decision: ActionDecision.ALLOWED, reason: 'WRITE_TIER_ALLOWED' };

            case RiskTier.EXTERNAL:
                if (actorRole === ROLES.GUEST) {
                    return { decision: ActionDecision.DENIED, reason: 'GUEST_CANNOT_TRIGGER_EXTERNAL_CALLS' };
                }
                return { decision: ActionDecision.ALLOWED, reason: 'EXTERNAL_TIER_ALLOWED' };

            case RiskTier.DESTRUCTIVE: {
                if (actorRole === ROLES.OWNER) {
                    // Owner direct execution allowed for low-complexity commands, but challenge provided if requested
                    return { decision: ActionDecision.ALLOWED, reason: 'OWNER_PRIVILEGED_EXECUTION' };
                }
                if (actorRole === ROLES.ADMIN) {
                    const challenge = this.createChallenge(actorChatId, actionName, { riskTier, reason: 'ADMIN_DESTRUCTIVE_CONFIRMATION' });
                    return {
                        decision: ActionDecision.NEED_CONFIRMATION,
                        reason: 'DESTRUCTIVE_ACTION_REQUIRES_CONFIRMATION',
                        challenge
                    };
                }
                return {
                    decision: ActionDecision.DENIED,
                    reason: 'DESTRUCTIVE_ACTION_REQUIRES_ADMIN_OR_OWNER_AUTHORITY'
                };
            }

            case RiskTier.IRREVERSIBLE: {
                if (actorRole !== ROLES.OWNER) {
                    return {
                        decision: ActionDecision.DENIED,
                        reason: 'IRREVERSIBLE_ACTION_REQUIRES_STRICT_OWNER_ONLY_AUTHORITY'
                    };
                }
                // Even Owner must complete two-step handshake for IRREVERSIBLE actions (e.g. purge DB, wipe memories)
                const challenge = this.createChallenge(actorChatId, actionName, { riskTier, isTwoStep: true });
                return {
                    decision: ActionDecision.NEED_TWO_STEP_CODE,
                    reason: 'IRREVERSIBLE_ACTION_REQUIRES_TWO_STEP_HANDSHAKE',
                    challenge
                };
            }

            default:
                return { decision: ActionDecision.DENIED, reason: 'UNKNOWN_RISK_TIER' };
        }
    }

    /**
     * Creates an interactive confirmation challenge
     * @param {string} chatId
     * @param {string} actionName
     * @param {Object} details
     * @returns {Object} challenge
     */
    static createChallenge(chatId, actionName, details = {}) {
        this.#pruneExpired();
        const codeNum = Math.floor(1000 + Math.random() * 9000);
        const code = 'CONFIRM-' + codeNum;
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        const challenge = {
            chatId,
            actionName,
            code,
            expiresAt,
            isTwoStep: details.isTwoStep || false,
            details
        };

        if (this.#pendingChallenges.size >= this.#maxPending) {
            const oldest = this.#pendingChallenges.keys().next().value;
            this.#pendingChallenges.delete(oldest);
        }

        this.#pendingChallenges.set(chatId, challenge);
        return challenge;
    }

    /**
     * Verifies an incoming response against pending challenges for a chat
     * @param {string} chatId
     * @param {string} text
     * @returns {{ verified: boolean, actionName?: string, error?: string }}
     */
    static verifyHandshake(chatId, text = '') {
        this.#pruneExpired();
        if (!chatId || !text) return { verified: false, error: 'MISSING_INPUT' };

        const challenge = this.#pendingChallenges.get(chatId);
        if (!challenge) {
            return { verified: false, error: 'NO_PENDING_CHALLENGE' };
        }

        if (Date.now() > challenge.expiresAt) {
            this.#pendingChallenges.delete(chatId);
            return { verified: false, error: 'CHALLENGE_EXPIRED' };
        }

        const upper = text.toUpperCase().trim();
        const codeMatch = upper.includes(challenge.code);

        if (!codeMatch) {
            // Also accept generic "YA" if it's not a two-step code
            if (!challenge.isTwoStep && (upper === 'YA' || upper === 'Y' || upper === 'LANJUT')) {
                this.#pendingChallenges.delete(chatId);
                return { verified: true, actionName: challenge.actionName, details: challenge.details };
            }
            return { verified: false, error: 'INVALID_CONFIRMATION_CODE' };
        }

        // Code matched! Consume immediately to prevent replay
        this.#pendingChallenges.delete(chatId);
        return {
            verified: true,
            actionName: challenge.actionName,
            details: challenge.details
        };
    }

    /**
     * Formats challenge prompt for WhatsApp
     * @param {Object} challenge
     * @returns {string}
     */
    static formatChallengePrompt(challenge) {
        if (!challenge) return '';

        const tier = challenge.details?.riskTier || RiskTier.DESTRUCTIVE;
        let card = '⚠️ *KONFIRMASI TINDAKAN BERISIKO TINGGI*\n';
        card += '────────────────────────\n';
        card += 'Aksi: *' + challenge.actionName + '*\n';
        card += 'Tingkat Risiko: *' + tier + '*\n';

        if (challenge.isTwoStep) {
            card += 'Dampak: *Tindakan permanen (Irreversible). Tidak dapat dibatalkan.*\n\n';
            card += '👉 Ketik *KONFIRMASI ' + challenge.code + '* dalam 5 menit untuk mengeksekusi.\n';
            card += 'Abaikan pesan ini jika ingin membatalkan.';
        } else {
            card += 'Dampak: *Perubahan sistem atau status data penting.*\n\n';
            card += '👉 Ketik *YA ' + challenge.code + '* (atau cukup *YA*) dalam 5 menit untuk menyetujui.\n';
            card += 'Abaikan pesan ini untuk membatalkan.';
        }

        return card;
    }

    static #pruneExpired() {
        const now = Date.now();
        for (const [chatId, ch] of this.#pendingChallenges.entries()) {
            if (now > ch.expiresAt) {
                this.#pendingChallenges.delete(chatId);
            }
        }
    }

    static getPendingChallenge(chatId) {
        this.#pruneExpired();
        return this.#pendingChallenges.get(chatId) || null;
    }

    static clear() {
        this.#pendingChallenges.clear();
    }
}