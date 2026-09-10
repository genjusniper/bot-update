// src/core/fabric/MetaCognitionLayer.mjs
// Evaluates reasoning quality, uncertainty calibration, and cognitive blindspots

export class MetaCognitionLayer {
    /**
     * Self-evaluates reasoning process and calibrates uncertainty
     * @param {Object} params
     * @param {Object} params.contract - PersonalContextContract
     * @param {Object} params.grounding - RealityGrounding evaluation
     * @param {string} [params.generatedText='']
     * @returns {{ confidenceScore: number, isSound: boolean, blindspots: string[], calibrationState: string }}
     */
    static evaluate({ contract = {}, grounding = {}, generatedText = '' }) {
        const blindspots = [];
        let confidenceScore = grounding.certaintyScore || 0.8;

        // Check if generated text contradicts grounding (e.g. asserting certainty when epistemic class is PREDICTION)
        if (grounding.epistemicClass === 'PREDICTION' && /pasti|100%|dijamin/i.test(generatedText)) {
            blindspots.push('OVERCONFIDENT_PREDICTION');
            confidenceScore *= 0.8;
        }

        // Check if directness matches contract
        const directness = contract.how?.directnessScore || 0.8;
        if (directness > 0.85 && generatedText.split(/\s+/).length > 25) {
            blindspots.push('EXCESSIVE_VERBOSITY_UNDER_HIGH_DIRECTNESS');
        }

        const isSound = blindspots.length === 0;
        const calibrationState = isSound ? 'CALIBRATED' : 'NEEDS_ADJUSTMENT';

        return {
            confidenceScore: Number(confidenceScore.toFixed(2)),
            isSound,
            blindspots,
            calibrationState
        };
    }
}
