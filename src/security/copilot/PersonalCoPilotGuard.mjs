// src/security/copilot/PersonalCoPilotGuard.mjs
// Master Gatekeeper for Personal WhatsApp Number Co-Pilot
// V14.1 — Fixed: isSelfChat strictly locked to Owner ID (never misidentifies other @lid contacts)

import { ContactPolicyEngine } from './ContactPolicyEngine.mjs';
import { GroupSafetyPolicy } from './GroupSafetyPolicy.mjs';
import { OwnerPresenceEngine } from './OwnerPresenceEngine.mjs';

const OWNER_LID = '236322690191595@lid';

export class PersonalCoPilotGuard {
    static async evaluateGatekeeper({ chatId, groupSubject = '', text, fromMe, isGroup, rawMessage, ownerJid }) {
        const ownerPhone = ownerJid ? ownerJid.split(':')[0].split('@')[0] : '';
        
        // STRICT SELF-CHAT: Only true if chatting with Owner's exact LID or Owner's phone
        const isSelfChat = Boolean(
            chatId === OWNER_LID || 
            (ownerPhone && chatId.replace(/\D/g, '').includes(ownerPhone))
        );

        // 1. If message was typed manually by Owner to ANOTHER person -> Record takeover & STAND DOWN
        if (fromMe && !isSelfChat) {
            OwnerPresenceEngine.recordOwnerMessage(chatId);
            return {
                allowAI: false,
                reason: 'OWNER_SELF_MESSAGE_TO_OTHER',
                action: 'STAND_DOWN'
            };
        }

        // 2. If Human Takeover is actively running on this chat -> Yield control to Owner
        if (!isSelfChat && OwnerPresenceEngine.isTakeoverActive(chatId)) {
            return {
                allowAI: false,
                reason: 'HUMAN_TAKEOVER_ACTIVE',
                action: 'SILENT_HUMAN_IN_CONTROL'
            };
        }

        // 3. If Self-Chat (Owner chatting to own bot/number) -> Always Allow
        if (isSelfChat) {
            return {
                allowAI: true,
                reason: 'SELF_CHAT_DIRECT_ACCESS',
                action: 'PROCESS_SELF'
            };
        }

        // 4. If Group Chat -> Evaluate Strict Group Safety
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

        // 5. If Private 1-on-1 Chat from other people -> Evaluate Contact Policy (VIP/AUTO vs SILENT)
        const contactVerdict = await ContactPolicyEngine.getPolicyForContact(chatId);

        if (contactVerdict.policy === 'MANUAL' || contactVerdict.policy === 'SILENT') {
            return {
                allowAI: false,
                reason: `CONTACT_POLICY_${contactVerdict.policy}`,
                action: 'SILENT_MANUAL_REQUIRED'
            };
        }

        return {
            allowAI: true,
            reason: `CONTACT_POLICY_${contactVerdict.policy}`,
            action: 'PROCESS_PRIVATE'
        };
    }
}
