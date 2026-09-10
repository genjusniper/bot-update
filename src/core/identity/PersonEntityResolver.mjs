// src/core/identity/PersonEntityResolver.mjs
// Contextual disambiguation of third-party mentions inside conversation messages

import { ContactRegistry } from './ContactRegistry.mjs';
import { AliasResolver } from './AliasResolver.mjs';

export class PersonEntityResolver {
    /**
     * Extracts person entity mentions from conversation text
     * @param {string} text 
     * @returns {Object[]} Extracted person mentions with confidence
     */
    static extractMentions(text = '') {
        if (!text) return [];

        const words = String(text).split(/[\s,.!?;:()"]+/).filter(Boolean);
        const contacts = ContactRegistry.listAll();
        const extracted = [];
        const seenPersonIds = new Set();

        // Scan multi-word and single-word tokens
        const fullTextLower = text.toLowerCase();

        for (const contact of contacts) {
            // Skip ARKA itself from being treated as third-party mention
            if (contact.personId === 'person_arka') continue;

            for (const alias of contact.aliases) {
                // Word-boundary regex check
                const pattern = new RegExp(`\\b${alias.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
                if (pattern.test(fullTextLower)) {
                    if (!seenPersonIds.has(contact.personId)) {
                        seenPersonIds.add(contact.personId);
                        extracted.push({
                            personId: contact.personId,
                            canonicalName: contact.canonicalName,
                            matchedMention: alias,
                            relationshipTier: contact.relationshipTier,
                            confidence: contact.confidence || 0.85
                        });
                    }
                    break;
                }
            }
        }

        return extracted;
    }
}
