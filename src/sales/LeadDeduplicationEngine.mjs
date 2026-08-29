// src/sales/LeadDeduplicationEngine.mjs
// Mencegah duplikasi lead masuk ke CRM untuk menghindari spam ke bisnis yang sama

import { LeadCRM } from './LeadCRM.mjs';

export class LeadDeduplicationEngine {
    
    /**
     * Memeriksa apakah lead baru berpotensi duplikat dengan yang sudah ada.
     * @param {Object} newLead - { phone, businessName, location }
     * @returns {Object} { isDuplicate: boolean, reason: string, existingPhone: string }
     */
    static check(newLead) {
        if (!newLead || !newLead.phone) return { isDuplicate: false };

        const allLeads = LeadCRM.getByStatus(null);
        const digits = newLead.phone.replace(/\D/g, '');

        for (const existing of allLeads) {
            // 1. Exact Phone Match
            const exDigits = (existing.phone || '').replace(/\D/g, '');
            if (digits && exDigits && digits === exDigits) {
                return { isDuplicate: true, reason: 'EXACT_PHONE_MATCH', existingPhone: existing.phone };
            }

            // 2. Exact Website Match
            if (existing.publicLinks?.length > 0 && newLead.publicLinks?.length > 0) {
                const exWebs = existing.publicLinks.map(l => l.toLowerCase().replace(/https?:\/\/(www\.)?/, ''));
                const newWebs = newLead.publicLinks.map(l => l.toLowerCase().replace(/https?:\/\/(www\.)?/, ''));
                if (exWebs.some(w => newWebs.includes(w))) {
                    return { isDuplicate: true, reason: 'WEBSITE_MATCH', existingPhone: existing.phone };
                }
            }

            // 3. Exact Address Match (jika ada)
            if (existing.address && newLead.address) {
                if (existing.address.trim().toLowerCase() === newLead.address.trim().toLowerCase()) {
                    return { isDuplicate: true, reason: 'ADDRESS_MATCH', existingPhone: existing.phone };
                }
            }

            // 4. Name & Location Match
            if (existing.businessName && newLead.businessName) {
                const exName = existing.businessName.trim().toLowerCase();
                const newName = newLead.businessName.trim().toLowerCase();
                
                if (exName === newName && existing.location === newLead.location) {
                    return { isDuplicate: true, reason: 'EXACT_NAME_LOCATION_MATCH', existingPhone: existing.phone };
                }
                
                // 5. Fuzzy Name Match (contoh: "Warung Padang Sederhana" vs "RM Padang Sederhana")
                if (exName.length > 5 && newName.length > 5) {
                    const sim = this._calculateSimilarity(exName, newName);
                    if (sim > 0.80 && existing.location === newLead.location) {
                        return { isDuplicate: true, reason: 'FUZZY_NAME_MATCH', existingPhone: existing.phone };
                    }
                }
            }
        }

        return { isDuplicate: false };
    }

    // Levenshtein / Jaccard sederhana
    static _calculateSimilarity(str1, str2) {
        const set1 = new Set(str1.split(' '));
        const set2 = new Set(str2.split(' '));
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return intersection.size / union.size;
    }
}
