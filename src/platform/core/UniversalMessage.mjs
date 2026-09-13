// src/platform/core/UniversalMessage.mjs
// ============================================================================
// SALIM AI OPERATING SYSTEM - UNIVERSAL MESSAGE CONTRACT
// Channel-agnostic canonical message abstraction (WhatsApp, Telegram, Web, API)
// ============================================================================

export class UniversalMessage {
    constructor({
        tenantId = 'default',
        channel = 'whatsapp',
        conversationId = '',
        userId = '',
        userName = '',
        text = '',
        attachments = [],
        metadata = {},
        timestamp = new Date().toISOString()
    } = {}) {
        this.tenantId = tenantId;
        this.channel = channel.toLowerCase();
        this.conversationId = conversationId;
        this.userId = userId;
        this.userName = userName;
        this.text = text;
        this.attachments = attachments;
        this.metadata = metadata;
        this.timestamp = timestamp;
    }

    /**
     * Creates a UniversalMessage from WhatsApp payload
     */
    static fromWhatsApp({ tenantId = 'default', chatId, pushName, text, images = [], audio = null, rawKey = null }) {
        const attachments = [];
        if (images && images.length > 0) {
            images.forEach((img, i) => attachments.push({ type: 'image', index: i, data: img }));
        }
        if (audio) {
            attachments.push({ type: 'audio', data: audio });
        }

        return new UniversalMessage({
            tenantId,
            channel: 'whatsapp',
            conversationId: chatId,
            userId: chatId,
            userName: pushName || 'WhatsApp User',
            text,
            attachments,
            metadata: { rawKey }
        });
    }

    /**
     * Creates a UniversalMessage from Telegram payload
     */
    static fromTelegram({ tenantId = 'default', chatId, fromUser, text }) {
        return new UniversalMessage({
            tenantId,
            channel: 'telegram',
            conversationId: String(chatId),
            userId: String(chatId),
            userName: fromUser || 'Telegram User',
            text,
            attachments: [],
            metadata: {}
        });
    }

    /**
     * Creates a UniversalMessage from REST API payload
     */
    static fromAPI({ tenantId, userId, text, metadata = {} }) {
        return new UniversalMessage({
            tenantId: tenantId || 'default',
            channel: 'api',
            conversationId: `api_${userId}`,
            userId,
            userName: metadata.userName || 'API Client',
            text,
            attachments: metadata.attachments || [],
            metadata
        });
    }
}
