// src/communication/ConversationRhythmEngine.mjs

export class ConversationRhythmEngine {
    static determineRhythm(message, strategy, humorContext) {
        const text = (message || '').toLowerCase();
        
        let acts = [];

        // 1. Emotional React First (if excited or shocked)
        if (/^(anjir|gila|buse[tt]|wah|wkwk{2,}|parah)/.test(text)) {
            acts.push('REACT');
        }

        // 2. Add Humor if Opportunity Exists
        if (humorContext.opportunity) {
            acts.push('HUMOR');
        }

        // 3. Core Functional Act based on strategy
        if (strategy.mode === 'EXPLAIN') {
            acts.push('EXPLAIN');
        } else if (strategy.mode === 'DIRECT_ANSWER') {
            acts.push('ANSWER');
        } else if (strategy.mode === 'SHORT_ACKNOWLEDGE') {
            acts.push('ACK');
        } else {
            acts.push('CONVERSE');
        }

        // 4. Follow-Up question or thought (if conversation allows)
        if (strategy.mode !== 'SHORT_ACKNOWLEDGE' && acts.length < 3) {
            acts.push('FOLLOW_UP');
        }

        return {
            actSequence: acts, // e.g. ['REACT', 'HUMOR', 'FOLLOW_UP']
            instruction: `STRUKTUR RITME JAWABAN: ${acts.join(' -> ')}. Lakukan secara menyatu dan mengalir, jangan beri label bullet point.`
        };
    }
}
