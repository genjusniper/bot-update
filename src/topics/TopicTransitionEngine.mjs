// src/topics/TopicTransitionEngine.mjs
// TopicTransitionEngine: Handles natural topic shifting and bridging back to open loops/past topics

export class TopicTransitionEngine {
    static evaluate({ text, topicGraph, outcomeData = null }) {
        const lower = (text || '').trim().toLowerCase();

        // Topic shift triggers
        const isShifting = Boolean(lower.match(/\b(btw|ngomong-ngomong|ngomong2|eh|oia|oalah|sek2|sebentar)\b/i));

        const directives = [];
        if (isShifting && outcomeData && outcomeData.status === 'UNRESOLVED') {
            const plan = outcomeData.planName || 'rencana kemarin';
            directives.push(`- TOPIC TRANSITION (Jembatan Transisi): Lawan bicara ingin berpindah topik. Sambungkan transisi ini dengan menjembatani balik rencana tertunda kemarin: "${plan}" secara natural (contoh: "mantap wkwk. eh btw, PC-mu kemarin jadi dibenerin?", "siap. eh ngomong-ngomong, janjimu kemarin gimana?").`);
        }

        return {
            directive: directives.length > 0 ? `=== TOPIC TRANSITION ENGINE ===\n${directives.join('\n')}\n===============================` : ''
        };
    }
}
