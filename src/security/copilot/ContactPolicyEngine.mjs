// src/security/copilot/ContactPolicyEngine.mjs
// Contact Policy Engine for Personal WhatsApp Number: Controls AUTO, MANUAL, VIP & SILENT per contact

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

export class ContactPolicyEngine {
    static getFilePath() {
        return path.resolve(process.cwd(), 'config', 'personal_contact_policy.json');
    }

    static normalizeJid(jid) {
        if (!jid) return '';
        if (jid.endsWith('@lid')) {
            return jid.split(':')[0].split('@')[0] + '@lid';
        }
        if (jid.endsWith('@g.us')) {
            return jid;
        }
        // Extract raw digits for standard WhatsApp numbers
        const digits = jid.split('@')[0].replace(/\D/g, '');
        return `${digits}@s.whatsapp.net`;
    }

    static resolvePhoneFromLid(lidJid) {
        if (!lidJid || !lidJid.endsWith('@lid')) return null;
        const lidNum = lidJid.split('@')[0].split(':')[0];
        const reverseFile = path.resolve(process.cwd(), 'auth-v5-test', `lid-mapping-${lidNum}_reverse.json`);
        try {
            if (fsSync.existsSync(reverseFile)) {
                const raw = fsSync.readFileSync(reverseFile, 'utf8');
                const phone = JSON.parse(raw);
                if (phone) return `${String(phone).trim()}@s.whatsapp.net`;
            }
        } catch (e) {}
        return null;
    }

