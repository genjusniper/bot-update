// src/core/orchestrator/IntelligenceOrchestrator.mjs
// Master Intelligence Orchestrator unifying Identity, Group, Knowledge, Memory, and Behavioral Simulation

import { PersonalSimulationKernel } from '../kernel/PersonalSimulationKernel.mjs';
import { ConversationTextureEngine } from '../style/ConversationTextureEngine.mjs';
import { BehavioralFirewall } from '../firewall/BehavioralFirewall.mjs';
import { MetaCognitionLayer } from '../fabric/MetaCognitionLayer.mjs';

export class IntelligenceOrchestrator {
    /**
     * Master pipeline synthesizing all intelligent layers into an actionable response plan
     * @param {Object} params
     * @param {Object} params.fusedSnapshot - SignalFusion sensory snapshot
     * @param {string} params.text - Incoming user text
     * @param {string} params.senderJid - Sender identifier
     * @param {string} [params.senderName] - PushName
     * @param {string} params.chatId - Chat or Group JID
     * @param {boolean} [params.isGroup=false]
     * @param {boolean} [params.isMentioned=false]
     * @param {boolean} [params.isReplyToBot=false]
     * @returns {Object} Master Orchestrated Execution Plan
     */
    static orchestrate({
        fusedSnapshot = {},
        text = '',
        senderJid = '',
        senderName = '',
        chatId = '',
        isGroup = false,
        isMentioned = false,
        isReplyToBot = false
    }) {
        // 1. Synthesize PersonalContextContract across all layers
        const contract = PersonalSimulationKernel.synthesize(fusedSnapshot, {
            text,
            senderJid,
            senderName,
            chatId,
            isGroup,
            isMentioned,
            isReplyToBot
        });

        // 2. Generate Compact Prompt Directives (Zero-Bloat)
        const promptDirectives = PersonalSimulationKernel.formatContractForPrompt(contract);

        // 3. Execution Plan
        const plan = {
            orchestrationId: `orch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
            contract,
            fabric: contract.fabric || null,
            promptDirectives,
            execution: {
                shouldRespond: !contract.group?.isGroup || contract.group?.recommendation !== 'OBSERVE_PASSIVE',
                actionType: contract.what.actionType,
                interactionMode: contract.interaction.mode,
                messageShape: contract.interaction.messageBurst.shape,
                delayMs: contract.interaction.timing.delayMs,
                typingDurationMs: contract.interaction.timing.typingDurationMs
            },
            firewall: {
                maxWords: contract.how.maxWords,
                adviceAllowed: contract.cognitive.adviceAllowed,
                humorAllowed: contract.how.humorStyle !== 'OFF'
            }
        };

        return plan;
    }

    /**
     * Splits and textures raw LLM output according to the orchestrated burst plan
     * @param {string} rawResponse - Text output from Gemini/Groq
     * @param {Object} plan - Output from orchestrate()
     * @returns {{ bubbles: string[], firewallValidation: Object, metaEvaluation: Object }}
     */
    static formatResponse(rawResponse = '', plan = {}) {
        if (!rawResponse) return { bubbles: [], firewallValidation: { valid: true }, metaEvaluation: null };

        const { contract } = plan;
        const firewallRes = BehavioralFirewall.validate(rawResponse, contract || {}, {
            isGroup: Boolean(contract?.group?.isGroup)
        });

        const safeText = firewallRes.sanitizedText;
        const textureRes = ConversationTextureEngine.apply(safeText, {
            mode: contract?.interaction?.mode || 'Casual',
            messageShape: contract?.interaction?.messageBurst?.shape || 'SINGLE',
            maxBubbles: contract?.interaction?.messageBurst?.maxBubbles || 1
        });
        const bubbles = textureRes.bubbles;

        // Meta-cognition self-evaluation
        const metaEvaluation = MetaCognitionLayer.evaluate({
            contract: contract || {},
            grounding: contract?.fabric?.grounding || {},
            generatedText: safeText
        });

        return {
            bubbles,
            firewallValidation: firewallRes,
            metaEvaluation
        };
    }
}
