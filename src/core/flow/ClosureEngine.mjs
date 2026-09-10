// src/core/flow/ClosureEngine.mjs
// Graceful conversation closure and exit engine

export class ClosureEngine {
    static CLOSURE_RESPONSES = Object.freeze({
        SEMARANGAN_JAWA: Object.freeze([
            'yoi santai wae lur', 'sip aman', 'oke siap mas', 'yoi ati-ati ya'
        ]),
        CASUAL_INDO: Object.freeze([
            'sip aman', 'yoi santai', 'oke siap', 'siap mas'
        ]),
        FORMAL: Object.freeze([
            'baik, sama-sama', 'siap, terima kasih kembali'
        ])
    });

    /**
     * Evaluates whether the conversation is at an exit point and provides an authentic closing response
     * @param {Object} params
     * @param {string} params.text
     * @param {string} [params.languageStyle='CASUAL_INDO']
     * @returns {Object} Closure evaluation
     */
    static evaluate({ text = '', languageStyle = 'CASUAL_INDO' }) {
        const lower = text.toLowerCase().trim();

        const words = lower.split(/\s+/).filter(Boolean);
        const hasClosure = /\b(makasih|terima\s*kasih|terimakasih|suwun|matur\s*nuwun|maturnuwun|thx|thanks|yowis|yo wis|duluan|bye|dadah|oke|siap|sip|mantap|noted|aman)\b/i.test(lower);
        const isClosing = words.length <= 5 && hasClosure && !lower.includes('?');

        if (!isClosing) {
            return {
                isClosing: false,
                requiresResponse: true,
                terminalResponse: null,
                directiveText: 'PERCAKAPAN BERJALAN: Jawab secara wajar.'
            };
        }

        const pool = languageStyle === 'SEMARANGAN_JAWA'
            ? this.CLOSURE_RESPONSES.SEMARANGAN_JAWA
            : (languageStyle === 'FORMAL_INDO' ? this.CLOSURE_RESPONSES.FORMAL : this.CLOSURE_RESPONSES.CASUAL_INDO);

        const terminalResponse = pool[Math.floor(Math.random() * pool.length)];

        return {
            isClosing: true,
            requiresResponse: true,
            terminalResponse,
            directiveText: 'PENUTUPAN / EXIT DETECTED: Jawab sangat singkat (1-3 kata), JANGAN pancing obrolan baru, biarkan percakapan selesai!'
        };
    }
}
