// src/core/whatsapp/UniversalEventNormalizer.mjs
// Normalizes all WhatsApp & Baileys events into a unified CanonicalWhatsAppEvent contract

export class UniversalEventNormalizer {
    static EVENT_TYPES = Object.freeze({
        MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
        MESSAGE_EDITED: 'MESSAGE_EDITED',
        MESSAGE_REVOKED: 'MESSAGE_REVOKED',
        REACTION: 'REACTION',
        REPLY: 'REPLY',
        MENTION: 'MENTION',
        GROUP_UPDATE: 'GROUP_UPDATE',
        PARTICIPANT_UPDATE: 'PARTICIPANT_UPDATE',
        CONTACT_UPDATE: 'CONTACT_UPDATE',
        PRESENCE_UPDATE: 'PRESENCE_UPDATE',
        MEDIA_RECEIVED: 'MEDIA_RECEIVED',
        CALL_EVENT: 'CALL_EVENT',
        CONNECTION_EVENT: 'CONNECTION_EVENT',
        DELIVERY_EVENT: 'DELIVERY_EVENT'
    });

    /**
     * Normalizes any raw Baileys or WhatsApp event into CanonicalWhatsAppEvent
     * @param {Object} rawEvent - Raw event payload
     * @param {Object} [context={}] - Supplemental context
     * @returns {Object} CanonicalWhatsAppEvent
     */
    static normalize(rawEvent = {}, context = {}) {
        const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const timestamp = rawEvent.messageTimestamp 
            ? (rawEvent.messageTimestamp > 1e11 ? Number(rawEvent.messageTimestamp) : Number(rawEvent.messageTimestamp) * 1000) 
            : Date.now();

        // Detect explicit eventType override or infer from event structure
        let eventType = context.eventType || this.EVENT_TYPES.MESSAGE_RECEIVED;

        const key = rawEvent.key || {};
        const chatId = key.remoteJid || context.chatId || '';
        const senderId = key.participant || key.remoteJid || context.senderId || '';
        const isGroup = chatId.endsWith('@g.us');
        const isFromMe = Boolean(key.fromMe);

        const msg = rawEvent.message || {};
        const actualMsg = msg.ephemeralMessage?.message || msg.viewOnceMessage?.message || msg;

        // Detection heuristics
        if (rawEvent.protocolMessage?.type === 0 || actualMsg.protocolMessage?.type === 0) {
            eventType = this.EVENT_TYPES.MESSAGE_REVOKED;
        } else if (actualMsg.editedMessage || actualMsg.protocolMessage?.type === 14) {
            eventType = this.EVENT_TYPES.MESSAGE_EDITED;
        } else if (actualMsg.reactionMessage) {
            eventType = this.EVENT_TYPES.REACTION;
        } else if (context.eventType && this.EVENT_TYPES[context.eventType]) {
            eventType = context.eventType;
        } else if (actualMsg.imageMessage || actualMsg.videoMessage || actualMsg.audioMessage || actualMsg.documentMessage || actualMsg.stickerMessage) {
            eventType = this.EVENT_TYPES.MEDIA_RECEIVED;
        }

        const payload = {
            messageId: key.id || `msg_${Date.now()}`,
            text: actualMsg.conversation || actualMsg.extendedTextMessage?.text || actualMsg.imageMessage?.caption || actualMsg.videoMessage?.caption || context.text || '',
            type: Object.keys(actualMsg)[0] || 'unknown',
            reactionEmoji: actualMsg.reactionMessage?.text || null,
            targetStanzaId: actualMsg.reactionMessage?.key?.id || actualMsg.extendedTextMessage?.contextInfo?.stanzaId || null,
            mentionedJids: actualMsg.extendedTextMessage?.contextInfo?.mentionedJid || [],
            isQuoted: Boolean(actualMsg.extendedTextMessage?.contextInfo?.quotedMessage),
            quotedText: actualMsg.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || actualMsg.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || null
        };

        if (payload.isQuoted && eventType === this.EVENT_TYPES.MESSAGE_RECEIVED) {
            eventType = this.EVENT_TYPES.REPLY;
        } else if (payload.mentionedJids.length > 0 && eventType === this.EVENT_TYPES.MESSAGE_RECEIVED) {
            eventType = this.EVENT_TYPES.MENTION;
        }

        return {
            eventId,
            eventType,
            timestamp,
            chatId,
            senderId,
            isGroup,
            isFromMe,
            payload,
            rawEvent
        };
    }
}
