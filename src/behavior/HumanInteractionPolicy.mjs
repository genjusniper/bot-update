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

        // 2. Multi-bubble splitting: split if text has newlines (\n or \n\n) for active listening + main response
        if (responseText.includes('\n')) {
            const seqBubbles = BubbleSequencer.sequence(responseText, 2);
            if (seqBubbles.length > 1) {
                action = 'REPLY_MULTI_BUBBLE';
                bubbles = seqBubbles;
                typingDelays = bubbles.map((b, i) => {
                    const delay = HumanUXEngine.calculateTypingDelay(b);
                    return i === 0 ? delay : Math.min(3500, Math.max(2000, delay));
                });
            }
        }

        return { action, reactionEmoji, bubbles, typingDelays, text: responseText };
    }
}
