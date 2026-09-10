// src/core/interaction/MultiBubbleDispatcher.mjs
// Dispatches multi-bubble WhatsApp responses with human-like typing cadence and pauses

export class MultiBubbleDispatcher {
    /**
     * Dispatches a sequence of bubbles with realistic presence and typing delays
     * @param {Object} params
     * @param {string[]} params.bubbles - Array of message bubbles to send
     * @param {string} params.jid - WhatsApp chat JID
     * @param {Object} [params.socket] - Baileys socket instance (optional)
     * @param {Object} [params.timing] - From ResponseTimingModel { delayMs, typingDurationMs }
     * @param {Function} [params.onSend] - Callback per sent bubble (useful for testing or logging)
     * @param {boolean} [params.dryRun=false] - If true, skips artificial sleep delays
     * @returns {Promise<Object>} Execution summary
     */
    static async dispatch({ bubbles = [], jid = '', socket = null, timing = {}, onSend = null, dryRun = false }) {
        if (!Array.isArray(bubbles) || bubbles.length === 0) {
            return { success: false, bubblesSent: 0, reason: 'EMPTY_BUBBLES' };
        }

        const initialDelay = timing.delayMs || 600;
        const sentList = [];

        for (let i = 0; i < bubbles.length; i++) {
            const bubble = bubbles[i];

            if (!dryRun) {
                // 1. Initial presence or pause between bubbles
                if (i === 0) {
                    if (initialDelay > 0) await this.#sleep(Math.min(initialDelay, 2000));
                } else {
                    const interBubblePause = 400 + Math.floor(Math.random() * 600);
                    await this.#sleep(interBubblePause);
                }

                // 2. Typing presence
                if (socket && typeof socket.sendPresenceUpdate === 'function') {
                    try {
                        await socket.sendPresenceUpdate('composing', jid);
                    } catch (e) {}
                }

                const charDelay = Math.min(Math.max(bubble.length * 20, 300), 2000);
                await this.#sleep(charDelay);
            }

            // 3. Dispatch message
            if (socket && typeof socket.sendMessage === 'function') {
                try {
                    await socket.sendMessage(jid, { text: bubble });
                } catch (sendErr) {
                    console.error('[MultiBubbleDispatcher] Error sending bubble:', sendErr.message);
                }
            }

            if (typeof onSend === 'function') {
                onSend({ index: i, bubble, jid, timestamp: Date.now() });
            }

            sentList.push(bubble);
        }

        // Final presence clear
        if (socket && typeof socket.sendPresenceUpdate === 'function') {
            try {
                await socket.sendPresenceUpdate('paused', jid);
            } catch (e) {}
        }

        return {
            success: true,
            bubblesSent: sentList.length,
            sentList,
            jid
        };
    }

    static #sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
