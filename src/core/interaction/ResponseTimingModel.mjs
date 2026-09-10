// src/core/interaction/ResponseTimingModel.mjs
// Calculates authentic WhatsApp response timing delays without fake deceit

export class ResponseTimingModel {
    static TIMING_CATEGORIES = Object.freeze({
        INSTANT: { minMs: 500, maxMs: 1200 },
        SHORT_PAUSE: { minMs: 1500, maxMs: 2500 },
        NORMAL: { minMs: 2500, maxMs: 4000 },
        THOUGHTFUL: { minMs: 4000, maxMs: 6000 }
    });

    /**
     * Calculates delay category and milliseconds
     * @param {Object} params
     * @param {string} params.interactionMode
     * @param {number} [params.urgency=0.2]
     * @param {number} [params.wordCount=10]
     * @returns {Object} { category: string, delayMs: number }
     */
    static calculate({ interactionMode = 'Casual', urgency = 0.2, wordCount = 10 }) {
        if (urgency >= 0.7 || interactionMode === 'Closing' || interactionMode === 'Silent/Minimal') {
            const min = this.TIMING_CATEGORIES.INSTANT.minMs;
            const max = this.TIMING_CATEGORIES.INSTANT.maxMs;
            return {
                category: 'INSTANT',
                delayMs: Math.floor(Math.random() * (max - min) + min)
            };
        }

        if (interactionMode === 'Deep Talk' || wordCount > 20) {
            const min = this.TIMING_CATEGORIES.THOUGHTFUL.minMs;
            const max = this.TIMING_CATEGORIES.THOUGHTFUL.maxMs;
            return {
                category: 'THOUGHTFUL',
                delayMs: Math.floor(Math.random() * (max - min) + min)
            };
        }

        if (interactionMode === 'Banter' || wordCount <= 6) {
            const min = this.TIMING_CATEGORIES.SHORT_PAUSE.minMs;
            const max = this.TIMING_CATEGORIES.SHORT_PAUSE.maxMs;
            return {
                category: 'SHORT_PAUSE',
                delayMs: Math.floor(Math.random() * (max - min) + min)
            };
        }

        const min = this.TIMING_CATEGORIES.NORMAL.minMs;
        const max = this.TIMING_CATEGORIES.NORMAL.maxMs;
        return {
            category: 'NORMAL',
            delayMs: Math.floor(Math.random() * (max - min) + min)
        };
    }
}
