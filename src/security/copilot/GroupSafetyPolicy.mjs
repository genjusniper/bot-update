// src/security/copilot/GroupSafetyPolicy.mjs
// Group Safety Policy: Supports matching by Group JID and Group Subject Name

import fs from 'fs/promises';
import path from 'path';
import { OwnerMentionResolver } from './OwnerMentionResolver.mjs';

export class GroupSafetyPolicy {
    static getFilePath() {
        return path.resolve(process.cwd(), 'config', 'personal_group_policy.json');
    }

    static async loadPolicy() {
        const filePath = this.getFilePath();
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch {
            const defaultPolicy = {
                defaultGroupPolicy: 'SILENT',
                whitelistedGroupNames: [
                    { namePattern: 'semarang climbers', policy: 'MENTION_ONLY' },
                    { namePattern: 'peletbento semarang', policy: 'MENTION_ONLY' }
                ],
                groups: {}
            };
            await this.savePolicy(defaultPolicy);
            return defaultPolicy;
        }
    }

    static async savePolicy(policy) {
        const filePath = this.getFilePath();
        try {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(policy, null, 2), 'utf8');
        } catch (e) {
            console.error('[GroupSafetyPolicy] ⚠️ Error saving group policy:', e.message);
        }
    }

    static async evaluateGroupSafety({ groupId, groupSubject = '', rawMessage, ownerJid, text }) {
        const config = await this.loadPolicy();
        const cleanSubject = (groupSubject || '').trim().toLowerCase();

        let policy = config.groups?.[groupId]?.policy;

        // 1. If not found by JID, match by Group Name / Subject
        if (!policy && cleanSubject) {
            const matchedName = (config.whitelistedGroupNames || []).find(w => 
                cleanSubject.includes(w.namePattern.toLowerCase()) || w.namePattern.toLowerCase().includes(cleanSubject)
            );
            if (matchedName) {
                policy = matchedName.policy;
                console.log(`[GroupSafetyPolicy] 🏷️ Matched group "${groupSubject}" to policy: ${policy}`);
            }
        }

        // 2. Default if no rule matched -> SILENT
        if (!policy) {
            policy = config.defaultGroupPolicy || 'SILENT';
        }

        if (policy === 'SILENT') {
            return {
                allowed: false,
                reason: 'GROUP_HARD_SILENT',
                policy,
                groupSubject
            };
        }

        // 3. Verify Owner-specific mention or reply if MENTION_ONLY
        const isTargetedToOwner = OwnerMentionResolver.isSpecificallyTargetedToOwner({
            rawMessage,
            ownerJid,
            text
        });

        if (policy === 'MENTION_ONLY') {
            if (!isTargetedToOwner) {
                return {
                    allowed: false,
                    reason: 'GROUP_NOT_TARGETED_TO_OWNER',
                    policy,
                    groupSubject
                };
            }
            return {
                allowed: true,
                reason: 'GROUP_OWNER_SPECIFICALLY_TAGGED',
                policy,
                groupSubject
            };
        }

        if (policy === 'ACTIVE') {
            return {
                allowed: true,
                reason: 'GROUP_ACTIVE_WHITELIST',
                policy,
                groupSubject
            };
        }

        return {
            allowed: false,
            reason: 'GROUP_UNKNOWN_DEFAULT_SILENT',
            policy: 'SILENT',
            groupSubject
        };
    }
}
