// src/communication/RepetitionDetector.mjs

export class RepetitionDetector {
    static checkRepetition(candidateText, recentHistory = []) {
        const text = (candidateText || '').toLowerCase().trim();
        const aiHistory = recentHistory.filter(h => h.role === 'assistant').map(h => (h.text || '').toLowerCase());

        let penalties = [];

        // 1. Same Opener Repetition
        if (aiHistory.length > 0) {
            const lastMsg = aiHistory[aiHistory.length - 1];
            const currentFirstWord = text.split(/\s+/)[0];
            const lastFirstWord = lastMsg.split(/\s+/)[0];

            if (currentFirstWord === lastFirstWord && currentFirstWord.length > 2) {
                penalties.push(`Repeated Opener: "${currentFirstWord}"`);
            }
        }

        // 2. Overuse of "wkwk" in consecutive turns
        const wkwkCount = (text.match(/wkwk/g) || []).length;
        if (wkwkCount > 2) {
            penalties.push('Excessive "wkwk" count');
        }

        return {
            hasRepetition: penalties.length > 0,
            penalties
        };
    }
}
