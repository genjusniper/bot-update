/**
 * NextBestActionEngine.mjs
 * 
 * Determines what conversational action to take next, rather than jumping into
 * generic text generation or premature pitch.
 * 
 * Available Actions:
 * - ANSWER
 * - ASK
 * - CLARIFY
 * - DEMONSTRATE
 * - EXPLAIN
 * - QUALIFY
 * - HANDLE_OBJECTION
 * - OFFER_DEMO
 * - HANDOFF
 * - WAIT
 * - STOP
 */

export class NextBestActionEngine {
    static ACTIONS = {
        ANSWER: 'ANSWER',
        ASK: 'ASK',
        CLARIFY: 'CLARIFY',
        DEMONSTRATE: 'DEMONSTRATE',
        EXPLAIN: 'EXPLAIN',
        QUALIFY: 'QUALIFY',
        HANDLE_OBJECTION: 'HANDLE_OBJECTION',
        OFFER_DEMO: 'OFFER_DEMO',
        HANDOFF: 'HANDOFF',
        WAIT: 'WAIT',
        STOP: 'STOP'
    };

    /**
     * Decide the next best conversational action
     * @param {Object} params
     * @param {Object} params.intel - Output from ConversationIntelligenceEngine
     * @param {Object} [params.leadDna] - Output from LeadDNAEngine
     * @param {Object} [params.memory] - Conversation memory graph node
     */
    static decide({ intel, leadDna = null, memory = null }) {
        const { intent, seriousness, stage, objections, emotionalTone, buyingSignals, painPoints } = intel;

        // 1. Passive Closing -> STOP immediately (Dignity Protocol)
        if (intent === 'PASSIVE_CLOSING' || seriousness < 0.25) {
            return {
                action: this.ACTIONS.STOP,
                rationale: 'Passive closing token detected. Cease commercial pursuit with graceful sign-off.'
            };
        }

        // 2. Direct Human Handoff Request -> HANDOFF
        if (intent === 'HUMAN_HANDOFF_REQUEST' || buyingSignals.includes('requests_direct_contact')) {
            return {
                action: this.ACTIONS.HANDOFF,
                target: 'OWNER_LID',
                rationale: 'Prospect explicitly requested human contact or negotiation.'
            };
        }

        // 3. Objections present -> HANDLE_OBJECTION (never pitch over an active objection)
        if (objections && objections.length > 0) {
            return {
                action: this.ACTIONS.HANDLE_OBJECTION,
                targetObjection: objections[0],
                rationale: `Active objection detected (${objections.join(', ')}). Deconstruct before advancing.`
            };
        }

        // 4. Frustrated Tone -> CLARIFY or ASK (Empathetic listening)
        if (emotionalTone === 'FRUSTRATED') {
            return {
                action: this.ACTIONS.CLARIFY,
                focus: 'pain_point_relief',
                rationale: 'User is frustrated with existing operational mess. Acknowledge and clarify core bottleneck.'
            };
        }

        // 5. High Seriousness + Trial Request -> OFFER_DEMO
        if (buyingSignals.includes('requests_demo_trial') && seriousness >= 0.70) {
            return {
                action: this.ACTIONS.OFFER_DEMO,
                rationale: 'Prospect explicitly requested trial/demo with high seriousness.'
            };
        }

        // 6. Broad/Ambiguous Inquiry in Awareness or Discovery -> CLARIFY
        if (stage === 'AWARENESS' || (intent === 'PRODUCT_INQUIRY' && painPoints.length === 0)) {
            return {
                action: this.ACTIONS.CLARIFY,
                rationale: 'Broad inquiry without specific pain point. Clarify business use case to avoid feature dumping.'
            };
        }

        // 7. Problem Discovery Stage with Identified Pain Point -> QUALIFY
        if (stage === 'PROBLEM_DISCOVERY' && painPoints.length > 0) {
            return {
                action: this.ACTIONS.QUALIFY,
                targetPainPoint: painPoints[0],
                rationale: 'Specific pain identified. Probe current volume and workflow impact.'
            };
        }

        // 8. Technical Architecture Evaluation -> EXPLAIN or DEMONSTRATE
        if (intent === 'TECHNICAL_ARCHITECTURE') {
            return {
                action: this.ACTIONS.EXPLAIN,
                depth: 'ARCHITECTURAL_HONESTY',
                rationale: 'Technical inquiry. Explain system pipeline, state machine, and safeguards.'
            };
        }

        // 9. Solution Exploration with Customization Signals -> DEMONSTRATE
        if (stage === 'SOLUTION_EXPLORATION' && buyingSignals.includes('asks_about_customization')) {
            return {
                action: this.ACTIONS.DEMONSTRATE,
                rationale: 'Show concrete modular workflow example matching custom requirement.'
            };
        }

        // Default -> ANSWER with relevant conversational hook
        return {
            action: this.ACTIONS.ANSWER,
            rationale: 'Standard conversational response with grounded relevance.'
        };
    }

    /**
     * Synthesize action-driven conversational guidance
     */
    static getActionGuidance(actionDecision) {
        switch (actionDecision.action) {
            case this.ACTIONS.CLARIFY:
                return 'Jangan langsung jualan atau sebut daftar fitur panjang. Validasi kebutuhan spesifik mereka dulu (misal: lebih butuh buat jawab CS, follow-up order, atau rekap stok?).';
            case this.ACTIONS.HANDLE_OBJECTION:
                return 'Jawab kekhawatiran dengan transparansi. Jelaskan bukti (evidence), arsitektur pembatas risiko, dan garansi kontrol.';
            case this.ACTIONS.STOP:
                return 'Tutup obrolan dengan sopan tanpa memaksa. Berikan pintu terbuka jika sewaktu-waktu mereka butuh bantuan.';
            case this.ACTIONS.QUALIFY:
                return 'Tanyakan skala operasional atau bottleneck utama mereka saat ini dengan santai.';
            case this.ACTIONS.OFFER_DEMO:
                return 'Tawarkan live sandbox atau simulasi skenario nyata yang sesuai dengan kasus mereka.';
            case this.ACTIONS.HANDOFF:
                return 'Arahkan ke Bos Agus dengan santun, sambil mencatat profil kebutuhan mereka.';
            default:
                return 'Jawab secara padat, relevan, dan buka ruang dialog natural.';
        }
    }
}
