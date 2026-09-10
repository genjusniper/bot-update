// src/core/identity/AliasResolver.mjs
// Fuzzy and contextual resolver mapping casual names, nicknames, and titles to canonical identities

import { ContactRegistry } from './ContactRegistry.mjs';

export class AliasResolver {
    // Standard Indonesian honorific prefixes to strip or match
    static HONORIFICS = ['mas', 'mbak', 'mba', 'pak', 'bu', 'bang', 'kak', 'om', 'tante', 'dek', 'bro', 'pakde', 'bude'];

    /**
     * Normalizes a name string by removing common honorific prefixes
     * @param {string} raw 
     * @returns {{ cleanName: string, honorific: string|null }}
     */
    static stripHonorific(raw = '') {
        if (!raw) return { cleanName: '', honorific: null };
        const tokens = String(raw).trim().split(/\s+/);
        if (tokens.length > 0) {
            const first = tokens[0].toLowerCase();
            if (this.HONORIFICS.includes(first)) {
                return {
                    honorific: first,
                    cleanName: tokens.slice(1).join(' ').trim()
                };
            }
        }
        return { cleanName: raw.trim(), honorific: null };
    }

    /**
     * Resolves a name or alias against ContactRegistry
     * @param {string} nameQuery 
     * @returns {{ contact: Object|null, matchedBy: string, confidence: number }}
     */
    static resolve(nameQuery = '') {
        if (!nameQuery) return { contact: null, matchedBy: 'NONE', confidence: 0 };

        const trimmed = String(nameQuery).trim().toLowerCase();

        // 1. Direct match in registry
        const direct = ContactRegistry.getContact(trimmed);
        if (direct) {
            return { contact: direct, matchedBy: 'EXACT', confidence: direct.confidence || 0.9 };
        }

        // 2. Honorific stripped match (e.g. "Mas Budi" -> "Budi")
        const { cleanName, honorific } = this.stripHonorific(trimmed);
        if (cleanName && cleanName !== trimmed) {
            const strippedMatch = ContactRegistry.getContact(cleanName);
            if (strippedMatch) {
                return { 
                    contact: strippedMatch, 
                    matchedBy: 'HONORIFIC_STRIPPED', 
                    confidence: (strippedMatch.confidence || 0.9) * 0.95 
                };
            }
        }

        // 3. Scan all contacts for partial alias match
        const contacts = ContactRegistry.listAll();
        for (const c of contacts) {
            for (const alias of c.aliases) {
                if (trimmed.includes(alias) || (cleanName && alias.includes(cleanName.toLowerCase()))) {
                    return {
                        contact: c,
                        matchedBy: 'PARTIAL_ALIAS',
                        confidence: (c.confidence || 0.8) * 0.85
                    };
                }
            }
        }

        return { contact: null, matchedBy: 'UNRESOLVED', confidence: 0 };
    }
}
