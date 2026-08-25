// src/security/copilot/OwnerMentionResolver.mjs
// Precise Owner Target Detection: Ensures group messages ONLY trigger when specifically targeted to Owner's number

export class OwnerMentionResolver {
    static normalizeJid(jid) {
        if (!jid) return '';
        // Strip out device suffix like :1@s.whatsapp.net -> @s.whatsapp.net
        return jid.split(':')[0].split('@')[0] + '@s.whatsapp.net';
    }

    static isSpecificallyTargetedToOwner({ rawMessage, ownerJid, text }) {
        if (!ownerJid) return false;

        const cleanOwner = this.normalizeJid(ownerJid);
        const ownerPhone = cleanOwner.split('@')[0];

        // 1. Check direct @mention arrays in all message types (text, image, video, document)
        const contextInfo = 
            rawMessage?.extendedTextMessage?.contextInfo ||
            rawMessage?.imageMessage?.contextInfo ||
            rawMessage?.videoMessage?.contextInfo ||
            rawMessage?.documentMessage?.contextInfo;

        const mentionedJids = (contextInfo?.mentionedJid || []).map(j => this.normalizeJid(j));

        const isDirectlyTagged = mentionedJids.includes(cleanOwner);

        // 2. Check if the message is replying/quoting a message previously sent by Owner
        const quotedParticipant = contextInfo?.participant ? this.normalizeJid(contextInfo.participant) : null;
        const isReplyingToOwner = quotedParticipant === cleanOwner;

        // 3. Reject generic @everyone or @all unless specifically tagged
        const cleanText = (text || '').trim().toLowerCase();
        if (cleanText.includes('@everyone') || cleanText.includes('@all') || cleanText.includes('@semua')) {
            // Only allow if the owner is also personally tagged or quoted
            if (!isDirectlyTagged && !isReplyingToOwner) {
                return false;
            }
        }

        // 4. Check explicit phone number mention in text (e.g. "@628123456789")
        const isPhoneTextTagged = cleanText.includes(`@${ownerPhone}`);

        return isDirectlyTagged || isReplyingToOwner || isPhoneTextTagged;
    }
}
