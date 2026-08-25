// src/security/copilot/OwnerMentionResolver.mjs
// Precise Owner Target Detection: Ensures group messages trigger when Owner is tagged or replied to
// Supports all Bot/Owner JIDs: 6285741318412, 232680004292808@lid, 236322690191595@lid

const KNOWN_OWNER_IDS = [
    '6285741318412',
    '232680004292808',
    '236322690191595'
];

export class OwnerMentionResolver {
    static normalizeJid(jid) {
        if (!jid) return '';
        const raw = jid.split(':')[0]; // strip device suffix :1, :54
        if (raw.endsWith('@lid')) return raw;
        const digits = raw.split('@')[0].replace(/\D/g, '');
        return `${digits}@s.whatsapp.net`;
    }

    static isOwnerIdentifier(jid, ownerJid) {
        if (!jid) return false;
        const cleanJid = this.normalizeJid(jid);

        // 1. Check all known Owner IDs (Phone and LIDs)
        for (const id of KNOWN_OWNER_IDS) {
            if (jid.includes(id) || cleanJid.includes(id)) return true;
        }

        // 2. Match dynamically passed ownerJid
        if (ownerJid) {
            const cleanOwner = this.normalizeJid(ownerJid);
            if (cleanJid === cleanOwner) return true;
            const ownerDigits = cleanOwner.split('@')[0];
            if (ownerDigits && cleanJid.includes(ownerDigits)) return true;
        }

        return false;
    }

    static extractContextInfo(rawMessage) {
        if (!rawMessage) return null;
        let msg = rawMessage;
        
        // Recursively unwrap Baileys wrappers (Ephemeral, ViewOnce, Edited, DocumentWithCaption)
        for (let i = 0; i < 5; i++) {
            if (msg.ephemeralMessage?.message) {
                msg = msg.ephemeralMessage.message;
            } else if (msg.viewOnceMessage?.message) {
                msg = msg.viewOnceMessage.message;
            } else if (msg.viewOnceMessageV2?.message) {
                msg = msg.viewOnceMessageV2.message;
            } else if (msg.viewOnceMessageV2Extension?.message) {
                msg = msg.viewOnceMessageV2Extension.message;
            } else if (msg.documentWithCaptionMessage?.message) {
                msg = msg.documentWithCaptionMessage.message;
            } else if (msg.editedMessage?.message?.protocolMessage?.editedMessage) {
                msg = msg.editedMessage.message.protocolMessage.editedMessage;
            } else {
                break;
            }
        }

        return (
            msg.extendedTextMessage?.contextInfo ||
            msg.imageMessage?.contextInfo ||
            msg.videoMessage?.contextInfo ||
            msg.audioMessage?.contextInfo ||
            msg.documentMessage?.contextInfo ||
            msg.stickerMessage?.contextInfo ||
            null
        );
    }

    static isSpecificallyTargetedToOwner({ rawMessage, ownerJid, text }) {
        const cleanOwner = this.normalizeJid(ownerJid);
        const ownerPhone = cleanOwner ? cleanOwner.split('@')[0] : '';

        // 1. Extract contextInfo unwrapping any Baileys wrapper
        const contextInfo = this.extractContextInfo(rawMessage);

        // 2. Check direct @mention arrays in contextInfo
        const mentionedJids = contextInfo?.mentionedJid || [];
        const isDirectlyTagged = mentionedJids.some(j => this.isOwnerIdentifier(j, ownerJid));

        // 3. Check if the message is replying/swiping/quoting a message sent by Owner
        const quotedParticipant = contextInfo?.participant || contextInfo?.remoteJid || null;
        const isReplyingToOwner = Boolean(quotedParticipant && this.isOwnerIdentifier(quotedParticipant, ownerJid));

        // 4. Reject generic @everyone or @all unless specifically tagged or quoted
        const cleanText = (text || '').trim().toLowerCase();
        if (cleanText.includes('@everyone') || cleanText.includes('@all') || cleanText.includes('@semua')) {
            if (!isDirectlyTagged && !isReplyingToOwner) {
                return false;
            }
        }

        // 5. Check explicit phone number mention in text (e.g. "@6285741318412")
        let isPhoneTextTagged = false;
        for (const id of KNOWN_OWNER_IDS) {
            if (cleanText.includes(`@${id}`)) {
                isPhoneTextTagged = true;
                break;
            }
        }

        const result = isDirectlyTagged || isReplyingToOwner || isPhoneTextTagged;
        if (result) {
            console.log(`[OwnerMentionResolver] 🎯 Group message targeted to Owner! (tagged: ${isDirectlyTagged}, reply: ${isReplyingToOwner}, quotedParticipant: ${quotedParticipant})`);
        }

        return result;
    }
}
