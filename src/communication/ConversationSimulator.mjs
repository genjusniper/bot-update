// src/communication/ConversationSimulator.mjs
import { AntiOverreactionEngine } from './AntiOverreactionEngine.mjs';
import { RepetitionDetector } from './RepetitionDetector.mjs';

export class ConversationSimulator {
    static evaluateAndRefine(candidateText, userMessage, rhythm, recentHistory = []) {
        let text = (candidateText || '').trim();

        // 1. Critic: Generic Phrase Cleanser
        const genericReplacements = [
            { pattern: /wah keren banget,?\s*/i, replacement: 'wkwk keren juga, ' },
            { pattern: /tentu saja,?\s*/i, replacement: '' },
            { pattern: /apakah ada yang bisa saya bantu\??/i, replacement: '' },
            { pattern: /terima kasih telah berbagi/i, replacement: 'wkwk asik juga' }
        ];

        for (const r of genericReplacements) {
            text = text.replace(r.pattern, r.replacement);
        }

        // 2. Critic: Anti-Overreaction Enforcement
        text = AntiOverreactionEngine.sanitizeReaction(userMessage, text);

        // 3. Critic: Repetition Detection
        const rep = RepetitionDetector.checkRepetition(text, recentHistory);
        if (rep.hasRepetition) {
            // Trim duplicate opener if repeated
            const words = text.split(/\s+/);
            if (words.length > 2 && (words[0].toLowerCase() === 'wkwk' || words[0].toLowerCase() === 'haha')) {
                text = words.slice(1).join(' ');
            }
        }

        // 4. Critic: Strict Length Budget
        const words = text.split(/\s+/);
        if (words.length > rhythm.maxWords) {
            text = words.slice(0, rhythm.maxWords).join(' ') + (rhythm.useEllipsis ? '..' : '');
        }

        return text.trim();
    }
}
