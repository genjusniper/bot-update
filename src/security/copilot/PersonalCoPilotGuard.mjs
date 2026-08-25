// src/security/copilot/PersonalCoPilotGuard.mjs
// Master Gatekeeper for Personal WhatsApp Number Co-Pilot
// V14.2 — Strict Logic: AI answers incoming messages from whitelisted contacts immediately; AI never replies to Owner's outgoing messages to others.

import { ContactPolicyEngine } from './ContactPolicyEngine.mjs';
import { GroupSafetyPolicy } from './GroupSafetyPolicy.mjs';

const OWNER_LID = '236322690191595@lid';

export class PersonalCoPilotGuard {
    static async evaluateGatekeeper({ chatId, groupSubject = '', text, fromMe, isGroup, rawMessage, ownerJid }) {
        const ownerPhone = ownerJid ? ownerJid.split(':')[0].split('@')[0] : '';
        
        // Strict Self-Chat: only true if chatting with Owner's exact LID or phone
        const isSelfChat = Boolean(
            chatId === OWNER_LID || 
            (ownerPhone && chatId.replace(/\D/g, '').includes(ownerPhone))
        );

        // 1. If message was sent by Owner to ANOTHER person -> AI NEVER replies to owner's own outgoing message
        if (fromMe && !isSelfChat) {
            return {
                allowAI: false,
                reason: 'OWNER_OUTGOING_MESSAGE_IGNORE',
                action: 'STAND_DOWN'
            };
        }

        // 2. If Self-Chat (Owner chatting to own bot/number) -> Always Allow & Reply
        if (isSelfChat) {
            return {
                allowAI: true,
                reason: 'SELF_CHAT_DIRECT_ACCESS',
                action: 'PROCESS_SELF'
            };
        }

        // 3. If Group Chat -> Evaluate Strict Group Safety
        if (isGroup) {
            const groupVerdict = await GroupSafetyPolicy.evaluateGroupSafety({
                groupId: chatId,
                groupSubject,
                rawMessage,
                ownerJid,
                text
            });

            if (!groupVerdict.allowed) {
                return {
                    allowAI: false,
                    reason: groupVerdict.reason,
                    action: 'SILENT'
                };
            }
            return {
                allowAI: true,
                reason: groupVerdict.reason,
                action: 'PROCESS_GROUP'
            };
        }

        // 4. If Private 1-on-1 Chat from other people (incoming message) -> Evaluate Contact Policy (VIP/AUTO vs SILENT)
        const contactVerdict = await ContactPolicyEngine.getPolicyForContact(chatId);

        if (contactVerdict.policy === 'MANUAL' || contactVerdict.policy === 'SILENT') {
            return {
                allowAI: false,
                reason: `CONTACT_POLICY_${contactVerdict.policy}`,
                action: 'SILENT_MANUAL_REQUIRED'
            };
        }

        // AUTO / VIP -> AI answers the incoming message from the registered contact!
        return {
            allowAI: true,
            reason: `CONTACT_POLICY_${contactVerdict.policy}`,
            action: 'PROCESS_PRIVATE'
        };
    }
}
