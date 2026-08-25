// src/communication/MemoryEvolution.mjs

export class MemoryEvolution {
    static evolveFacts(facts = []) {
        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

        return facts.map(f => {
            const ageMs = now - (f.updated_at || now);
            
            // Confidence decay over time
            let decayedConfidence = (f.confidence || 0.8) - (ageMs / thirtyDaysMs) * 0.2;
            decayedConfidence = Math.max(0.2, decayedConfidence);

            return {
                ...f,
                confidence: Number(decayedConfidence.toFixed(2)),
                status: decayedConfidence < 0.3 ? 'ARCHIVED' : 'ACTIVE'
            };
        });
    }

    static filterContextualFacts(facts, currentMessage) {
        const text = (currentMessage || '').toLowerCase();
        const active = facts.filter(f => f.status === 'ACTIVE');

        // Only inject facts that are semantically relevant to avoid weird over-personalization
        const relevant = active.filter(f => {
            const subjectMatch = f.subject && text.includes(f.subject.toLowerCase());
            const objectMatch = f.object && text.includes(f.object.toLowerCase());
            const predicateMatch = f.predicate && text.includes(f.predicate.toLowerCase());
            return subjectMatch || objectMatch || predicateMatch;
        });

        // If no direct matches, return up to 2 high-confidence general facts
        if (relevant.length === 0) {
            return active.sort((a, b) => b.confidence - a.confidence).slice(0, 2);
        }

        return relevant.slice(0, 4);
    }
}
