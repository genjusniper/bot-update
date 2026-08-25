// src/behavior/HumanInteractionPolicy.mjs
// Master Human Interaction Policy Engine (HIPE) with Response Budget & Closure Detection

import { BubbleSequencer } from './BubbleSequencer.mjs';
import { HumanUXEngine } from '../subsystems/ux/HumanUXEngine.mjs';
import { ConversationEndingDetector } from './ConversationEndingDetector.mjs';
import { ResponseBudgetEngine } from './ResponseBudgetEngine.mjs';

export class HumanInteractionPolicy {
    static decideDelivery(userMessage, rawResponse, options = {}) {
        const text = (userMessage || '').trim().toLowerCase();
        const responseText = (rawResponse || '').trim();

        // 1. Check for explicit conversation ending / sign-offs
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

        // 2. Reaction Triggers & Probabilities
        if (text.match(/^(wkwk|wkwkwk|haha|hahaha|ngakak|lucu banget)$/i)) {
            if (Math.random() < 0.35 && !options.hasMedia) {
                action = 'REACT_ONLY';
                reactionEmoji = '😂';
                bubbles = [];
                return { action, reactionEmoji, bubbles, typingDelays: [0], text: '' };
            } else {
                action = 'REPLY_SINGLE';
                reactionEmoji = '😂';
            }
        } else if (text.match(/^(mantap|keren|makasih|suwun|tengkyu|jos)$/i)) {
            if (Math.random() < 0.35) {
                action = 'REACT_ONLY';
                reactionEmoji = '👍';
                bubbles = [];
                return { action, reactionEmoji, bubbles, typingDelays: [0], text: '' };
            }
        }

        // 3. Sequence Bubbles naturally if multi-paragraph
        if (responseText.length > 80 && responseText.includes('\n')) {
            const seqBubbles = BubbleSequencer.sequence(responseText, 2);
            if (seqBubbles.length > 1) {
                action = 'REPLY_MULTI_BUBBLE';
                bubbles = seqBubbles;
                typingDelays = bubbles.map(b => HumanUXEngine.calculateTypingDelay(b));
            }
        }

        return {
            action,
            reactionEmoji,
            bubbles,
            typingDelays,
            text: responseText
        };
    }
}
