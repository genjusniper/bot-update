// src/security/copilot/ContactPolicyEngine.mjs
// Contact Policy Engine for Personal WhatsApp Number: Controls AUTO, MANUAL, VIP & SILENT per contact

import fs from 'fs/promises';
import path from 'path';

export class ContactPolicyEngine {
    static getFilePath() {
        return path.resolve(process.cwd(), 'config', 'personal_contact_policy.json');
    }

    static normalizeJid(jid) {
        if (!jid) return '';
        // Extract raw digits
        const digits = jid.replace(/\D/g, '');
        return `${digits}@s.whatsapp.net`;
    }

    static async loadPolicy() {
        const filePath = this.getFilePath();
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch {
            const defaultPolicy = {
                defaultPrivatePolicy: 'SILENT', // HARD DEFAULT: SILENT for all unauthorized contacts
                contacts: {}
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
            console.error('[ContactPolicyEngine] ⚠️ Error saving contact policy:', e.message);
        }
    }

    static async getPolicyForContact(contactId) {
        const config = await this.loadPolicy();
        const cleanJid = this.normalizeJid(contactId);

        // Check exact match in contacts whitelist
        const contact = config.contacts?.[cleanJid] || config.contacts?.[contactId];

        if (contact && contact.policy) {
            return {
                policy: contact.policy, // 'AUTO' | 'MANUAL' | 'SILENT' | 'VIP'
                name: contact.name || 'VIP Contact'
            };
        }

        // Unauthorized contact -> SILENT
        return {
            policy: config.defaultPrivatePolicy || 'SILENT',
            name: 'Unauthorized Contact'
        };
    }

    static async setContactPolicy(contactId, name, policy) {
        const config = await this.loadPolicy();
        if (!config.contacts) config.contacts = {};
        const cleanJid = this.normalizeJid(contactId);
        config.contacts[cleanJid] = { name, policy };
        await this.savePolicy(config);
        console.log(`[ContactPolicyEngine] 👤 Updated policy for ${name} (${cleanJid}): ${policy}`);
    }
}
