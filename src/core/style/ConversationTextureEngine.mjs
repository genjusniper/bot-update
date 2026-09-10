// src/core/style/ConversationTextureEngine.mjs
// Realizes WhatsApp conversation texture: bubble splitting, casing, and pacing

import { TypingBehaviorEngine } from '../interaction/TypingBehaviorEngine.mjs';

export class ConversationTextureEngine {
    /**
     * Transforms cleaned text into calibrated WhatsApp chat bubbles
     * @param {string} text - Cleaned response text
     * @param {Object} interactionContract - From contract.interaction
     * @returns {Object} { bubbles: string[], fullText: string, bubbleCount: number }
     */
    static apply(text = '', interactionContract = {}) {
        if (!text || typeof text !== 'string') {
            return { bubbles: [], fullText: '', bubbleCount: 0 };
        }

        const mode = interactionContract.mode || 'Casual';
        const shape = interactionContract.messageShape || 'SINGLE';
        const maxBubbles = interactionContract.maxBubbles || 1;

        let raw = text.trim();

        // 1. Split raw text by explicit newlines or natural pause transitions
        let rawBubbles = raw
            .split(/\n\n+|(?<=[a-z0-9])\n(?=[a-z0-9])/i)
            .map(b => b.trim())
            .filter(Boolean);

        if (rawBubbles.length === 0) rawBubbles = [raw];

        // 2. Adjust to shape
        let bubbles = [];
        if (shape === 'SINGLE' || maxBubbles === 1) {
            bubbles = [rawBubbles.join(' ')];
        } else if (shape === 'DOUBLE') {
            if (rawBubbles.length >= 2) {
                bubbles = [rawBubbles[0], rawBubbles.slice(1).join(' ')];
            } else {
                // If text is 1 long string, try splitting on first question or comma/pause if words > 6
                const words = raw.split(/\s+/);
                if (words.length > 6) {
                    const mid = Math.ceil(words.length / 2);
                    bubbles = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
                } else {
                    bubbles = [raw];
                }
            }
        } else {
            bubbles = rawBubbles.slice(0, maxBubbles);
        }

        // 3. Apply typing texture per bubble
        bubbles = bubbles.map(b => TypingBehaviorEngine.applyTexture(b, { interactionMode: mode }));

        return {
            bubbles,
            fullText: bubbles.join('\n'),
            bubbleCount: bubbles.length
        };
    }
}
