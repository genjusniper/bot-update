// src/core/fabric/UniversalContextBus.mjs
// Single unified context bus routing a standardized ContextPacket across the entire OS

import { WorldModel2 } from './WorldModel2.mjs';
import { CommitmentIntegrityEngine } from './CommitmentIntegrityEngine.mjs';
import { UniversalCognitiveGraph } from './UniversalCognitiveGraph.mjs';
import { RealityGroundingEngine } from './RealityGroundingEngine.mjs';
import { MetaCognitionLayer } from './MetaCognitionLayer.mjs';
import { ConversationUniverse } from '../whatsapp/ConversationUniverse.mjs';
import { GroupBrain } from '../whatsapp/GroupBrain.mjs';
import { UncertaintyEngine } from '../reasoning/UncertaintyEngine.mjs';
import { CausalReasoningEngine } from '../reasoning/CausalReasoningEngine.mjs';

export class UniversalContextBus {
    /**
     * Assembles a comprehensive, standardized ContextPacket
     * @param {Object} params
     * @param {string} params.text
     * @param {string} params.senderId
     * @param {string} [params.senderName]
     * @param {string} params.chatId
     * @param {boolean} [params.isGroup=false]
     * @param {Object} [params.fusedSnapshot={}]
     * @returns {Object} ContextPacket
     */
    static assemble({ text = '', senderId = '', senderName = '', chatId = '', isGroup = false, fusedSnapshot = {} }) {
        // 1. World Model Ingestion
        const worldSnapshot = WorldModel2.ingest({ text, senderId, chatId });

        // 2. Commitments & Open Loops
        const openLoops = CommitmentIntegrityEngine.getActiveLoops(chatId);
        const detectedCommitment = CommitmentIntegrityEngine.inspectCommitment({ text, senderId, chatId });

        // 3. Epistemic Reality Grounding
        const grounding = RealityGroundingEngine.evaluate({ text, source: isGroup ? 'GROUP_MEMBER' : 'USER' });

        // 4. Conversation Universe Anaphora & Reference Resolution
        const anaphora = ConversationUniverse.resolveAnaphora(text, chatId);

        // 5. Group State & Privacy Isolation
        const groupInfo = isGroup 
            ? GroupBrain.updateGroup({ groupId: chatId, senderId, senderName, text })
            : { privacyLevel: GroupBrain.PRIVACY_LEVELS.PRIVATE_CONTEXT, conversationTemperature: 0.5 };

        // 6. Epistemic Uncertainty & Causal Reasoning
        const uncertainty = UncertaintyEngine.evaluate({
            query: text,
            facts: worldSnapshot.entities?.persistentPeople || [],
            evidence: grounding.evidence || [],
            contradictions: grounding.epistemicClass === 'CONTRADICTION'
        });

        const isFailureQuery = /error|gagal|kenapa|rusak|mati|crash|bms|timeout|hang|canbus/i.test(text);
        const causalDiagnosis = isFailureQuery ? CausalReasoningEngine.diagnose(text) : null;

        // 7. Standardized ContextPacket
        const packet = {
            packetId: `pkt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
            identity: {
                senderId,
                senderName,
                isGroup,
                chatId
            },
            world: worldSnapshot,
            grounding,
            uncertainty,
            causalDiagnosis,
            commitments: {
                activeLoops: openLoops,
                newCommitment: detectedCommitment
            },
            conversation: {
                anaphora,
                threadId: `thr_${chatId}`
            },
            privacy: {
                level: groupInfo.privacyLevel,
                temperature: groupInfo.conversationTemperature || 0.5
            },
            uncertaintyScore: Number((1.0 - uncertainty.confidenceScore).toFixed(2)),
            recommendedTone: uncertainty.recommendedTone,
            availableTools: ['CALCULATOR', 'DATE_TIME', 'SYSTEM_INFO', 'WEB_SEARCH'],
            riskGates: {
                allowsDestructive: senderId === 'owner@s.whatsapp.net',
                requiresConfirmation: grounding.epistemicClass === 'PREDICTION' || uncertainty.requiresProbing
            }
        };

        return packet;
    }
}

