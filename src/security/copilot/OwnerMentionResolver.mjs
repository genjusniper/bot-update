// src/security/copilot/OwnerMentionResolver.mjs
// Precise Owner Target Detection: Ensures group messages trigger when Owner is tagged or replied to
// Supports both Phone JID (628xxx@s.whatsapp.net) and Owner LID (236322690191595@lid)

const OWNER_LID = '236322690191595@lid';

export class OwnerMentionResolver {
    static normalizeJid(jid) {
        if (!jid) return '';
        const raw = jid.split(':')[0]; // strip device suffix :1, :0
        if (raw.endsWith('@lid')) return raw;
        const digits = raw.split('@')[0].replace(/\D/g, '');
        return `${digits}@s.whatsapp.net`;
    }

    static isOwnerIdentifier(jid, ownerJid) {
        if (!jid) return false;
        const cleanJid = this.normalizeJid(jid);
        
        // 1. Match Owner LID
        if (cleanJid === OWNER_LID || jid.includes('236322690191595')) return true;

        // 2. Match Owner Phone JID
        if (ownerJid) {
            const cleanOwner = this.normalizeJid(ownerJid);
            if (cleanJid === cleanOwner) return true;
            const ownerDigits = cleanOwner.split('@')[0];
            if (ownerDigits && cleanJid.includes(ownerDigits)) return true;
        }

        return false;
    }

    static isSpecificallyTargetedToOwner({ rawMessage, ownerJid, text }) {
        const cleanOwner = this.normalizeJid(ownerJid);
        const ownerPhone = cleanOwner ? cleanOwner.split('@')[0] : '';

        // 1. Check direct @mention arrays in all message types
        const contextInfo = 
            rawMessage?.extendedTextMessage?.contextInfo ||
            rawMessage?.imageMessage?.contextInfo ||
            rawMessage?.videoMessage?.contextInfo ||
            rawMessage?.documentMessage?.contextInfo ||
            rawMessage?.audioMessage?.contextInfo;

        const mentionedJids = contextInfo?.mentionedJid || [];
        const isDirectlyTagged = mentionedJids.some(j => this.isOwnerIdentifier(j, ownerJid));

        // 2. Check if the message is replying/swiping/quoting a message sent by Owner
        const quotedParticipant = contextInfo?.participant || contextInfo?.remoteJid || null;
        const isReplyingToOwner = Boolean(quotedParticipant && this.isOwnerIdentifier(quotedParticipant, ownerJid));

        // 3. Reject generic @everyone or @all unless specifically tagged or quoted
        const cleanText = (text || '').trim().toLowerCase();
        if (cleanText.includes('@everyone') || cleanText.includes('@all') || cleanText.includes('@semua')) {
            if (!isDirectlyTagged && !isReplyingToOwner) {
                return false;
            }
        }

        // 4. Check explicit phone number mention in text (e.g. "@628123456789")
        const isPhoneTextTagged = Boolean(ownerPhone && cleanText.includes(`@${ownerPhone}`));

        return isDirectlyTagged || isReplyingToOwner || isPhoneTextTagged;
    }
}
