// src/core/interaction/PunchlineSelectionEngine.mjs
// "Ngena" Engine: identifies the core emotional or logical pivot for concise, high-impact replies

export class PunchlineSelectionEngine {
    /**
     * Evaluates text for pivot opportunities
     * @param {Object} params
     * @param {string} params.text
     * @param {string} params.interactionMode
     * @returns {Object} { shouldPivot: boolean, directive: string }
     */
    static evaluate({ text = '', interactionMode = 'Casual' }) {
        const lower = (text || '').toLowerCase().trim();

        // Check for self-doubt or binary dilemma
        const hasDoubt = /gagal|bukan jalan|nyerah|berhenti|takut|bingung mau/i.test(lower);
        const hasContradiction = /tapi kok|padahal udah|kenapa malah/i.test(lower);

        if (interactionMode === 'Deep Talk' || (hasDoubt && interactionMode !== 'Closing')) {
            return {
                shouldPivot: true,
                focusPoint: 'EMOTIONAL_CORE',
                directive: 'PUNCHLINE NGENA: Sorot titik balik terpenting dalam 1 kalimat pendek yang mengena di hati/logika user.'
            };
        }

        if (hasContradiction) {
            return {
                shouldPivot: true,
                focusPoint: 'CONTRADICTION',
                directive: 'PUNCHLINE NGENA: Sorot kontradiksi situasi secara jernih dan santai.'
            };
        }

        return {
            shouldPivot: false,
            focusPoint: 'NATURAL_FLOW',
            directive: 'JAWAB NATURAL: Tanggapi langsung sesuai topik tanpa memaksakan punchline.'
        };
    }
}
