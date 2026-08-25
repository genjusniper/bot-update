// src/context/ContextCompressor.mjs

export class ContextCompressor {
    static compress(rawHistory = [], maxTurns = 6) {
        if (rawHistory.length <= maxTurns) {
            return {
                summary: '',
                recentHistory: rawHistory
            };
        }

        // Split into older turns to summarize and recent turns to keep verbatim
        const olderTurns = rawHistory.slice(0, rawHistory.length - maxTurns);
        const recentHistory = rawHistory.slice(-maxTurns);

        // Simple extractive summarizer for older context
        const summaryPoints = olderTurns
            .filter(t => t.role === 'user' && t.text && t.text.length > 10)
            .map(t => t.text.slice(0, 50));

        const summary = summaryPoints.length > 0
            ? `Ringkasan Obrolan Sebelumnya: Pernah membahas (${summaryPoints.slice(-3).join('; ')})`
            : '';

        return {
            summary,
            recentHistory
        };
    }
}
