// src/queue/ChatBurstAggregator.mjs
// Aggregates rapid chat bursts and multiple photos/media within a debounce window
// V13.7 — Bug Fix: pushName, fromMe properly stored; auto-flush on large bursts; flushAll on shutdown

export class ChatBurstAggregator {
    constructor(debounceMs = 2500, onFlushCallback) {
        this.debounceMs = debounceMs;
        this.onFlush = onFlushCallback;
        this.buffers = new Map();
        this.MAX_BURST_ITEMS = 6; // Auto-flush immediately if burst > 6 items
    }

    push(chatId, { text, rawKey, rawMessage, fromMe, pushName, imageBase64, audioBase64, mimeType, quotedContext }) {
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
                fromMe: fromMe || false,
                pushName: pushName || '',
                firstTimestamp: Date.now(),
                itemCount: 0
            };
            this.buffers.set(chatId, entry);
        }

        // Always update rawKey + rawMessage to latest in burst (for quoting)
        entry.rawKey = rawKey;
        entry.rawMessage = rawMessage;

        // Update pushName & fromMe if available
        if (pushName) entry.pushName = pushName;
        if (typeof fromMe === 'boolean') entry.fromMe = fromMe;

        // Add text if present
        if (text && text.trim().length > 0) {
            entry.texts.push(text.trim());
            entry.itemCount++;
        }

        // Accumulate ALL images from all burst messages (FIXED: was losing photos)
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

        // Auto-flush immediately if burst exceeds max items (prevent queue overload)
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

        this.buffers.delete(chatId);

        const aggregatedText = entry.texts.join(' ').trim();
        const burstCount = entry.texts.length + entry.images.length + (entry.audio ? 1 : 0);
        const burstDurationMs = Date.now() - entry.firstTimestamp;

        const aggregatedJob = {
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
            this.onFlush(aggregatedJob);
        }
    }

    // Force flush all pending buffers (called on SIGINT/shutdown)
    flushAll() {
        for (const chatId of this.buffers.keys()) {
            this.flush(chatId);
        }
    }
}
