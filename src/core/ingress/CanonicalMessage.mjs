// src/core/ingress/CanonicalMessage.mjs
// Standardized, immutable representation of all incoming WhatsApp events

export class CanonicalMessage {
    constructor({
        id,
        chatId,
        senderId,
        pushName = '',
        timestamp = Date.now(),
        text = '',
        media = {},
        quoted = null,
        isGroup = false,
        groupSubject = '',
        fromMe = false,
        isOwner = false,
        rawKey = null,
        rawMessage = null
    }) {
        this.id = String(id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
        this.chatId = String(chatId || '');
        this.senderId = String(senderId || chatId || '');
        this.pushName = String(pushName || '').trim();
        this.timestamp = Number(timestamp) || Date.now();
        this.text = String(text || '').trim();
        
        this.media = {
            hasImage: Boolean(media.hasImage || (Array.isArray(media.images) && media.images.length > 0) || media.imageBase64),
            images: Array.isArray(media.images) 
                ? media.images 
                : (media.imageBase64 ? [media.imageBase64] : []),
            hasAudio: Boolean(media.hasAudio || media.audio || media.audioBase64),
            audio: media.audio || media.audioBase64 || null,
            mimeType: media.mimeType || 'text/plain'
        };

        this.quoted = quoted ? {
            text: String(quoted.text || '').trim(),
            sender: String(quoted.sender || '')
        } : null;

        this.isGroup = Boolean(isGroup || this.chatId.endsWith('@g.us'));
        this.groupSubject = String(groupSubject || '');
        this.fromMe = Boolean(fromMe);
        this.isOwner = Boolean(isOwner);

        this.rawKey = rawKey;
        this.rawMessage = rawMessage;
    }

    static fromBaileys(data, ownerIdentifiers = {}) {
        const { unifiedMsg, rawKey, rawMessage, imageBase64, audioBase64, mimeType, quotedContext, groupSubject } = data;

        const id = rawKey?.id || unifiedMsg?.id || `evt_${Date.now()}`;
        const chatId = unifiedMsg?.chatId || rawKey?.remoteJid || '';
        const isGroup = chatId.endsWith('@g.us');
        const fromMe = Boolean(rawKey?.fromMe);

        const senderId = isGroup 
            ? (rawKey?.participant || data.senderId || chatId)
            : chatId;

        const pushName = rawMessage?.pushName || unifiedMsg?.pushName || data.pushName || '';

        const text = (
            unifiedMsg?.text ||
            rawMessage?.conversation ||
            rawMessage?.extendedTextMessage?.text ||
            rawMessage?.imageMessage?.caption ||
            rawMessage?.videoMessage?.caption ||
            rawMessage?.documentMessage?.caption ||
            data.text ||
            ''
        ).trim();

        const ownerLid = ownerIdentifiers.ownerLid || '236322690191595@lid';
        const ownerPhone = ownerIdentifiers.ownerPhone || '';
        
        const isOwner = Boolean(
            chatId === ownerLid ||
            senderId === ownerLid ||
            (ownerPhone && (chatId.replace(/\D/g, '').includes(ownerPhone) || senderId.replace(/\D/g, '').includes(ownerPhone))) ||
            chatId.includes('236322690191595') ||
            senderId.includes('236322690191595')
        );

        let quoted = quotedContext || null;
        if (!quoted && rawMessage) {
            const ctx = rawMessage.extendedTextMessage?.contextInfo ||
                        rawMessage.imageMessage?.contextInfo ||
                        rawMessage.videoMessage?.contextInfo;
            if (ctx?.quotedMessage) {
                const q = ctx.quotedMessage;
                const qText = q.conversation ||
                              q.extendedTextMessage?.text ||
                              q.imageMessage?.caption ||
                              q.videoMessage?.caption ||
                              '';
                quoted = {
                    text: qText.trim(),
                    sender: ctx.participant || ctx.remoteJid || ''
                };
            }
        }

        const images = [];
        if (imageBase64) images.push(imageBase64);
        if (Array.isArray(data.images)) images.push(...data.images);

        const audio = audioBase64 || data.audio || null;

        return new CanonicalMessage({
            id,
            chatId,
            senderId,
            pushName,
            timestamp: Date.now(),
            text,
            media: {
                hasImage: images.length > 0,
                images,
                hasAudio: Boolean(audio),
                audio,
                mimeType: mimeType || 'text/plain'
            },
            quoted,
            isGroup,
            groupSubject: groupSubject || '',
            fromMe,
            isOwner,
            rawKey,
            rawMessage
        });
    }

    toJSON() {
        return {
            id: this.id,
            chatId: this.chatId,
            senderId: this.senderId,
            pushName: this.pushName,
            timestamp: this.timestamp,
            text: this.text,
            media: {
                hasImage: this.media.hasImage,
                images: this.media.images,
                hasAudio: this.media.hasAudio,
                audio: this.media.audio,
                mimeType: this.media.mimeType
            },
            quoted: this.quoted,
            isGroup: this.isGroup,
            groupSubject: this.groupSubject,
            fromMe: this.fromMe,
            isOwner: this.isOwner
        };
    }
}
