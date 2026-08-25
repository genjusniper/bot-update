// src/behavior/HumanInteractionPolicy.mjs
// Single Bubble Preferred, Realistic Human Timing

import { BubbleSequencer } from './BubbleSequencer.mjs';
import { HumanUXEngine } from '../subsystems/ux/HumanUXEngine.mjs';

export class HumanInteractionPolicy {
    static decideDelivery(userMessage, rawResponse, options = {}) {
        const text = (userMessage || '').trim().toLowerCase();
        const responseText = (rawResponse || '').trim();

        if (!responseText) {
            return { action: 'REACT_ONLY', reactionEmoji: '👍', bubbles: [], typingDelays: [0], text: '' };
        }

        let action = 'REPLY_SINGLE';
        let reactionEmoji = null;
        let bubbles = [responseText];
        let typingDelays = [HumanUXEngine.calculateTypingDelay(responseText, options.hasMedia)];

        // 1. Reaction triggers
        if (text.match(/^(wkwk|wkwkwk|haha|ngakak|lucu banget)$/i)) {
            if (Math.random() < 0.20 && !options.hasMedia) {
                return { action: 'REACT_ONLY', reactionEmoji: '😂', bubbles: [], typingDelays: [0], text: '' };
            }
        }

        // 2. Multi-bubble only for distinct paragraph breaks with substantial content
        if (responseText.length > 120 && responseText.includes('\n\n')) {
            const seqBubbles = BubbleSequencer.sequence(responseText, 2);
            if (seqBubbles.length > 1) {
                action = 'REPLY_MULTI_BUBBLE';
                bubbles = seqBubbles;
                typingDelays = bubbles.map((b, i) => {
                    const delay = HumanUXEngine.calculateTypingDelay(b);
                    return i === 0 ? delay : Math.max(2500, delay); // follow-up bubble takes 2.5s - 4.5s
                });
            }
        }

        return { action, reactionEmoji, bubbles, typingDelays, text: responseText };
    }
}
