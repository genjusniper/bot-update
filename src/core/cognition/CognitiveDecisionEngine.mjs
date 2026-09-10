// src/core/cognition/CognitiveDecisionEngine.mjs
// Central cognitive reasoning coordinator integrating DecisionPrinciples, AntiOverhelp, and ClarificationPolicy

import { DecisionPrinciples } from './DecisionPrinciples.mjs';
import { AntiOverhelpEngine } from './AntiOverhelpEngine.mjs';
import { ClarificationPolicy } from './ClarificationPolicy.mjs';
import { MetaCognitionEngine } from './MetaCognitionEngine.mjs';

export class CognitiveDecisionEngine {
    /**
     * Synthesizes cognitive decisions based on fused sensory signals and user input
     * @param {Object} params
     * @param {Object} params.fusedSnapshot - From SignalFusion
     * @param {string} [params.text=''] - Current user message
     * @param {Object} [params.metadata={}] - Optional metadata
     * @returns {Object} CognitiveDecision
     */
    static decide({ fusedSnapshot = {}, text = '', metadata = {} }) {
        const dims = fusedSnapshot.dimensions || {};
        
        // 1. Priority Resolution
        const priorityScore = DecisionPrinciples.resolvePriority(dims.relationshipTier);

        // 2. Overhelp & Advice Guard
        const overhelp = AntiOverhelpEngine.evaluate({ fusedSnapshot, text });

        // 3. Ambiguity & Clarification Decision
        const ambiguityScore = Number(dims.confusion) || (dims.clarityPriority ? 0.8 : 0.2);
        const isDestructive = /hapus|delete|restart|shutdown|reset|wipe/i.test(text);
        const clarification = ClarificationPolicy.evaluate({
            ambiguityScore,
            isDestructive,
            detectedIntent: dims.intent
        });

        // 3.5. Meta-Cognition & Capability Gap Assessment
        const metaCognition = MetaCognitionEngine.assess({ text, context: metadata });

        // 4. Determine Primary Cognitive Mode
        let cognitiveMode = 'BALANCED_ENGAGEMENT';
        if (metaCognition.hasGap) {
            cognitiveMode = 'EPISTEMIC_HUMILITY';
        } else if (clarification.mustClarify) {
            cognitiveMode = 'CLARIFY_AMBIGUITY';
        } else if (!overhelp.adviceAllowed) {
            cognitiveMode = 'ACTIVE_LISTENING';
        } else if (dims.urgency >= 0.65) {
            cognitiveMode = 'PRAGMATIC_RAPID';
        }

        let summaryDirective = `[COGNITIVE DIRECTIVE] Mode: ${cognitiveMode} | Advice: ${overhelp.adviceAllowed ? 'YES' : 'STRICTLY_BLOCKED'} | Clarify: ${clarification.mustClarify ? 'YES (1 Q)' : 'NO'}`;
        if (metaCognition.hasGap) {
            summaryDirective += ` | ${metaCognition.humilityDirective}`;
        }

        return {
            decisionId: `cog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
            cognitiveMode,
            priorityScore,
            overhelp,
            clarification,
            metaCognition,
            summaryDirective
        };
    }
}
