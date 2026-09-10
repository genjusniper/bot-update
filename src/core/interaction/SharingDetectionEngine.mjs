// src/core/interaction/SharingDetectionEngine.mjs
// Distinguishes between unsolicited storytelling/sharing vs direct requests for solutions/advice

export class SharingDetectionEngine {
    static SHARING_TRIGGERS = Object.freeze([
        /^(tadi|kemarin|barusan|pas tadi|waktu itu)\b/i,
        /\b(gue ketemu|gua liat|ada orang|si \w+ tadi|dianya malah)\b/i,
        /\b(ceritanya|awalnya|terus taunya|eh tau gak)\b/i
    ]);

    static ADVICE_TRIGGERS = Object.freeze([
        /\b(menurut lu|menurutmu|enaknya gimana|harus gimana|ada saran|solusinya apa|mending gimana)\b/i,
        /\b(gimana caranya|bisa tolong kasih tau|minta pendapat|rekomen)\b/i,
        /\?$/
    ]);

    /**
     * Evaluates whether user is purely sharing an experience or soliciting advice
     * @param {string} text
     * @returns {Object} { isSharing: boolean, isAdviceRequest: boolean, probeNeeded: boolean }
     */
    static evaluate(text = '') {
        const lower = (text || '').toLowerCase().trim();

        const hasAdviceTrigger = this.ADVICE_TRIGGERS.some(re => re.test(lower));
        const hasSharingTrigger = this.SHARING_TRIGGERS.some(re => re.test(lower));

        if (hasAdviceTrigger) {
            return {
                isSharing: false,
                isAdviceRequest: true,
                probeNeeded: false,
                directive: 'SOLUSI/PENDAPAT DIMINTA: Berikan pandangan praktis secara ringkas.'
            };
        }

        if (hasSharingTrigger || (!lower.includes('?') && lower.length > 25)) {
            return {
                isSharing: true,
                isAdviceRequest: false,
                probeNeeded: true,
                directive: 'USER HANYA CERITA: Dengarkan! Jangan beri 5 solusi. Berikan tanggapan penasaran/reaktif santai.'
            };
        }

        return {
            isSharing: false,
            isAdviceRequest: false,
            probeNeeded: false,
            directive: 'PERCAKAPAN UMUM: Tanggapi secara wajar.'
        };
    }
}
