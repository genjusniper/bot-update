// src/core/whatsapp/UniversalMessageIntelligence.mjs
// Multimodal Message Parser, Content Classifier, and Structured Intelligence Binder

export class UniversalMessageIntelligence {
    static CONTENT_TYPES = Object.freeze({
        TEXT: 'TEXT',
        IMAGE: 'IMAGE',
        VIDEO: 'VIDEO',
        AUDIO: 'AUDIO',
        VOICE_NOTE: 'VOICE_NOTE',
        DOCUMENT: 'DOCUMENT',
        STICKER: 'STICKER',
        GIF: 'GIF',
        LOCATION: 'LOCATION',
        CONTACT_CARD: 'CONTACT_CARD',
        LINK: 'LINK',
        REACTION: 'REACTION',
        QUOTE: 'QUOTE',
        MENTION: 'MENTION',
        BUTTON_INTERACTION: 'BUTTON_INTERACTION'
    });

    /**
     * Parses and binds a message into rich, standardized message intelligence
     * @param {Object} canonicalEvent - CanonicalWhatsAppEvent
     * @param {Object} [options={}] - Supplemental enrichment options
     * @returns {Object} UnifiedMessageIntelligence
     */
    static analyze(canonicalEvent, options = {}) {
        const { payload, chatId, senderId, timestamp, isGroup } = canonicalEvent;
        const text = payload.text || '';
        const lower = text.toLowerCase();

        // 1. Classify Content Type
        let type = this.CONTENT_TYPES.TEXT;
        const mediaMetadata = {
            hasMedia: false,
            mimeType: options.mimeType || null,
            caption: null,
            fileName: options.fileName || null
        };

        if (payload.reactionEmoji) {
            type = this.CONTENT_TYPES.REACTION;
        } else if (payload.type?.includes('image') || options.hasImage) {
            type = this.CONTENT_TYPES.IMAGE;
            mediaMetadata.hasMedia = true;
            mediaMetadata.caption = text;
        } else if (payload.type?.includes('video') || options.hasVideo) {
            type = this.CONTENT_TYPES.VIDEO;
            mediaMetadata.hasMedia = true;
        } else if (payload.type?.includes('audio') || options.hasAudio) {
            type = (options.isPtt || payload.type === 'ptt') ? this.CONTENT_TYPES.VOICE_NOTE : this.CONTENT_TYPES.AUDIO;
            mediaMetadata.hasMedia = true;
        } else if (payload.type?.includes('document') || options.hasDoc) {
            type = this.CONTENT_TYPES.DOCUMENT;
            mediaMetadata.hasMedia = true;
        } else if (payload.type?.includes('sticker') || options.hasSticker) {
            type = this.CONTENT_TYPES.STICKER;
            mediaMetadata.hasMedia = true;
        } else if (payload.type?.includes('location') || options.hasLocation) {
            type = this.CONTENT_TYPES.LOCATION;
        } else if (payload.type?.includes('contact') || options.hasContact) {
            type = this.CONTENT_TYPES.CONTACT_CARD;
        } else if (/(https?:\/\/[^\s]+)/i.test(text)) {
            type = this.CONTENT_TYPES.LINK;
        } else if (payload.isQuoted) {
            type = this.CONTENT_TYPES.QUOTE;
        } else if (payload.mentionedJids?.length > 0) {
            type = this.CONTENT_TYPES.MENTION;
        }

        // 2. Extract Intent & Emotion Heuristics
        let intent = 'GENERAL_CHAT';
        if (/\b(tanya|gimana|apa|kenapa|siapa|kapan|dimana|berapa)\b/i.test(lower) || text.includes('?')) {
            intent = 'QUERY';
        } else if (/\b(tolong|bantu|minta|kirim|buatkan|kerjakan)\b/i.test(lower)) {
            intent = 'REQUEST';
        } else if (/\b(curhat|capek|lelah|sedih|pusing|kesel|bingung)\b/i.test(lower)) {
            intent = 'CURHAT';
        } else if (/\b(halo|hai|pagi|siang|sore|malam|assalamu|oy)\b/i.test(lower)) {
            intent = 'GREETING';
        }

        let emotionSignal = 'NEUTRAL';
        if (/\b(wkwk|haha|hehe|lol|lucu|ngakak)\b/i.test(lower)) {
            emotionSignal = 'AMUSED';
        } else if (/\b(kesel|marah|anjing|bangsat|tai|brengsek)\b/i.test(lower)) {
            emotionSignal = 'FRUSTRATED';
        } else if (/\b(alhamdulillah|makasih|thanks|mantap|keren|top)\b/i.test(lower)) {
            emotionSignal = 'GRATEFUL';
        }

        // 3. Memory & Evidence Candidates
        const memoryCandidates = [];
        const evidenceCandidates = [];
        if (/\b(ingat|jangan lupa|catat|ingetin|janji)\b/i.test(lower)) {
            memoryCandidates.push({ type: 'COMMITMENT', content: text });
        }
        if (/\b(bukti|fakta|katanya|menurut|hasil|data)\b/i.test(lower)) {
            evidenceCandidates.push({ type: 'EVIDENTIARY_CLAIM', claim: text });
        }

        const threadId = options.threadId || `thr_${chatId}_${Math.floor(timestamp / (1000 * 60 * 60))}`; // hourly thread window
        const conversationId = `conv_${chatId}`;

        return {
            messageId: payload.messageId,
            chatId,
            senderId,
            timestamp,
            isGroup,
            type,
            content: text,
            quotedMessage: payload.isQuoted ? { id: payload.targetStanzaId, text: payload.quotedText } : null,
            mentionedUsers: payload.mentionedJids || [],
            mediaMetadata,
            conversationId,
            threadId,
            identityContext: {
                senderId,
                senderName: options.senderName || '',
                isKnown: Boolean(options.isKnown)
            },
            relationshipContext: {
                tier: options.tier || 'STANDARD',
                affinityScore: options.affinityScore || 0.5
            },
            intent,
            emotionSignal,
            topic: options.topic || 'GENERAL',
            memoryCandidates,
            evidenceCandidates
        };
    }
}
