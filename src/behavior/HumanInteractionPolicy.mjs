// src/behavior/HumanInteractionPolicy.mjs
// V13.7 — Improved bubble splitting, reactions, and delivery logic

import { BubbleSequencer } from './BubbleSequencer.mjs';
import { HumanUXEngine } from '../subsystems/ux/HumanUXEngine.mjs';
import { ConversationEndingDetector } from './ConversationEndingDetector.mjs';

export class HumanInteractionPolicy {
    static decideDelivery(userMessage, rawResponse, options = {}) {
        const text = (userMessage || '').trim().toLowerCase();
        const responseText = (rawResponse || '').trim();

        if (!responseText) {
            return { action: 'REACT_ONLY', reactionEmoji: '👍', bubbles: [], typingDelays: [0], text: '' };
        }

        // 1. Conversation ending
        if (ConversationEndingDetector.isEnding(text)) {
            const signOff = ConversationEndingDetector.getSignOff(text);
            return {
                action: 'REPLY_SINGLE',
                reactionEmoji: signOff.reactionEmoji,
                bubbles: [signOff.reply],
                typingDelays: [HumanUXEngine.calculateTypingDelay(signOff.reply, false)],
                text: signOff.reply
            };
        }

        let action = 'REPLY_SINGLE';
        let reactionEmoji = null;
        let bubbles = [responseText];
        let typingDelays = [HumanUXEngine.calculateTypingDelay(responseText, options.hasMedia)];

        // 2. Reaction-only triggers (35% chance for very short casual inputs)
        if (text.match(/^(wkwk|wkwkwk|haha|ngakak|lucu banget)$/i)) {
            if (Math.random() < 0.35 && !options.hasMedia) {
                return { action: 'REACT_ONLY', reactionEmoji: '😂', bubbles: [], typingDelays: [0], text: '' };
            }
            reactionEmoji = '😂';
        } else if (text.match(/^(mantap|keren|makasih|suwun|tengkyu|jos|thanks|thx|sip|siap)$/i)) {
            if (Math.random() < 0.40) {
                return { action: 'REACT_ONLY', reactionEmoji: '👍', bubbles: [], typingDelays: [0], text: '' };
            }
        } else if (text.match(/^(nice|wow|gila|gilak|anjir|parah)$/i)) {
            if (Math.random() < 0.30) {
                return { action: 'REACT_ONLY', reactionEmoji: '🔥', bubbles: [], typingDelays: [0], text: '' };
            }
        }

        // 3. Smart bubble splitting for longer responses
        // Split into max 2 bubbles only for responses >80 chars with natural paragraph breaks
        if (responseText.length > 80 && responseText.includes('\n')) {
            const seqBubbles = BubbleSequencer.sequence(responseText, 2);
            if (seqBubbles.length > 1) {
                action = 'REPLY_MULTI_BUBBLE';
                bubbles = seqBubbles;
                typingDelays = bubbles.map((b, i) => {
                    const delay = HumanUXEngine.calculateTypingDelay(b);
                    return i === 0 ? delay : Math.min(delay, 1000); // cap subsequent bubbles
                });
            }
        }

        return { action, reactionEmoji, bubbles, typingDelays, text: responseText };
    }
}
