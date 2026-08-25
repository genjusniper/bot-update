// src/security/copilot/PersonalCoPilotGuard.mjs
// Master Gatekeeper for Personal WhatsApp Number Co-Pilot

import { ContactPolicyEngine } from './ContactPolicyEngine.mjs';
import { GroupSafetyPolicy } from './GroupSafetyPolicy.mjs';
import { OwnerPresenceEngine } from './OwnerPresenceEngine.mjs';

export class PersonalCoPilotGuard {
    static async evaluateGatekeeper({ chatId, groupSubject = '', text, fromMe, isGroup, rawMessage, ownerJid }) {
        // 1. If message was typed by the Owner himself -> Record takeover & Do NOT process
        if (fromMe) {
            OwnerPresenceEngine.recordOwnerMessage(chatId);
            return {
                allowAI: false,
                reason: 'OWNER_SELF_MESSAGE',
                action: 'STAND_DOWN'
            };
        }

        // 2. If Human Takeover is actively running on this chat -> Yield control to Owner
        if (OwnerPresenceEngine.isTakeoverActive(chatId)) {
            return {
                allowAI: false,
                reason: 'HUMAN_TAKEOVER_ACTIVE',
                action: 'SILENT_HUMAN_IN_CONTROL'
            };
        }

        // 3. If Group Chat -> Evaluate Strict Group Safety (Matches by JID & Group Name)
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

        // 4. If Private 1-on-1 Chat -> Evaluate Contact Policy (AUTO, MANUAL, SILENT)
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
