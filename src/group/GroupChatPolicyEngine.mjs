// src/group/GroupChatPolicyEngine.mjs
// Group Chat Policy, Mention Filtering & Silence Enforcement

export class GroupChatPolicyEngine {
    static BOT_NAME_REGEX = /(agus|antigravity|bot|ai)/i;

    static evaluateGroupMessage(chatId, message, senderId, botJid = '') {
        const isGroup = chatId.endsWith('@g.us');
        if (!isGroup) {
            return { isGroup: false, shouldRespond: true, reason: 'DIRECT_MESSAGE' };
        }

        const text = (message || '').trim();
        const isMentioned = (botJid && text.includes(botJid.split('@')[0])) || this.BOT_NAME_REGEX.test(text);
        const isDirectQuestion = text.includes('?') && text.length < 50;

        if (isMentioned) {
            return {
                isGroup: true,
                shouldRespond: true,
                reason: 'BOT_MENTIONED',
                directive: "GRUP CHAT: Bot dipanggil langsung. Respon singkat, relevan, dan santai."
            };
        }

        // Default Group Policy: SILENCE (Do not spam the group)
        return {
            isGroup: true,
            shouldRespond: false,
            reason: 'SILENCE_POLICY',
            directive: "GRUP CHAT: Bot tidak dipanggil. Tetap diam."
        };
    }
}
