// src/core/interaction/AcknowledgementStyleEngine.mjs
// Cool / Cuekin Intelligence: authentic, relaxed human acknowledgements

export class AcknowledgementStyleEngine {
    static STYLES = Object.freeze({
        DEEP: Object.freeze(['bener juga sih', 'paham gue maksud lu', 'masuk akal']),
        NORMAL: Object.freeze(['oke', 'siap', 'noted', 'siap mas']),
        CASUAL: Object.freeze(['yoi', 'sip aman', 'santai wae', 'yoi mas']),
        COOL: Object.freeze(['ohh', 'yaudah', 'gatau dah', 'bisa jadi', 'nah itu']),
        MINIMAL: Object.freeze(['oh', 'ok', 'yo']),
        PLAYFUL: Object.freeze(['wkwk iya', 'lah iya juga', 'parah emang'])
    });

    /**
     * Resolves acknowledgement style and phrase based on interaction mode and brevity
     * @param {Object} params
     * @param {string} params.interactionMode
     * @param {string} params.roomState
     * @param {number} [params.directness=0.8]
     * @returns {Object} { style: string, samplePhrases: string[], directive: string }
     */
    static resolve({ interactionMode = 'Casual', roomState = 'CASUAL', directness = 0.8 }) {
        if (interactionMode === 'Silent/Minimal') {
            return {
                style: 'MINIMAL',
                samplePhrases: Array.from(this.STYLES.MINIMAL),
                directive: 'ACKNOWLEDGEMENT MINIMAL: Cukup 1-2 kata cuek ("oh", "ok", "yo").'
            };
        }

        if (interactionMode === 'Banter') {
            return {
                style: 'PLAYFUL',
                samplePhrases: Array.from(this.STYLES.PLAYFUL),
                directive: 'ACKNOWLEDGEMENT PLAYFUL: Santai akrab ("wkwk iya", "lah iya juga").'
            };
        }

        if (roomState === 'VENTING' || interactionMode === 'Deep Talk') {
            return {
                style: 'DEEP',
                samplePhrases: Array.from(this.STYLES.DEEP),
                directive: 'ACKNOWLEDGEMENT DEEP: Berikan validasi tenang ("paham gue", "bener juga sih").'
            };
        }

        if (directness > 0.85) {
            return {
                style: 'COOL',
                samplePhrases: Array.from(this.STYLES.COOL),
                directive: 'ACKNOWLEDGEMENT COOL: Respon dingin tapi manusiawi ("ohh", "yaudah", "nah itu").'
            };
        }

        return {
            style: 'CASUAL',
            samplePhrases: Array.from(this.STYLES.CASUAL),
            directive: 'ACKNOWLEDGEMENT CASUAL: Santai dan bersahabat ("yoi", "sip aman").'
        };
    }
}
