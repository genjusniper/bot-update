// src/core/multimodal/processors/AudioIntelligenceProcessor.mjs
// Audio & Voice Note (PTT) Intelligence: Speech Understanding, Spoken Intent, and Voice Commitments

export class AudioIntelligenceProcessor {
    /**
     * Processes audio / voice note into structured intelligence
     * @param {Object} params
     * @param {string|Buffer} [params.audioData]
     * @param {string} [params.simulatedTranscript]
     * @param {Object} [params.metadata={}]
     * @param {Object} [params.context={}]
     * @returns {Object} Audio Analysis
     */
    static process({ audioData, simulatedTranscript = '', metadata = {}, context = {} }) {
        const isVoiceNote = metadata.isPtt || metadata.mimeType?.includes('ogg');
        const transcriptText = simulatedTranscript || (metadata.caption || '');
        const lower = transcriptText.toLowerCase();

        // 1. Detect Spoken Intent
        let intent = 'GENERAL_AUDIO';
        if (/\b(tolong|bantu|kerjakan|kirim|buatkan)\b/i.test(lower)) {
            intent = 'VOICE_REQUEST';
        } else if (/\b(tanya|gimana|apa|kenapa|kapan|siapa)\b/i.test(lower) || transcriptText.includes('?')) {
            intent = 'VOICE_QUERY';
        } else if (/\b(capek|curhat|pusing|kesel)\b/i.test(lower)) {
            intent = 'VOICE_CURHAT';
        }

        // 2. Detect Spoken Commitments
        const voiceCommitments = [];
        if (/\b(besok (tak|aku|kita|saya)|nanti (tak|aku|kita|saya)|aku janji|tolong (ingetin|ingatkan)|jangan lupa)\b/i.test(lower)) {
            voiceCommitments.push({
                type: 'VOICE_PROMISE',
                statement: transcriptText,
                dueSuggestion: 'NEXT_DAY'
            });
        }

        return {
            modality: isVoiceNote ? 'VOICE_NOTE' : 'AUDIO',
            audioTranscript: {
                text: transcriptText,
                language: 'id-ID',
                confidence: transcriptText ? 0.90 : 0.40,
                durationSec: metadata.durationSec || 5
            },
            extractedText: transcriptText,
            intent,
            voiceCommitments,
            isUnderstood: transcriptText.length > 0
        };
    }
}