    static async loadPolicy() {
        const filePath = this.getFilePath();
        try {
            const data = await fs.readFile(filePath, 'utf8');
            const parsed = JSON.parse(data);
            if (!parsed.contacts) parsed.contacts = {};
            if (!parsed.groups) parsed.groups = {};
            if (!parsed.defaultPrivatePolicy) parsed.defaultPrivatePolicy = 'SILENT';
            if (!parsed.defaultGroupPolicy) parsed.defaultGroupPolicy = 'SILENT';
            return parsed;
        } catch {
            const defaultPolicy = {
                defaultPrivatePolicy: 'SILENT',
                defaultGroupPolicy: 'SILENT',
                contacts: {
                    '236322690191595@lid': { name: 'Agus (Owner)', policy: 'AUTO' }
                },
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
            console.error('[ContactPolicyEngine] ⚠️ Error saving contact policy:', e.message);
        }
    }

    static async getPolicyForContact(contactId) {
        const config = await this.loadPolicy();
        const cleanJid = this.normalizeJid(contactId);

        // 1. Direct match in contacts (by LID or JID)
        let contact = config.contacts?.[cleanJid] || config.contacts?.[contactId];

        // 2. If it's an LID and not directly found, resolve to phone number and check
        if (!contact && cleanJid.endsWith('@lid')) {
            const resolvedPhone = this.resolvePhoneFromLid(cleanJid);
            if (resolvedPhone) {
                contact = config.contacts?.[resolvedPhone];
                if (contact) {
                    console.log(`[ContactPolicyEngine] 🔗 Auto-resolved LID ${cleanJid} -> Phone ${resolvedPhone} (${contact.name})`);
                }
            }
        }

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
        config.contacts[cleanJid] = { name: name || config.contacts[cleanJid]?.name || 'Kontak', policy, lastSeen: Date.now() };
        
        // Also register mapped LID if known
        if (cleanJid.endsWith('@s.whatsapp.net')) {
            const phone = cleanJid.split('@')[0];
            try {
                const authDir = path.resolve(process.cwd(), 'auth-v5-test');
                if (fsSync.existsSync(authDir)) {
                    const files = fsSync.readdirSync(authDir);
                    for (const f of files) {
                        if (f.startsWith('lid-mapping-') && f.endsWith('_reverse.json')) {
                            const raw = fsSync.readFileSync(path.join(authDir, f), 'utf8');
                            if (JSON.parse(raw) == phone) {
                                const lid = f.replace('lid-mapping-', '').replace('_reverse.json', '') + '@lid';
                                config.contacts[lid] = { name: name || config.contacts[cleanJid]?.name || 'Kontak', policy, lastSeen: Date.now() };
                                break;
                            }
                        }
                    }
                }
            } catch (e) {}
        }
        
        await this.savePolicy(config);
        console.log(`[ContactPolicyEngine] 👤 Updated policy for ${name} (${cleanJid}): ${policy}`);
    }

    static async setGroupPolicy(groupId, name, policy) {
        const config = await this.loadPolicy();
        if (!config.groups) config.groups = {};
        config.groups[groupId] = {
            name: name || config.groups[groupId]?.name || 'Grup',
            policy,
            lastSeen: Date.now()
        };
        await this.savePolicy(config);
        console.log(`[ContactPolicyEngine] 🏢 Updated group policy for ${name} (${groupId}): ${policy}`);
    }

    /**
     * Records any incoming contact or group so they appear in the Web UI checklist
     */
    static async recordSeen(chatId, name = '', isGroup = false) {
        if (!chatId) return;
        try {
            const config = await this.loadPolicy();
            let changed = false;

            if (isGroup) {
                if (!config.groups[chatId]) {
                    config.groups[chatId] = {
                        name: name || 'Grup Tanpa Nama',
                        policy: 'SILENT',
                        lastSeen: Date.now()
                    };
                    changed = true;
                } else {
                    if (name && config.groups[chatId].name !== name) {
                        config.groups[chatId].name = name;
                        changed = true;
                    }
                    config.groups[chatId].lastSeen = Date.now();
                }
            } else {
                const cleanJid = this.normalizeJid(chatId);
                if (!config.contacts[cleanJid]) {
                    config.contacts[cleanJid] = {
                        name: name || 'Kontak Baru',
                        policy: 'SILENT',
                        lastSeen: Date.now()
                    };
                    changed = true;
                } else {
                    if (name && (config.contacts[cleanJid].name.startsWith('VIP Contact') || !config.contacts[cleanJid].name)) {
                        config.contacts[cleanJid].name = name;
                        changed = true;
                    }
                    config.contacts[cleanJid].lastSeen = Date.now();
                }
            }

            if (changed) {
                await this.savePolicy(config);
            }
        } catch (e) {}
    }

    /**
     * Determines whether the bot is allowed to answer this contact or group
     */
    static async isAllowed(chatId, isGroup = false) {
        // Owner is ALWAYS allowed
        if (chatId === '236322690191595@lid' || chatId.includes('236322690191595')) {
            return true;
        }

        const config = await this.loadPolicy();

        if (isGroup) {
            const grp = config.groups?.[chatId];
            return grp?.policy === 'AUTO';
        }

        const cleanJid = this.normalizeJid(chatId);
        let contact = config.contacts?.[cleanJid] || config.contacts?.[chatId];

        if (!contact && cleanJid.endsWith('@lid')) {
            const resolvedPhone = this.resolvePhoneFromLid(cleanJid);
            if (resolvedPhone) {
                contact = config.contacts?.[resolvedPhone];
            }
        }

        if (contact && (contact.policy === 'AUTO' || contact.policy === 'VIP')) {
            return true;
        }

        return false;
    }

    static async toggle(id, type, policy) {
        if (type === 'group') {
            await this.setGroupPolicy(id, null, policy);
        } else {
            await this.setContactPolicy(id, null, policy);
        }
    }

    static async getWhitelistSummary() {
        const config = await this.loadPolicy();
        const allowedContacts = Object.entries(config.contacts || {})
            .filter(([jid, c]) => (c.policy === 'AUTO' || c.policy === 'VIP') && !jid.includes('236322690191595'))
            .map(([jid, c]) => `• *${c.name || 'Kontak'}* (\`${jid.split('@')[0]}\`)`);

        const allowedGroups = Object.entries(config.groups || {})
            .filter(([id, g]) => g.policy === 'AUTO')
            .map(([id, g]) => `• *${g.name || 'Grup'}* (\`${id.split('@')[0]}\`)`);

        const mutedGroups = Object.entries(config.groups || {})
            .filter(([id, g]) => g.policy !== 'AUTO')
            .map(([id, g]) => `• ${g.name || 'Grup'} (\`${id.split('@')[0]}\`)`);

        const totalGroups = Object.keys(config.groups || {}).length;

        return `🛡️ *DAFTAR STATUS IZIN AI (WHITELIST)*
──────────────────────────────
👤 *Kontak yang Diizinkan AI (${allowedContacts.length}):*
${allowedContacts.length > 0 ? allowedContacts.join('\n') : '_(Semua kontak luar dibungkam demi keamanan)_'}

🏢 *Grup yang Diizinkan AI Membalas (${allowedGroups.length}/${totalGroups}):*
${allowedGroups.length > 0 ? allowedGroups.join('\n') : '_(Belum ada grup yang diizinkan)_'}

🔇 *Grup Lain yang Dibungkam/Diam (${mutedGroups.length}):*
${mutedGroups.length > 0 ? mutedGroups.slice(0, 8).join('\n') + (mutedGroups.length > 8 ? `\n• ...dan ${mutedGroups.length - 8} grup lainnya` : '') : '_(Tidak ada)_'}

──────────────────────────────
⚙️ *Cara Mengubah Izin:*
• \`!izinkan grup\` (Ketik langsung di dalam grup yang mau diaktifkan)
• \`!mute grup\` (Ketik di dalam grup yang mau didiamkan)
• \`!izinkan <nomor/nama kontak>\`
🌐 *Atau centang ceklis di Web Cockpit:*
http://192.168.0.100:3000`;
    }

    /**
     * Handles WhatsApp commands from Owner (!izinkan, !mute, !whitelist)
     */
    static async handleOwnerCommand(text = '', chatId = '', isGroup = false, groupSubject = '') {
        const raw = (text || '').trim();
        const lower = raw.toLowerCase();

        // 1. View Whitelist
        if (lower === '!whitelist' || lower === '!list izin' || lower === '!daftar izin' || lower === '!cek izin') {
            const summary = await this.getWhitelistSummary();
            return { handled: true, response: summary };
        }

        // 2. Allow Group
        if (lower.startsWith('!izinkan grup') || lower.startsWith('!allow group') || lower.startsWith('!allow grup')) {
            const targetGroupId = isGroup ? chatId : raw.replace(/^(?:!izinkan grup|!allow group|!allow grup)\s*/i, '').trim();
            if (!targetGroupId) {
                return { handled: true, response: '⚠️ Bos, masukkan ID grup atau ketik command ini langsung di dalam grupnya.' };
            }
            await this.setGroupPolicy(targetGroupId, groupSubject || 'Grup WhatsApp', 'AUTO');
            return { handled: true, response: `✅ *Grup Diizinkan!*\nAI sekarang akan merespons chat di grup ini jika dipanggil/relevan.` };
        }

        // 3. Mute Group
        if (lower.startsWith('!mute grup') || lower.startsWith('!blokir grup') || lower.startsWith('!mute group')) {
            const targetGroupId = isGroup ? chatId : raw.replace(/^(?:!mute grup|!blokir grup|!mute group)\s*/i, '').trim();
            if (!targetGroupId) {
                return { handled: true, response: '⚠️ Bos, masukkan ID grup atau ketik command ini langsung di dalam grupnya.' };
            }
            await this.setGroupPolicy(targetGroupId, groupSubject || 'Grup WhatsApp', 'SILENT');
            return { handled: true, response: `🔇 *Grup Dinonaktifkan!*\nAI sekarang 100% diam dan mengabaikan grup ini.` };
        }

        // 4. Allow Contact: !izinkan 08123456789 Budi
        if (lower.startsWith('!izinkan ') || lower.startsWith('!allow ')) {
            const args = raw.replace(/^(?:!izinkan|!allow)\s+/i, '').trim().split(/\s+/);
            let target = args[0] || '';
            const name = args.slice(1).join(' ') || 'Kontak Whitelist';

            if (!target) {
                return { handled: true, response: '⚠️ Format: `!izinkan 0812xxxxxxxx [Nama]`' };
            }

            if (!target.includes('@')) {
                let cleanNum = target.replace(/\D/g, '');
                if (cleanNum.startsWith('0')) cleanNum = '62' + cleanNum.slice(1);
                target = `${cleanNum}@s.whatsapp.net`;
            }

            await this.setContactPolicy(target, name, 'AUTO');
            return { handled: true, response: `✅ *Kontak Diizinkan!*\nNama: *${name}*\nID: \`${target}\`\nAI sekarang akan merespons pesan dari orang ini.` };
        }

        // 5. Mute Contact: !mute 08123456789
        if (lower.startsWith('!mute ') || lower.startsWith('!blokir ')) {
            let target = raw.replace(/^(?:!mute|!blokir)\s+/i, '').trim();
            if (!target) {
                return { handled: true, response: '⚠️ Format: `!mute 0812xxxxxxxx`' };
            }

            if (!target.includes('@')) {
                let cleanNum = target.replace(/\D/g, '');
                if (cleanNum.startsWith('0')) cleanNum = '62' + cleanNum.slice(1);
                target = `${cleanNum}@s.whatsapp.net`;
            }

            await this.setContactPolicy(target, 'Muted Contact', 'SILENT');
            return { handled: true, response: `🔇 *Kontak Dimatikan!*\nID: \`${target}\`\nAI tidak akan lagi merespons pesan dari orang ini (100% senyap).` };
        }

        return { handled: false };
    }
}
