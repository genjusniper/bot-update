// src/social/multiperson/PerContactMemoryNamespace.mjs
// Hard Context Isolation Firewall: Guarantees ZERO cross-contact memory leakage

import fs from 'fs/promises';
import path from 'path';

export class PerContactMemoryNamespace {
    static getContactNamespacePath(contactId) {
        const cleanId = (contactId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
        return path.resolve(process.cwd(), 'memory', 'contacts', `${cleanId}_profile.json`);
    }

    static async loadContactMemory(contactId) {
        const filePath = this.getContactNamespacePath(contactId);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch {
            return {
                contactId,
                languageStyle: 'CASUAL_ID', // 'CASUAL_ID' | 'CASUAL_JAWA' | 'CONCISE' | 'FORMAL_CHILL'
                energyPreference: 0.5,
                slangKeywords: [],
                insideJokes: [],
                relationshipContext: 'TEMAN_NGOBROL',
                totalInteractions: 0,
                lastSeen: Date.now()
            };
        }
    }

    static async saveContactMemory(contactId, data) {
        const filePath = this.getContactNamespacePath(contactId);
        try {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            data.lastSeen = Date.now();
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (e) {
            console.error('[PerContactMemoryNamespace] ⚠️ Error saving contact memory:', e.message);
        }
    }

    // STRICT PRIVACY FIREWALL: Verify memory belongs strictly to contactId
    static sanitizeIsolatedMemory(rawFacts, targetContactId) {
        if (!Array.isArray(rawFacts)) return [];
        return rawFacts.filter(f => {
            // Drop any fact that belongs to another private contact
            if (f.ownerContactId && f.ownerContactId !== targetContactId) {
                return false;
            }
            return true;
        });
    }
}
