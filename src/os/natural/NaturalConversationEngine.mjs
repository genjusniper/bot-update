/**
 * NaturalConversationEngine.mjs
 * 
 * Removes mechanical chatbot patterns and provides:
 * 1. Response Length Adaptation (Brief inputs get snappy answers, deep inquiries get structured depth)
 * 2. Mirroring (Casual, formal, technical, concise)
 * 3. Asymmetric Conversational Rhythm (Avoids repetitive "Intro + 3 Bullets + CTA" formula)
 */

export class NaturalConversationEngine {
    /**
     * Determine optimal response characteristics
     */
    static shapeResponse({ incomingText, rawDraft, intel }) {
        const inClean = (incomingText || '').trim();
        const wordCount = inClean.split(/\s+/).filter(Boolean).length;

        // 1. Ultra-short query ("bisa?", "ada?", "ready?")
        if (wordCount <= 3 && !inClean.includes('\n')) {
            return {
                targetLength: 'PUNCHY_SHORT',
                maxSentences: 2,
                allowBullets: false,
                stripGreeting: true,
                styleDirective: 'Jawab singkat dan padat (1-2 kalimat langsung ke intinya), jangan beri salam pembuka atau bullet points.'
            };
        }

        // 2. Technical / Deep Business Inquiry
        if (wordCount > 15 || inClean.includes('arsitektur') || inClean.includes('bagaimana') || inClean.includes('cara kerja')) {
            return {
                targetLength: 'DETAILED_STRUCTURED',
                maxSentences: 6,
                allowBullets: true,
                stripGreeting: false,
                styleDirective: 'Berikan penjelasan yang berbobot dengan alur logis yang jelas.'
            };
        }

        // 3. Conversational Standard
        return {
            targetLength: 'BALANCED_NATURAL',
            maxSentences: 3,
            allowBullets: false,
            stripGreeting: true,
            styleDirective: 'Bicara seperti partner bisnis yang santai tapi tajam, jangan terdengar seperti robot CS.'
        };
    }

    /**
     * Post-process text to strip robotic chatbot cliches
     */
    static polishText(text, shape) {
        let polished = (text || '').trim();

        // Remove robotic CS greetings
        if (shape.stripGreeting) {
            polished = polished.replace(/^(?:Halo|Hai|Halo kak|Hai kak|Selamat (?:pagi|siang|sore|malam)!?)[,.\s]*/i, '');
        }

        // Remove repetitive robot closings ("Semoga membantu!", "Ada yang bisa saya bantu lagi?")
        polished = polished.replace(/(?:Semoga\s+membantu[!.]?|Ada\s+yang\s+bisa\s+saya\s+bantu\s+lagi\??|Apakah\s+ada\s+pertanyaan\s+lain\??)$/i, '').trim();

        return polished;
    }
}
