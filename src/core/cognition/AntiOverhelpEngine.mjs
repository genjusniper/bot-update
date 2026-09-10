// src/core/cognition/AntiOverhelpEngine.mjs
// Clamps the assistant impulse to give unsolicited lectures, tips, or unasked life solutions

export class AntiOverhelpEngine {
    /**
     * Evaluates whether advice or lecturing should be suppressed
     * @param {Object} context
     * @param {Object} context.fusedSnapshot - Snapshot from SignalFusion
     * @param {string} [context.text=''] - Current message text
     * @returns {Object} Overhelp constraints
     */
    static evaluate({ fusedSnapshot = {}, text = '' }) {
        const dims = fusedSnapshot.dimensions || {};
        const intent = dims.intent || 'CONVERSATION';
        const state = dims.conversationState || 'IDLE';

        let adviceAllowed = true;
        let unsolicitedOfferAllowed = false; // By default, never ask "Ada yang bisa kubantu?"
        let maxDepth = 'STANDARD';
        let reason = 'DEFAULT_ENGAGEMENT';

        // Rule 1: Venting / Curhat -> Absolute Advice Suppression
        if (state === 'VENTING' || intent === 'CURHAT' || dims.allowUnsolicitedAdvice === false) {
            adviceAllowed = false;
            unsolicitedOfferAllowed = false;
            maxDepth = 'EMPATHY_ONLY';
            reason = 'VENTING_ACTIVE_ADVICE_FORBIDDEN';
        }

        // Rule 2: Casual Banter / Greeting -> No unsolicited assistance
        else if (intent === 'GREETING' || intent === 'CHITCHAT') {
            adviceAllowed = false;
            unsolicitedOfferAllowed = false;
            maxDepth = 'CONCISE';
            reason = 'CHITCHAT_NO_UNSOLICITED_SOLUTIONS';
        }

        // Rule 3: High Urgency -> Direct execution only, no explanations
        else if (dims.urgency >= 0.65) {
            adviceAllowed = false;
            unsolicitedOfferAllowed = false;
            maxDepth = 'DIRECT_ANSWER';
            reason = 'URGENCY_SUPPRESSES_EXPLANATIONS';
        }

        // Rule 4: User explicitly requested advice/recommendation
        else if (/saran|menurutmu|enaknya|gimana|solusi|tips/i.test(text)) {
            adviceAllowed = true;
            unsolicitedOfferAllowed = false;
            maxDepth = 'PRACTICAL_FEW';
            reason = 'EXPLICIT_ADVICE_REQUESTED';
        }

        return {
            adviceAllowed,
            unsolicitedOfferAllowed,
            maxDepth,
            reason,
            directiveText: this.buildDirective(adviceAllowed, unsolicitedOfferAllowed, maxDepth)
        };
    }

    /**
     * Builds concise directive for the simulation kernel
     */
    static buildDirective(adviceAllowed, unsolicitedOfferAllowed, maxDepth) {
        if (!adviceAllowed) {
            return 'DILARANG MEMBERI NASIHAT/WEJANGAN/TIPS! Validasi perasaan atau jawab to-the-point saja!';
        }
        if (maxDepth === 'PRACTICAL_FEW') {
            return 'Beri maksimal 1-2 opsi praktis, jangan bikin daftar panjang!';
        }
        return 'Jawab wajar dan santai.';
    }
}
