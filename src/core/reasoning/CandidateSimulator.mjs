// src/core/reasoning/CandidateSimulator.mjs
// Evaluates candidate response strategies against Mas Agus's behavioral invariants

export class CandidateSimulator {
    /**
     * Evaluates multiple candidate response approaches and picks the optimal one
     * @param {Object} params
     * @param {string} params.text - User text
     * @param {Object} params.contract - PersonalContextContract
     * @returns {{ optimalStrategy: string, score: number, candidates: Object[] }}
     */
    static evaluateCandidates({ text = '', contract = {} }) {
        const directness = contract.how?.directnessScore || 0.8;
        const adviceAllowed = contract.cognitive?.adviceAllowed ?? true;
        const humorStyle = contract.how?.humorStyle || 'OFF';

        const candidates = [
            {
                name: 'CONCISE_DIRECT',
                description: 'Direct answer in 3-10 words without unsolicited advice',
                score: 0.85 + (directness * 0.1)
            },
            {
                name: 'ELABORATE_EXPLANATION',
                description: 'Detailed multi-paragraph breakdown with tips',
                // Severely penalized if advice is not allowed or directness is high
                score: adviceAllowed ? 0.60 - (directness * 0.3) : 0.10
            },
            {
                name: 'WITTY_ONE_LINER',
                description: 'Short witty reply or banter',
                // Only favored if humor is allowed and style is DRY_TEASE / SARCASM
                score: humorStyle !== 'OFF' ? 0.75 : 0.05
            },
            {
                name: 'PASSIVE_ACKNOWLEDGE',
                description: 'Cool acknowledgement ("sip", "oke", "siap")',
                score: 0.70
            }
        ];

        // Sort descending by score
        candidates.sort((a, b) => b.score - a.score);

        return {
            optimalStrategy: candidates[0].name,
            score: Number(candidates[0].score.toFixed(2)),
            candidates
        };
    }
}
