// src/core/flow/TopicShiftEngine.mjs
// Natural topic shift detector and human-like conversational bridge generator

export class TopicShiftEngine {
    static SHIFT_BRIDGES = Object.freeze({
        CASUAL_JAWA: Object.freeze(['oiyo', 'eh lha iya', 'ngomong-ngomong', 'eh btw']),
        CASUAL_INDO: Object.freeze(['eh btw', 'ngomong-ngomong', 'eh iya', 'o iya']),
        FORMAL: Object.freeze(['terkait hal lain,', 'mengenai hal berikutnya,'])
    });

    /**
     * Detects if a topic shift is occurring and provides a smooth conversational bridge
     * @param {Object} params
     * @param {string} params.currentText
     * @param {string} [params.previousTopic='']
     * @param {string} [params.languageStyle='CASUAL_INDO']
     * @returns {Object} Topic shift decision
     */
    static evaluate({ currentText = '', previousTopic = '', languageStyle = 'CASUAL_INDO' }) {
        const lower = currentText.toLowerCase();

        const hasExplicitShift = /^(btw|ngomong-ngomong|eh iya|oiyo|anyway)/i.test(lower);
        
        let bridge = '';
        if (hasExplicitShift) {
            const list = languageStyle === 'SEMARANGAN_JAWA' 
                ? this.SHIFT_BRIDGES.CASUAL_JAWA 
                : this.SHIFT_BRIDGES.CASUAL_INDO;
            bridge = list[Math.floor(Math.random() * list.length)];
        }

        return {
            isShifting: hasExplicitShift,
            bridge,
            directive: hasExplicitShift 
                ? 'TOPIK BERUBAH: Pindah topik secara luwes, jangan sangkutpautkan lagi dengan topik lama!' 
                : 'TOPIK KONTINU: Jaga kelancaran alur diskusi yang sedang berjalan.'
        };
    }
}
