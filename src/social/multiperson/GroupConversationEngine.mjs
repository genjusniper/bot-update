// src/social/multiperson/GroupConversationEngine.mjs
// Group Chat Intelligence, Mention Resolver & Participation Levels (0-4)

export class GroupConversationEngine {
    static evaluateGroupMessage({ chatId, text, senderId, botId, isQuotedToBot, mentionedJids = [] }) {
        const isGroup = chatId.endsWith('@g.us');
        if (!isGroup) {
            // Private 1-on-1 Chat -> Full Active Participation
            return {
                isGroup: false,
                participationLevel: 4, // ACTIVE_DIRECT
                shouldRespond: true,
                action: 'REPLY'
            };
        }

        const cleanText = (text || '').trim().toLowerCase();
        const isMentioned = Boolean(botId && mentionedJids.includes(botId)) || cleanText.includes('@bot') || cleanText.startsWith('bot ');

        // 1. Direct Mention or Quoting Bot -> Level 4 (Active Direct)
        if (isMentioned || isQuotedToBot) {
            return {
                isGroup: true,
                participationLevel: 4,
                shouldRespond: true,
                action: 'REPLY'
            };
        }

        // 2. Someone asking for recap in group -> Level 3
        if (cleanText.match(/^(tadi mereka ngomongin apa|recap grup|tadi bahas apa)/i)) {
            return {
                isGroup: true,
                participationLevel: 3,
                shouldRespond: true,
                action: 'REPLY_RECAP'
            };
        }

        // 3. Trailing Group Banter -> Level 0 (Silent Observer)
        // Never jump in unsolicited when two humans are talking to each other!
        return {
            isGroup: true,
            participationLevel: 0,
            shouldRespond: false,
            action: 'SILENCE'
        };
    }
}
