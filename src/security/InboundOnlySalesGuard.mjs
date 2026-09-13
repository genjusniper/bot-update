/**
 * InboundOnlySalesGuard.mjs
 * 
 * Deterministic Sales Firewall enforcing the "Door Opened by User" Principle.
 * Strictly prohibits any outbound spamming, unsolicited DMs, cold outreach, or unwanted pitching.
 * 
 * Rules:
 * - IF outbound_initiated_by_bot -> BLOCK
 * - IF no_user_message -> BLOCK
 * - IF no_interest_signal -> DO_NOT_PITCH (Stay helpful or silent, zero commercial pitch)
 * - IF user_asks_about_product -> ALLOW_CONVERSATION
 * - IF user_requests_demo -> ALLOW_DEMO
 * - IF user_requests_price -> ALLOW_PRICING_DISCUSSION
 * - IF user_requests_customization -> ALLOW_DISCOVERY
 * - IF serious_lead -> HUMAN_HANDOFF
 * - IF user_says_stop -> STOP_PERMANENTLY
 * 
 * Complies with WhatsApp Business Policy: user-initiated service window, explicit opt-out, human escalation.
 */

export class InboundOnlySalesGuard {
    static ACTIONS = {
        BLOCK: 'BLOCK',
        DO_NOT_PITCH: 'DO_NOT_PITCH',
        ALLOW_CONVERSATION: 'ALLOW_CONVERSATION',
        ALLOW_DEMO: 'ALLOW_DEMO',
        ALLOW_PRICING_DISCUSSION: 'ALLOW_PRICING_DISCUSSION',
        ALLOW_DISCOVERY: 'ALLOW_DISCOVERY',
        HUMAN_HANDOFF: 'HUMAN_HANDOFF',
        STOP_PERMANENTLY: 'STOP_PERMANENTLY'
    };

    // Permanent opt-out / blacklist store (Key: chatId)
    static optOutRegistry = new Set();

    /**
     * Inspect incoming context and determine commercial interaction permission
     * @param {Object} params
     * @param {string} params.chatId - WhatsApp Chat JID / phone
     * @param {string} params.incomingText - User's incoming message
     * @param {boolean} [params.isOutboundTrigger=false] - True if triggered by bot timer/cron without user message
     * @param {boolean} [params.isOwner=false] - True if sender is Bos Agus
     */
    static evaluate({ chatId, incomingText, isOutboundTrigger = false, isOwner = false }) {
        // 1. RULE: IF outbound_initiated_by_bot -> BLOCK
        if (isOutboundTrigger) {
            return {
                allowed: false,
                action: this.ACTIONS.BLOCK,
                reason: 'OUTBOUND_SPAM_BLOCKED: Salim never initiates cold outbound messages or broadcasts autonomously.'
            };
        }

        // 2. RULE: IF no_user_message -> BLOCK
        const clean = (incomingText || '').trim().toLowerCase();
        if (!clean) {
            return {
                allowed: false,
                action: this.ACTIONS.BLOCK,
                reason: 'EMPTY_INBOUND: No message content from user.'
            };
        }

        // 3. RULE: IF user_says_stop -> STOP_PERMANENTLY
        if (/\b(?:stop|berhenti|cukup|unsubscribe)\b/i.test(clean) ||
            /jangan\s*(?:wa|chat|hubungi|tawarkan|promosi|kirim)/i.test(clean) ||
            /gak\s*minat|tidak\s*(?:minat|tertarik)/i.test(clean)) {
            this.optOutRegistry.add(chatId);
            return {
                allowed: false,
                action: this.ACTIONS.STOP_PERMANENTLY,
                closingMessage: 'Baik mas/kak, nomor Anda telah kami catat untuk tidak menerima informasi komersial apapun lagi. Terima kasih banyak atas waktunya.',
                reason: 'OPT_OUT_HONORED: User explicitly requested to stop receiving information.'
            };
        }

        // Check if contact has previously opted out
        if (this.optOutRegistry.has(chatId) && !isOwner) {
            return {
                allowed: false,
                action: this.ACTIONS.STOP_PERMANENTLY,
                reason: 'BLACKLISTED_CONTACT: Contact previously opted out from commercial conversations.'
            };
        }

        // 4. RULE: IF serious_lead -> HUMAN_HANDOFF
        if (/kontak\s*owner|bicara\s*(?:ke|sama)\s*mas\s*agus|nomor\s*wa\s*(?:bos|pemilik)|mau\s*ngobrol\s*langsung/i.test(clean) ||
            /serius\s*mau\s*(?:pasang|sewa|kontrak)/i.test(clean)) {
            return {
                allowed: true,
                action: this.ACTIONS.HUMAN_HANDOFF,
                reason: 'User explicitly requested direct contact or indicated high commitment.'
            };
        }

        // 5. RULE: IF user_requests_demo -> ALLOW_DEMO
        if (/ada\s*demo|bisa\s*(?:coba|tes|tester|trial)|gimana\s*cara\s*kerjanya|simulasi/i.test(clean)) {
            return {
                allowed: true,
                action: this.ACTIONS.ALLOW_DEMO,
                reason: 'User explicitly asked to see how the system works or requested a trial.'
            };
        }

        // 6. RULE: IF user_requests_price -> ALLOW_PRICING_DISCUSSION
        if (/berapa\s*(?:sewa|biaya|tarif|harga|langganan)|pricelist|paket\s*apa\s*aja/i.test(clean)) {
            return {
                allowed: true,
                action: this.ACTIONS.ALLOW_PRICING_DISCUSSION,
                reason: 'User explicitly asked for pricing, rent rates, or subscription packages.'
            };
        }

        // 7. RULE: IF user_requests_customization -> ALLOW_DISCOVERY
        if (/bisa\s*custom|bisa\s*disesuaikan|bisa\s*konek\s*ke|integrasi\s*database|buat\s*bisnis\s*(?:saya|kami)/i.test(clean)) {
            return {
                allowed: true,
                action: this.ACTIONS.ALLOW_DISCOVERY,
                reason: 'User asked about tailoring Salim to their specific operational workflow.'
            };
        }

        // 8. RULE: IF user_asks_about_product -> ALLOW_CONVERSATION
        if (/bot\s*(?:ini\s*)?(?:bisa|bikin\s*sendiri|disewa|fiturnya\s*apa|pakai\s*ai\s*apa)/i.test(clean) ||
            /kamu\s*(?:bot\s*)?(?:apa|siapa|bisa\s*ngapain)/i.test(clean)) {
            return {
                allowed: true,
                action: this.ACTIONS.ALLOW_CONVERSATION,
                reason: 'User showed clear curiosity about Salim capabilities.'
            };
        }

        // 9. RULE: IF no_interest_signal -> DO_NOT_PITCH
        return {
            allowed: false,
            action: this.ACTIONS.DO_NOT_PITCH,
            reason: 'NO_INTEREST_SIGNAL: User is having regular chat or discussion without product interest. Zero pitching permitted.'
        };
    }
}
