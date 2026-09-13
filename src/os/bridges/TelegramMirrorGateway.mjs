// src/os/bridges/TelegramMirrorGateway.mjs
// ============================================================================
// SALIM OS - TELEGRAM MIRROR GATEWAY (DUAL-ECOSYSTEM BRIDGE)
// Connects Telegram to Salim OS without heavy dependencies, sharing same brain
// ============================================================================

export class TelegramMirrorGateway {
    static isPolling = false;
    static lastUpdateId = 0;
    static pollIntervalTimer = null;

    static getToken() {
        return process.env.TELEGRAM_BOT_TOKEN || null;
    }

    static isEnabled() {
        return Boolean(this.getToken());
    }

    /**
     * Starts long-polling Telegram Bot API
     */
    static start(onMessageCallback) {
        const token = this.getToken();
        if (!token) {
            console.log('[TelegramMirror] ℹ️ TELEGRAM_BOT_TOKEN not set in .env. Telegram Mirror Gateway dormant.');
            return;
        }

        if (this.isPolling) return;
        this.isPolling = true;
        console.log('[TelegramMirror] 🚀 Telegram Mirror Gateway initialized. Polling active.');

        this.pollLoop(token, onMessageCallback);
    }

    /**
     * Poll loop using native fetch
     */
    static async pollLoop(token, onMessageCallback) {
        while (this.isPolling) {
            try {
                const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=20`;
                const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
                if (!res.ok) {
                    await new Promise(r => setTimeout(r, 5000));
                    continue;
                }

                const data = await res.json();
                if (data.ok && Array.isArray(data.result)) {
                    for (const update of data.result) {
                        this.lastUpdateId = update.update_id;
                        if (update.message && update.message.text) {
                            const chatId = update.message.chat.id;
                            const fromUser = update.message.from.first_name || 'User';
                            const text = update.message.text;

                            if (typeof onMessageCallback === 'function') {
                                const replyText = await onMessageCallback({ text, chatId, fromUser });
                                if (replyText) {
                                    await this.sendMessage(chatId, replyText);
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                // Ignore timeout aborts, sleep briefly on real errors
                if (err.name !== 'TimeoutError' && err.name !== 'AbortError') {
                    console.warn('[TelegramMirror] Poll error:', err.message);
                    await new Promise(r => setTimeout(r, 4000));
                }
            }
        }
    }

    /**
     * Sends message to Telegram chat
     */
    static async sendMessage(chatId, text) {
        const token = this.getToken();
        if (!token) return;

        try {
            const url = `https://api.telegram.org/bot${token}/sendMessage`;
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'Markdown'
                })
            });
        } catch (err) {
            console.warn('[TelegramMirror] Send error:', err.message);
        }
    }

    /**
     * Stops polling cleanly
     */
    static stop() {
        this.isPolling = false;
        console.log('[TelegramMirror] 🛑 Telegram Mirror Gateway stopped.');
    }
}
