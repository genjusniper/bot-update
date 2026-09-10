// src/core/cognition/MetaCognitionEngine.mjs
// Phase 38: Meta-Cognition & Capability Gap Detector
// Blind-spot detection, epistemic humility, self-correction trigger, and anti-confabulation.

import { ToolCapabilityFabric } from '../tools/ToolCapabilityFabric.mjs';

export const CognitiveGapType = Object.freeze({
    TOOL_GAP: 'TOOL_GAP',
    KNOWLEDGE_GAP: 'KNOWLEDGE_GAP',
    LIVE_DATA_GAP: 'LIVE_DATA_GAP',
    AUTH_GAP: 'AUTH_GAP',
    TEMPORAL_GAP: 'TEMPORAL_GAP'
});

export const EpistemicState = Object.freeze({
    CONFIDENT_COMPETENCE: 'CONFIDENT_COMPETENCE',
    PARTIAL_KNOWLEDGE: 'PARTIAL_KNOWLEDGE',
    UNSUPPORTED_CAPABILITY: 'UNSUPPORTED_CAPABILITY',
    UNVERIFIABLE_SPECULATION: 'UNVERIFIABLE_SPECULATION'
});

export const MitigationStrategy = Object.freeze({
    EXECUTE_NORMAL: 'EXECUTE_NORMAL',
    CONFESS_GAP_WITH_ALTERNATIVE: 'CONFESS_GAP_WITH_ALTERNATIVE',
    PROMPT_SETUP: 'PROMPT_SETUP',
    DECLINE_SAFELY: 'DECLINE_SAFELY'
});

export class MetaCognitionEngine {
    // Known blindspots / unsupported capabilities in standard WA bot environment
    static #UNSUPPORTED_CAPABILITY_PATTERNS = [
        {
            regex: /\b(cctv|kamera\s+rumah|pantau\s+kamera|live\s+cam)\b/i,
            type: CognitiveGapType.TOOL_GAP,
            missing: 'CCTV_STREAMING_PLUGIN',
            explanation: 'Gue belum terhubung ke feed kamera CCTV.'
        },
        {
            regex: /\b(saldo\s+(bca|bri|mandiri|bni|dana|gopay|ovo)|transfer\s+uang|kirim\s+saldo)\b/i,
            type: CognitiveGapType.TOOL_GAP,
            missing: 'BANKING_API_INTEGRATION',
            explanation: 'Gue nggak punya akses langsung ke sistem perbankan/finansial pribadi.'
        },
        {
            regex: /\b(pesan\s+(tiket|hotel|gojek|grab)|booking\s+kamar)\b/i,
            type: CognitiveGapType.TOOL_GAP,
            missing: 'COMMERCIAL_BOOKING_AGENT',
            explanation: 'Gue belum dipasangi integrasi booking otomatis.'
        },
        {
            regex: /\b(prediksi\s+togel|nomor\s+keluar\s+besok|angka\s+hoki)\b/i,
            type: CognitiveGapType.TEMPORAL_GAP,
            missing: 'FUTURE_PRECOGNITION',
            explanation: 'Gue nggak melayani tebak-tebakan masa depan atau judi.'
        }
    ];

    /**
     * Assesses cognitive boundaries and detects capability gaps for an incoming user query
     * @param {Object} params
     * @param {string} params.text
     * @param {Object} [params.context={}]
     * @returns {Object} MetaCognitionReport
     */
    static assess({ text = '', context = {} }) {
        if (!text || typeof text !== 'string') {
            return {
                hasGap: false,
                gapType: null,
                missingCapability: null,
                confidence: 1.0,
                epistemicState: EpistemicState.CONFIDENT_COMPETENCE,
                mitigationStrategy: MitigationStrategy.EXECUTE_NORMAL,
                humilityDirective: ''
            };
        }

        const lower = text.toLowerCase().trim();

        // 1. Check known unsupported capability patterns
        for (const cap of this.#UNSUPPORTED_CAPABILITY_PATTERNS) {
            if (cap.regex.test(lower)) {
                return {
                    hasGap: true,
                    gapType: cap.type,
                    missingCapability: cap.missing,
                    confidence: 0.1,
                    epistemicState: EpistemicState.UNSUPPORTED_CAPABILITY,
                    mitigationStrategy: MitigationStrategy.CONFESS_GAP_WITH_ALTERNATIVE,
                    explanation: cap.explanation,
                    humilityDirective: `[META-COGNITION ALERT] Katakan dengan santai dan jujur: "${cap.explanation}". Tawarkan bantuan alternatif jika mereka punya data teks/foto.`
                };
            }
        }

        // 2. Check live dynamic data queries lacking web or live integration
        if (/\b(harga\s+saham\s+menit\s+ini|kurs\s+detik\s+ini|penerbangan\s+live)\b/i.test(lower)) {
            const hasWebSearch = ToolCapabilityFabric.getTool('WEB_SEARCH_PRIMARY') !== null;
            if (!hasWebSearch) {
                return {
                    hasGap: true,
                    gapType: CognitiveGapType.LIVE_DATA_GAP,
                    missingCapability: 'REALTIME_MARKET_TICKER',
                    confidence: 0.4,
                    epistemicState: EpistemicState.PARTIAL_KNOWLEDGE,
                    mitigationStrategy: MitigationStrategy.CONFESS_GAP_WITH_ALTERNATIVE,
                    explanation: 'Data live ticker detik ini memerlukan feed pasar real-time.',
                    humilityDirective: '[META-COGNITION ALERT] Akui data detik ini belum live di memori; berikan angka penutupan terakhir atau estimasi umum.'
                };
            }
        }

        // 3. Normal competent operation
        return {
            hasGap: false,
            gapType: null,
            missingCapability: null,
            confidence: 0.95,
            epistemicState: EpistemicState.CONFIDENT_COMPETENCE,
            mitigationStrategy: MitigationStrategy.EXECUTE_NORMAL,
            humilityDirective: ''
        };
    }

    /**
     * Self-critiques an AI-generated draft to catch confabulations in identified gap areas
     * @param {Object} params
     * @param {string} params.draftText
     * @param {Object} params.metaReport
     * @returns {{ approved: boolean, rectifiedText: string, correctionApplied: boolean }}
     */
    static selfCritiqueDraft({ draftText = '', metaReport = null }) {
        if (!metaReport || !metaReport.hasGap) {
            return { approved: true, rectifiedText: draftText, correctionApplied: false };
        }

        const lowerDraft = draftText.toLowerCase();

        // Check if draft falsely claims to have performed the unsupported capability
        const claimsSuccessfulExecution = /\b(sudah\s+saya\s+(cek|transfer|booking|pantau)|berhasil\s+di(transfer|booking))\b/i.test(lowerDraft);

        if (claimsSuccessfulExecution) {
            // Rectify draft with epistemic humility
            const rectified = metaReport.explanation + ' Kalau ada data atau screenshot yang mau dianalisis, kirim aja ke sini.';
            return {
                approved: false,
                rectifiedText: rectified,
                correctionApplied: true
            };
        }

        return { approved: true, rectifiedText: draftText, correctionApplied: false };
    }
}