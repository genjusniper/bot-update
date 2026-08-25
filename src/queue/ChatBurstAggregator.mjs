// src/queue/ChatBurstAggregator.mjs — UNIFIED PAYLOAD SCHEMA V1 COMPLIANT
// Aggregates rapid chat bursts and multiple photos/media within a debounce window

export class ChatBurstAggregator {
    constructor(debounceMs = 2500, onFlushCallback) {
        this.debounceMs = debounceMs;
        this.onFlush = onFlushCallback;
        this.buffers = new Map();
        this.MAX_BURST_ITEMS = 6; // Auto-flush immediately if burst > 6 items
    }

    push(chatId, { eventId, text, rawKey, rawMessage, fromMe, pushName, imageBase64, audioBase64, mimeType, quotedContext, ownerJid }) {
        let entry = this.buffers.get(chatId);

        if (!entry) {
            entry = {
                chatId,
                lastEventId: eventId || `evt_${Date.now()}`,
                texts: [],
                images: [],
                audio: null,
                quotedContext: null,
                rawKey,
                rawMessage,
                fromMe: fromMe || false,
                pushName: pushName || '',
                ownerJid: ownerJid || null,
                firstTimestamp: Date.now(),
                itemCount: 0
            };
            this.buffers.set(chatId, entry);
        }

        // Always update to latest message details in burst
        if (eventId) entry.lastEventId = eventId;
        entry.rawKey = rawKey;
        entry.rawMessage = rawMessage;

        if (pushName) entry.pushName = pushName;
        if (typeof fromMe === 'boolean') entry.fromMe = fromMe;
        if (ownerJid) entry.ownerJid = ownerJid;

        // Add text if present
        if (text && text.trim().length > 0) {
            entry.texts.push(text.trim());
            entry.itemCount++;
        }

        // Accumulate ALL images from all burst messages
        if (imageBase64) {
            entry.images.push({ base64: imageBase64, mimeType: mimeType || 'image/jpeg' });
            entry.itemCount++;
        }

        // Add audio (last audio wins)
        if (audioBase64) {
            entry.audio = { base64: audioBase64, mimeType: mimeType || 'audio/ogg; codecs=opus' };
            entry.itemCount++;
        }

        // Save quoted context if present
        if (quotedContext) {
            entry.quotedContext = quotedContext;
        }

        // Auto-flush immediately if burst exceeds max items
        if (entry.itemCount >= this.MAX_BURST_ITEMS) {
            if (entry.timer) clearTimeout(entry.timer);
            this.flush(chatId);
            return;
        }

        // Reset debounce timer
        if (entry.timer) clearTimeout(entry.timer);
        entry.timer = setTimeout(() => this.flush(chatId), this.debounceMs);
    }

    flush(chatId) {
        const entry = this.buffers.get(chatId);
        if (!entry) return;

        const aggregatedText = entry.texts.join(' ').trim();
        const burstCount = entry.texts.length + entry.images.length + (entry.audio ? 1 : 0);
        const burstDurationMs = Date.now() - entry.firstTimestamp;

        // Discard empty bursts (stickers, reactions, protocol packets with no content)
        if (!aggregatedText && entry.images.length === 0 && !entry.audio) {
            console.log(`[BurstAggregator] 🛑 Dropped empty/zero-item burst for ${chatId}`);
            return;
        }

        // Standard Unified Payload Schema V1
        const unifiedJob = {
            version: 1,
            message: {
                id: entry.lastEventId,
                chatId: entry.chatId,
                senderId: entry.rawKey?.participant || entry.chatId,
                timestamp: entry.firstTimestamp,
                text: aggregatedText,
                rawKey: entry.rawKey,
                rawMessage: entry.rawMessage,
                quotedContext: entry.quotedContext
            },
            media: {
                images: entry.images,
                audio: entry.audio
            },
            context: {
                fromMe: entry.fromMe,
                pushName: entry.pushName,
                isGroup: entry.chatId.endsWith('@g.us'),
                ownerJid: entry.ownerJid
            },
            // Flat backward-compatibility properties
            chatId: entry.chatId,
            text: aggregatedText,
            images: entry.images,
            audio: entry.audio,
            quotedContext: entry.quotedContext,
            rawKey: entry.rawKey,
            rawMessage: entry.rawMessage,
            fromMe: entry.fromMe,
            pushName: entry.pushName,
            burstCount,
            burstDurationMs
        };

        if (this.onFlush) {
            this.onFlush(unifiedJob);
        }
    }

    flushAll() {
        for (const chatId of this.buffers.keys()) {
            this.flush(chatId);
        }
    }
}
