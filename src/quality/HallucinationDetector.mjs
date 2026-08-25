// src/quality/HallucinationDetector.mjs
// Hallucination & False-Memory Verification Guard

export class HallucinationDetector {
    static verifyFactClaims(draftText, verifiedFacts = []) {
        const text = (draftText || '').toLowerCase();
        
        // 1. Detect claims about past user statements
        const memoryClaimRegex = /(kemarin (lo|lu|kowe|kamu) (bilang|cerita|ngomong)|waktu itu (lo|lu|kowe)|katanya mau)/i;
        if (!memoryClaimRegex.test(text)) {
            return { hasUnverifiedClaim: false, confidence: 1.0, cleanText: draftText };
        }

        // 2. Cross-reference against actual stored facts
        const factObjects = verifiedFacts.map(f => ((f.object || '') + ' ' + (f.summary || '') + ' ' + (f.predicate || '')).toLowerCase());
        
        // Check if any verified fact matches the words in the claim
        let verified = false;
        for (const factStr of factObjects) {
            const significantWords = factStr.split(/\s+/).filter(w => w.length > 3);
            const matches = significantWords.filter(w => text.includes(w)).length;
            if (matches >= 2) {
                verified = true;
                break;
            }
        }

        if (!verified) {
            console.warn('[HallucinationDetector] ⚠️ Detected unverified memory claim in draft:', draftText.slice(0, 60));
            // Soften the claim so AI doesn't sound like it's hallucinating past events
            let softened = draftText
                .replace(/kemarin (lo|lu|kowe|kamu) (bilang|cerita|ngomong)/gi, 'eh ngomong-ngomong')
                .replace(/waktu itu (lo|lu|kowe)/gi, 'kalau gak salah');
            return {
                hasUnverifiedClaim: true,
                confidence: 0.5,
                cleanText: softened
            };
        }

        return { hasUnverifiedClaim: false, confidence: 0.95, cleanText: draftText };
    }
}
