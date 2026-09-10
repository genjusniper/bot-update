// src/core/multimodal/UniversalMultimodalFabric.mjs
// Master Multimodal Pipeline: DETECTED -> EXTRACTED -> UNDERSTOOD -> CONNECTED TO CONTEXT -> ACTIONABLE

import { UniversalContentObject } from './UniversalContentObject.mjs';
import { AudioIntelligenceProcessor } from './processors/AudioIntelligenceProcessor.mjs';
import { VisionIntelligenceProcessor } from './processors/VisionIntelligenceProcessor.mjs';
import { DocumentIntelligenceProcessor } from './processors/DocumentIntelligenceProcessor.mjs';
import { LocationIntelligenceProcessor } from './processors/LocationIntelligenceProcessor.mjs';
import { ContactCardProcessor } from './processors/ContactCardProcessor.mjs';
import { LinkIntelligenceProcessor } from './processors/LinkIntelligenceProcessor.mjs';
import { UniversalCognitiveGraph } from '../fabric/UniversalCognitiveGraph.mjs';

export class UniversalMultimodalFabric {
    /**
     * Processes any raw multimodal input into a rich UniversalContentObject & links to Cognitive Graph
     * @param {Object} input - Raw media / message payload
     * @param {Object} [context={}] - Conversation and sender context
     * @returns {Object} UniversalContentObject
     */
    static process(input = {}, context = {}) {
        const modality = String(input.type || input.modality || 'TEXT').toUpperCase();
        let procResult = {};
        const rawRef = {
            messageId: input.messageId || input.id,
            chatId: context.chatId || input.chatId,
            senderId: context.senderId || input.senderId,
            timestamp: input.timestamp || Date.now()
        };

        // Modality Dispatcher
        if (modality === 'AUDIO' || modality === 'VOICE_NOTE' || input.hasAudio) {
            procResult = AudioIntelligenceProcessor.process({
                audioData: input.audioData || input.audioBase64,
                simulatedTranscript: input.simulatedTranscript || input.caption || input.text,
                metadata: input.metadata || { mimeType: input.mimeType, isPtt: input.isPtt },
                context
            });
        } else if (modality === 'IMAGE' || modality === 'STICKER' || input.hasImage) {
            procResult = VisionIntelligenceProcessor.process({
                caption: input.caption || input.text,
                simulatedOcrText: input.simulatedOcrText || '',
                metadata: input.metadata || { isSticker: modality === 'STICKER' },
                context
            });
        } else if (modality === 'DOCUMENT' || input.hasDoc) {
            procResult = DocumentIntelligenceProcessor.process({
                fileName: input.fileName || input.metadata?.fileName,
                fileContent: input.fileContent || input.text,
                metadata: input.metadata || {}
            });
        } else if (modality === 'LOCATION' || (input.latitude && input.longitude)) {
            procResult = LocationIntelligenceProcessor.process({
                latitude: input.latitude,
                longitude: input.longitude,
                name: input.placeName || input.name,
                address: input.address
            });
        } else if (modality === 'CONTACT' || input.hasContact) {
            procResult = ContactCardProcessor.process({
                displayName: input.contactName || input.displayName,
                vcard: input.vcard,
                phoneNumber: input.phoneNumber
            });
        } else if (modality === 'LINK' || (input.text && /(https?:\/\/[^\s]+)/i.test(input.text))) {
            const foundUrl = input.url || (input.text.match(/(https?:\/\/[^\s]+)/i) || [])[0];
            procResult = LinkIntelligenceProcessor.process({
                url: foundUrl,
                surroundingText: input.text
            });
        } else {
            // Standard Text
            procResult = {
                modality: 'TEXT',
                extractedText: input.text || '',
                intent: 'GENERAL_CHAT',
                isUnderstood: true
            };
        }

        // Build standardized UniversalContentObject
        const contentObject = UniversalContentObject.create({
            source: 'WHATSAPP',
            type: procResult.modality || modality,
            rawReference: rawRef,
            extractedText: procResult.extractedText || input.text || '',
            visualEntities: procResult.visualEntities || [],
            audioTranscript: procResult.audioTranscript || null,
            metadata: { ...input.metadata, ...(procResult.metadata || {}) },
            claims: procResult.claims || [],
            conversationContext: {
                threadId: context.threadId || `thr_${rawRef.chatId}`,
                topic: context.topic || 'GENERAL'
            },
            temporalContext: { observedAt: rawRef.timestamp },
            intent: procResult.intent || 'GENERAL_CHAT',
            relevanceScore: 0.9,
            confidence: 0.90,
            memoryCandidates: procResult.voiceCommitments || [],
            actionCandidates: procResult.actionCandidates || []
        });

        // CONNECT TO CONTEXT: Link into UniversalCognitiveGraph
        try {
            UniversalCognitiveGraph.addNode({
                id: contentObject.contentId,
                type: 'MEDIA',
                label: `[${contentObject.type}] ${contentObject.extractedText.slice(0, 30)}`,
                properties: {
                    modality: contentObject.type,
                    intent: contentObject.intent,
                    hasVisuals: contentObject.visualEntities.length > 0,
                    hasAudio: contentObject.audioTranscript !== null
                }
            });

            if (rawRef.senderId) {
                UniversalCognitiveGraph.addEdge({
                    from: contentObject.contentId,
                    to: rawRef.senderId,
                    relation: 'SENT_BY'
                });
            }

            if (context.topic && context.topic !== 'GENERAL') {
                UniversalCognitiveGraph.addNode({ id: `topic_${context.topic.toLowerCase()}`, type: 'TOPIC', label: context.topic });
                UniversalCognitiveGraph.addEdge({
                    from: contentObject.contentId,
                    to: `topic_${context.topic.toLowerCase()}`,
                    relation: 'DISCUSSES_TOPIC'
                });
            }
        } catch (graphErr) {
            // Non-blocking graph link
        }

        return contentObject;
    }
}
