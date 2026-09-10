// src/core/interaction/HumorBudgetEngine.mjs
// Manages dynamic humor budget and per-chat cooldowns to prevent repetitive joking

export class HumorBudgetEngine {
    // In-memory cooldown tracking per chatId: { lastJokeTurn: number, turnsSinceJoke: number }
    static chatHistory = new Map();

    /**
     * Evaluates humor permission and consumes budget if joking
     * @param {Object} params
     * @param {string} params.chatId
     * @param {string} params.humorStyle - From contract.how.humorStyle
     * @param {string} params.interactionMode - From InteractionModeEngine
     * @param {boolean} [params.consume=false] - Whether this turn used humor
     * @returns {Object} { canJoke: boolean, budget: number, cooldownActive: boolean, directive: string }
     */
    static evaluate({ chatId = 'default', humorStyle = 'OFF', interactionMode = 'Casual', consume = false }) {
        if (!this.chatHistory.has(chatId)) {
            this.chatHistory.set(chatId, { turnsSinceJoke: 5 });
        }

        const record = this.chatHistory.get(chatId);

        // Advance turn counter
        if (!consume) {
            record.turnsSinceJoke += 1;
        }

        // Hard suppression
        if (humorStyle === 'OFF' || interactionMode === 'Venting' || interactionMode === 'Customer' || interactionMode === 'Closing') {
            return {
                canJoke: false,
                budget: 0.0,
                cooldownActive: false,
                directive: 'HUMOR SUPPRESSED: Situasi memerlukan nada serius / profesional.'
            };
        }

        // Cooldown check: Require at least 2 turns between overt jokes
        if (record.turnsSinceJoke < 2) {
            return {
                canJoke: false,
                budget: 0.2,
                cooldownActive: true,
                directive: 'HUMOR COOLDOWN: Baru saja bercanda. Tahan tawa/lelucon pada pesan ini.'
            };
        }

        if (consume) {
            record.turnsSinceJoke = 0;
        }

        return {
            canJoke: true,
            budget: 0.65,
            cooldownActive: false,
            directive: 'HUMOR ALLOWED: Boleh deadpan humor atau seloroh ringan secukupnya.'
        };
    }

    /**
     * Records that humor was used in the outgoing reply
     * @param {string} chatId 
     */
    static recordHumorUsed(chatId = 'default') {
        if (!this.chatHistory.has(chatId)) {
            this.chatHistory.set(chatId, { turnsSinceJoke: 0 });
        } else {
            this.chatHistory.get(chatId).turnsSinceJoke = 0;
        }
    }
}
