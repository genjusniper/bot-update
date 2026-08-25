// src/quality/ConversationQualityGate.mjs
// Conversation Quality Control & Pre-Send Gatekeeper

import { HallucinationDetector } from './HallucinationDetector.mjs';

export class ConversationQualityGate {
    static validateDraft(draftText, context = {}) {
        let text = (draftText || '').trim();
        const failures = [];

        // 1. Robotic AI Cliche Filter
        const roboticClichés = [
            /sebagai (asisten|ai|model bahasa)/i,
            /tentu saja, saya (akan|bisa)/i,
            /saya memahami perasaan anda/i,
            /semoga membantu ya[!.]?/i
        ];
        for (const pattern of roboticClichés) {
            if (pattern.test(text)) {
                failures.push('ROBOTIC_PHRASING');
                text = text.replace(pattern, '').trim();
            }
        }

        // 2. Hallucination & Fact Claim Check
        const factVerification = HallucinationDetector.verifyFactClaims(text, context.verifiedFacts || []);
        if (factVerification.hasUnverifiedClaim) {
            failures.push('UNVERIFIED_MEMORY_CLAIM');
            text = factVerification.cleanText;
        }

        // 3. Excessive Length Guard
        const words = text.split(/\s+/).length;
        if (context.maxWords && words > (context.maxWords + 15)) {
            failures.push('OVER_LENGTH_LIMIT');
            // Trim to max sentences
            const sentences = text.split(/(?<=[.?!])\s+/);
            if (sentences.length > 2) {
                text = sentences.slice(0, 2).join(' ');
            }
        }

        // 4. Fallback/Error Spill Check
        if (text.includes('undefined') || text.includes('null') || text.includes('[object Object]')) {
            failures.push('CORRUPT_PAYLOAD');
            text = "Lagi agak lemot jaringannya barusan, bro. Coba kirim ulang ya!";
        }

        const approved = failures.length === 0;

        return {
            approved,
            failures,
            sanitizedText: text,
            qualityScore: approved ? 98 : Math.max(70, 98 - (failures.length * 10))
        };
    }
}
