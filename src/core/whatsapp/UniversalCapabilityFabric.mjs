// src/core/whatsapp/UniversalCapabilityFabric.mjs
// Master Phase 27 Fabric: Bridges WhatsApp events, Message Intelligence, Conversation Universe, Group Brain, and Action Transactions into Cognitive Fabric v1

import { UniversalEventNormalizer } from './UniversalEventNormalizer.mjs';
import { UniversalMessageIntelligence } from './UniversalMessageIntelligence.mjs';
import { ConversationUniverse } from './ConversationUniverse.mjs';
import { GroupBrain } from './GroupBrain.mjs';
import { ActionTransactionSystem } from './ActionTransactionSystem.mjs';
import { UniversalContextBus } from '../fabric/UniversalContextBus.mjs';
import { UniversalCognitiveGraph } from '../fabric/UniversalCognitiveGraph.mjs';
import { UniversalMultimodalFabric } from '../multimodal/UniversalMultimodalFabric.mjs';

export class UniversalCapabilityFabric {
    /**
     * Ingests a raw WhatsApp event and synthesizes a full Phase 27 Capability Bundle
     * @param {Object} rawEvent - Raw Baileys message or event
     * @param {Object} [supplemental={}] - Supplemental event metadata
     * @returns {Object} Phase 27 Enriched Context Bundle
     */
    static processEvent(rawEvent, supplemental = {}) {
        // 1. Normalize Event
        const canonicalEvent = UniversalEventNormalizer.normalize(rawEvent, supplemental);

        // 2. Parse Message Intelligence & Multimodal Fabric
        const messageIntelligence = UniversalMessageIntelligence.analyze(canonicalEvent, supplemental);
        const multimodalContent = UniversalMultimodalFabric.process({
            ...messageIntelligence,
            ...supplemental,
            text: messageIntelligence.content
        }, {
            chatId: canonicalEvent.chatId,
            senderId: canonicalEvent.senderId,
            threadId: messageIntelligence.threadId,
            topic: messageIntelligence.topic
        });

        // 3. Update Conversation Universe
        const conversationState = ConversationUniverse.recordTurn(messageIntelligence);
        const anaphora = ConversationUniverse.resolveAnaphora(messageIntelligence.content, canonicalEvent.chatId);

        // 4. Update Group Brain if group
        let groupState = null;
        if (canonicalEvent.isGroup) {
            groupState = GroupBrain.updateGroup({
                groupId: canonicalEvent.chatId,
                senderId: canonicalEvent.senderId,
                senderName: supplemental.senderName || '',
                text: messageIntelligence.content,
                isAdmin: Boolean(supplemental.isAdmin)
            });
        }

        // 5. Connect into Universal Cognitive Graph
        UniversalCognitiveGraph.addNode({
            id: `msg_${messageIntelligence.messageId}`,
            type: 'MESSAGE',
            label: messageIntelligence.content.slice(0, 30),
            properties: {
                type: messageIntelligence.type,
                intent: messageIntelligence.intent,
                emotion: messageIntelligence.emotionSignal,
                multimodalId: multimodalContent.contentId
            }
        });
        UniversalCognitiveGraph.addEdge({
            from: `msg_${messageIntelligence.messageId}`,
            to: canonicalEvent.senderId,
            relation: 'SENT_BY'
        });

        // 6. Assemble Standardized ContextPacket through UniversalContextBus
        const contextPacket = UniversalContextBus.assemble({
            text: messageIntelligence.content,
            senderId: canonicalEvent.senderId,
            senderName: supplemental.senderName || '',
            chatId: canonicalEvent.chatId,
            isGroup: canonicalEvent.isGroup
        });

        return {
            fabricId: `fab_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            canonicalEvent,
            messageIntelligence,
            multimodalContent,
            conversationState,
            anaphora,
            groupState,
            contextPacket
        };
    }
}
