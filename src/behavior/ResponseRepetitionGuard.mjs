// src/behavior/ResponseRepetitionGuard.mjs
// ResponseRepetitionGuard: Prevents bot from repeating laughter loops or sentence starts across turns

export class ResponseRepetitionGuard {
    static checkAndDiversify(draft, history = []) {
        let clean = (draft || '').trim();
        const recentAssistantTurns = history.filter(h => h.role === 'assistant').slice(-3).map(t => t.text.toLowerCase());

        if (recentAssistantTurns.length === 0) return clean;

        // 1. Prevent repeated wkwk/haha starts
        const hasRecentWkwk = recentAssistantTurns.some(t => t.startsWith('wkwk') || t.includes('wkwk'));
        if (hasRecentWkwk && clean.toLowerCase().startsWith('wkwk')) {
            clean = clean.replace(/^wkwk\s*/i, ''); // Strip wkwk start if used in previous turn
        }

        // 2. Prevent repeating exact responses or opening words
        const openingWord = clean.split(/\s+/)[0]?.toLowerCase();
        if (openingWord) {
            const hasRecentOpening = recentAssistantTurns.some(t => t.startsWith(openingWord));
            if (hasRecentOpening && openingWord !== 'aku' && openingWord !== 'yoi') {
                // Remove repeated opening word
                clean = clean.substring(openingWord.length).trim();
            }
        }

        return clean;
    }
}
