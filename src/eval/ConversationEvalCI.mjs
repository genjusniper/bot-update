// src/eval/ConversationEvalCI.mjs

export class ConversationEvalCI {
    static evaluateTurn(userMessage, aiResponse, previousHistory = []) {
        const text = (aiResponse || '').trim();
        let scores = {
            naturalness: 1.0,
            brevityAppropriateness: 1.0,
            boredomPenalty: 0.0,
            roboticArtifacts: []
        };

        // 1. Check Robotic Phrasing Penalty
        const roboticPhrases = [
            'halo! ada yang bisa',
            'tentu saja, saya',
            'sebagai asisten ai',
            'apakah ada hal lain yang',
            'semoga membantu ya'
        ];

        for (const phrase of roboticPhrases) {
            if (text.toLowerCase().includes(phrase)) {
                scores.naturalness -= 0.3;
                scores.boredomPenalty += 0.25;
                scores.roboticArtifacts.push(phrase);
            }
        }

        // 2. Check Brevity Mismatch (User sends 1 word, AI sends paragraph)
        if (userMessage.length < 10 && text.split(/\s+/).length > 25) {
            scores.brevityAppropriateness -= 0.4;
            scores.boredomPenalty += 0.3;
        }

        // 3. Check Repetitive Openers from history
        if (previousHistory.length > 0) {
            const lastAiMsg = previousHistory.filter(h => h.role === 'assistant').slice(-1)[0];
            if (lastAiMsg && lastAiMsg.text) {
                const firstWordCurrent = text.split(/\s+/)[0];
                const firstWordLast = lastAiMsg.text.split(/\s+/)[0];
                if (firstWordCurrent && firstWordCurrent.toLowerCase() === firstWordLast.toLowerCase() && firstWordCurrent.length > 3) {
                    scores.boredomPenalty += 0.2;
                }
            }
        }

        const finalScore = Math.max(0, (scores.naturalness + scores.brevityAppropriateness) / 2 - scores.boredomPenalty);

        return {
            passed: finalScore >= 0.70,
            overallScore: Math.round(finalScore * 100),
            boredomScore: Math.round(scores.boredomPenalty * 100),
            artifacts: scores.roboticArtifacts
        };
    }
}
