import { ReplyDecisionPolicy } from './ReplyDecisionPolicy.mjs';
import { HumanInteractionPolicy } from './HumanInteractionPolicy.mjs';
import { HumanUXEngine } from '../subsystems/ux/HumanUXEngine.mjs';
import { UXConflictResolver } from './UXConflictResolver.mjs';

export class ConversationDirector {
    static orchestrate({ text, chatId, pushName, rawResponse, conversationState, topicOutcome, socialDynamics = {} }) {
        const incomingText = (text || '').trim();
        const responseText = (rawResponse || '').trim();

        // 1. Reply Necessity Evaluation
        const necessity = ReplyDecisionPolicy.evaluate({ 
            text: incomingText, 
            incomingText, 
            conversationState, 
            topicOutcome 
        });

        // 2. Base Delivery Plan
        const delivery = HumanInteractionPolicy.decideDelivery(incomingText, responseText, {
            hasMedia: false
        });

        // 3. Apply UX Conflict Resolver (Energy, Overtalk, Initiative, Form)
        const resolvedDecision = UXConflictResolver.resolve({
            text: incomingText,
            chatId,
            rawResponse: responseText,
            history: socialDynamics.history || []
        });

        // Final Decision Logic (Orchestration)
        let finalAction = necessity.decision === 'REPLY' ? resolvedDecision.action : necessity.decision;
        let finalReaction = necessity.reactionEmoji || resolvedDecision.reactionEmoji || delivery.reactionEmoji;
        let finalBubbles = necessity.decision === 'REPLY' && resolvedDecision.action === 'REPLY' ? [resolvedDecision.text] : [];
        let finalDelays = [0];

        // If the reply necessity says REACT_ONLY or resolver says REACT_ONLY
        if (necessity.decision === 'REACT_ONLY' || resolvedDecision.action === 'REACT_ONLY') {
            finalAction = 'REACT_ONLY';
            finalReaction = necessity.reactionEmoji || resolvedDecision.reactionEmoji || '😂';
            finalBubbles = [];
            finalDelays = [0];
        }

        // If the reply necessity says READ_ONLY or IGNORE or resolver says SILENT
        if (necessity.decision === 'READ_ONLY' || necessity.decision === 'IGNORE' || resolvedDecision.action === 'READ_ONLY' || resolvedDecision.action === 'SILENT') {
            finalAction = 'READ_ONLY';
            finalBubbles = [];
            finalDelays = [0];
        }

        // 4. Post-Processing & Output Sanitation (Trailing periods, exclamation marks, laughter limits)
        const cleanedBubbles = finalBubbles.map(b => {
            let clean = b.replace(/!+/g, ''); // Strip exclamation marks
            clean = clean.replace(/\b(cok|cuk|asu|matamu|ndasmu|pantek|anjing|bangsat|goblok|babi|kontol|memek|jembut)\b/gi, ''); // Strip toxic profanities
            
            // Limit wkwk/haha laughter to max one
            if (clean.toLowerCase().includes('wkwk') && clean.toLowerCase().includes('haha')) {
                clean = clean.replace(/\b(haha|hahaha)\b/gi, '');
            }
            const wkwkMatches = clean.match(/wkwk/gi);
            if (wkwkMatches && wkwkMatches.length > 1) {
                clean = clean.replace(/wkwk/gi, (match, offset, string) => {
                    return offset === string.toLowerCase().indexOf('wkwk') ? 'wkwk' : '';
                });
            }

            clean = clean.replace(/\s{2,}/g, ' ').trim();
            clean = clean.replace(/\.+$/, ''); // Strip trailing periods
            return clean;
        }).filter(b => b.length > 0);

        // Adjust typing delays dynamically based on complexity and pacing rules
        const adjustedDelays = cleanedBubbles.map((b, i) => {
            const baseDelay = HumanUXEngine.calculateTypingDelay(b);
            // Apply unhurried natural pacing: first bubble gets normal delay, second gets slight breather
            return i === 0 ? baseDelay : Math.min(4500, Math.max(2200, baseDelay + 500));
        });

        return {
            action: cleanedBubbles.length > 0 ? finalAction : 'READ_ONLY',
            reactionEmoji: finalReaction,
            bubbles: cleanedBubbles,
            typingDelays: adjustedDelays,
            text: cleanedBubbles.join('\n')
        };
    }
}
