// src/core/interaction/MessageBurstEngine.mjs
// Decides WhatsApp message shape: SINGLE, DOUBLE, TRIPLE, or BURST

export class MessageBurstEngine {
    static SHAPES = Object.freeze({
        SINGLE: 'SINGLE',
        DOUBLE: 'DOUBLE',
        TRIPLE: 'TRIPLE',
        BURST: 'BURST'
    });

    /**
     * Determines the optimal message shape and bubble count
     * @param {Object} params
     * @param {string} params.interactionMode
     * @param {string} params.roomState
     * @param {number} [params.urgency=0.2]
     * @param {boolean} [params.isGroup=false]
     * @param {number} [params.varianceSeed=0.5]
     * @returns {Object} { shape: string, maxBubbles: number, directive: string }
     */
    static decide({ interactionMode = 'Casual', roomState = 'CASUAL', urgency = 0.2, isGroup = false, varianceSeed = 0.5 }) {
        // 1. High Urgency or Group Chat -> ALWAYS SINGLE to prevent spamming
        if (urgency >= 0.7 || isGroup || interactionMode === 'Closing' || interactionMode === 'Silent/Minimal') {
            return {
                shape: this.SHAPES.SINGLE,
                maxBubbles: 1,
                directive: 'BENTUK PESAN: SINGLE BUBBLE. Padat dalam 1 pesan WhatsApp saja.'
            };
        }

        // 2. Excited or Banter with close friend -> DOUBLE or TRIPLE
        if (interactionMode === 'Banter' || roomState === 'EXCITED') {
            if (varianceSeed > 0.4) {
                return {
                    shape: this.SHAPES.DOUBLE,
                    maxBubbles: 2,
                    directive: 'BENTUK PESAN: DOUBLE BUBBLE. Pisahkan reaksi dan kalimat utama menjadi 2 bubble terpisah (misal: "iya" lalu "bentar gue cek").'
                };
            }
        }

        // 3. Storytelling or Deep Talk -> DOUBLE
        if (interactionMode === 'Storytelling' || interactionMode === 'Deep Talk') {
            return {
                shape: this.SHAPES.DOUBLE,
                maxBubbles: 2,
                directive: 'BENTUK PESAN: DOUBLE BUBBLE. Bagikan respon menjadi 2 bubble mengalir.'
            };
        }

        // 4. Default Casual: 60% Single, 40% Double
        if (varianceSeed > 0.6) {
            return {
                shape: this.SHAPES.DOUBLE,
                maxBubbles: 2,
                directive: 'BENTUK PESAN: DOUBLE BUBBLE. Kirim tanggapan santai dalam 2 bubble terpisah.'
            };
        }

        return {
            shape: this.SHAPES.SINGLE,
            maxBubbles: 1,
            directive: 'BENTUK PESAN: SINGLE BUBBLE. Cukup 1 bubble ringkas.'
        };
    }
}
