// src/core/multimodal/UniversalContentObject.mjs
// Standardized cross-modality content object specification

export class UniversalContentObject {
    static MODALITIES = Object.freeze({
        TEXT: 'TEXT',
        IMAGE: 'IMAGE',
        VIDEO: 'VIDEO',
        AUDIO: 'AUDIO',
        VOICE_NOTE: 'VOICE_NOTE',
        DOCUMENT: 'DOCUMENT',
        LOCATION: 'LOCATION',
        CONTACT: 'CONTACT',
        LINK: 'LINK',
        STICKER: 'STICKER'
    });

    /**
     * Creates a standardized UniversalContentObject
     * @param {Object} params
     * @returns {Object} UniversalContentObject
     */
    static create({
        source = 'WHATSAPP',
        type = 'TEXT',
        rawReference = {},
        extractedText = '',
        visualEntities = [],
        audioTranscript = null,
        metadata = {},
        entities = [],
        claims = [],
        evidence = [],
        conversationContext = {},
        temporalContext = {},
        intent = 'GENERAL_CHAT',
        relevanceScore = 0.8,
        confidence = 0.85,
        memoryCandidates = [],
        actionCandidates = []
    }) {
        const contentId = `cnt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        return {
            contentId,
            source,
            type: String(type).toUpperCase(),
            rawReference: {
                messageId: rawReference.messageId || null,
                chatId: rawReference.chatId || null,
                senderId: rawReference.senderId || null,
                timestamp: rawReference.timestamp || Date.now()
            },
            extractedText: extractedText || '',
            visualEntities: Array.isArray(visualEntities) ? visualEntities : [],
            audioTranscript: audioTranscript || null,
            metadata: {
                mimeType: metadata.mimeType || 'text/plain',
                fileSize: metadata.fileSize || 0,
                fileName: metadata.fileName || null,
                ...metadata
            },
            entities: Array.isArray(entities) ? entities : [],
            claims: Array.isArray(claims) ? claims : [],
            evidence: Array.isArray(evidence) ? evidence : [],
            conversationContext: {
                threadId: conversationContext.threadId || null,
                topic: conversationContext.topic || 'GENERAL'
            },
            temporalContext: {
                observedAt: temporalContext.observedAt || Date.now(),
                validFrom: temporalContext.validFrom || Date.now(),
                validUntil: temporalContext.validUntil || null
            },
            intent,
            relevanceScore: Number(relevanceScore.toFixed(2)),
            confidence: Number(confidence.toFixed(2)),
            memoryCandidates: Array.isArray(memoryCandidates) ? memoryCandidates : [],
            actionCandidates: Array.isArray(actionCandidates) ? actionCandidates : []
        };
    }
}
