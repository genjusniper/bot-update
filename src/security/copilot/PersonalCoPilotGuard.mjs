// src/security/copilot/PersonalCoPilotGuard.mjs
// Master Gatekeeper for Personal WhatsApp Number Co-Pilot

import { ContactPolicyEngine } from './ContactPolicyEngine.mjs';
import { GroupSafetyPolicy } from './GroupSafetyPolicy.mjs';
import { OwnerPresenceEngine } from './OwnerPresenceEngine.mjs';

export class PersonalCoPilotGuard {
    static async evaluateGatekeeper({ chatId, groupSubject = '', text, fromMe, isGroup, rawMessage, ownerJid }) {
        const isSelfChat = Boolean(
            chatId.endsWith('@lid') || 
            (ownerJid && chatId.includes(ownerJid.split(':')[0].split('@')[0]))
        );

        // 1. If message was typed by Owner to ANOTHER person -> Record takeover & Do NOT process
        if (fromMe && !isSelfChat) {
            OwnerPresenceEngine.recordOwnerMessage(chatId);
            return {
                allowAI: false,
                reason: 'OWNER_SELF_MESSAGE_TO_OTHER',
                action: 'STAND_DOWN'
            };
        }

        // 2. If Human Takeover is actively running on this chat -> Yield control to Owner (unless self-chat)
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

        // 4. If Group Chat -> Evaluate Strict Group Safety (Matches by JID & Group Name)
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

        // 5. If Private 1-on-1 Chat -> Evaluate Contact Policy (AUTO, MANUAL, SILENT)
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
