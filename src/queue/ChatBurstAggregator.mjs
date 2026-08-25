// src/queue/ChatBurstAggregator.mjs
// Aggregates rapid chat bursts and multiple photos/media within a 2.5s window

export class ChatBurstAggregator {
    constructor(debounceMs = 2500, onFlushCallback) {
        this.debounceMs = debounceMs;
        this.onFlush = onFlushCallback;
        this.buffers = new Map(); // chatId -> { timer, messages: [], images: [], audio: null, quotedContext: null, rawKey, rawMessage }
    }

    push(chatId, { text, rawKey, rawMessage, imageBase64, audioBase64, mimeType, quotedContext }) {
        let entry = this.buffers.get(chatId);

        if (!entry) {
            entry = {
                chatId,
                texts: [],
                images: [],
                audio: null,
                quotedContext: null,
                rawKey,
                rawMessage,
                firstTimestamp: Date.now()
            };
            this.buffers.set(chatId, entry);
        }

        // Add text if present
        if (text && text.trim().length > 0) {
            entry.texts.push(text.trim());
        }

        // Add image if present
        if (imageBase64) {
            entry.images.push({ base64: imageBase64, mimeType: mimeType || 'image/jpeg' });
        }

        // Add audio if present
        if (audioBase64) {
            entry.audio = { base64: audioBase64, mimeType: mimeType || 'audio/ogg' };
        }

        // Save quoted context if present
        if (quotedContext) {
            entry.quotedContext = quotedContext;
        }

        // Keep latest rawKey & rawMessage for quote sending
        entry.rawKey = rawKey;
        entry.rawMessage = rawMessage;

        // Reset debounce timer
        if (entry.timer) {
            clearTimeout(entry.timer);
        }

        entry.timer = setTimeout(() => {
            this.flush(chatId);
        }, this.debounceMs);
    }

    flush(chatId) {
        const entry = this.buffers.get(chatId);
        if (!entry) return;

        this.buffers.delete(chatId);

        const aggregatedText = entry.texts.join(' ');
        const aggregatedJob = {
            chatId: entry.chatId,
            text: aggregatedText,
            images: entry.images,
            audio: entry.audio,
            quotedContext: entry.quotedContext,
            rawKey: entry.rawKey,
            rawMessage: entry.rawMessage,
            burstCount: entry.texts.length + entry.images.length + (entry.audio ? 1 : 0)
        };

        if (this.onFlush) {
            this.onFlush(aggregatedJob);
        }
    }
}
