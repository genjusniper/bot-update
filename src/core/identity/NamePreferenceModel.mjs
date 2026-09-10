// src/core/identity/NamePreferenceModel.mjs
// Determines reciprocal address etiquette: How ARKA addresses them, and how they address Mas Agus

export class NamePreferenceModel {
    /**
     * Resolves how ARKA should address this contact
     * @param {Object} contact 
     * @param {string} [relationshipTier='STRANGER']
     * @returns {{ callName: string, honorific: string, etiquette: string }}
     */
    static resolveAddressForm(contact = null, relationshipTier = 'STRANGER') {
        if (!contact) {
            return {
                callName: '',
                honorific: 'Bro',
                etiquette: 'CASUAL_UNKNOWN'
            };
        }

        const tier = contact.relationshipTier || relationshipTier;
        const honorific = contact.preferredHonorific && contact.preferredHonorific !== 'None'
            ? contact.preferredHonorific
            : '';

        let callName = contact.canonicalName;
        // If they have a preferred short alias, use it
        if (contact.aliases && contact.aliases.length > 0) {
            const shortAlias = contact.aliases.find(a => a.length >= 3 && a.length <= 8);
            if (shortAlias) {
                callName = shortAlias.charAt(0).toUpperCase() + shortAlias.slice(1);
            }
        }

        if (tier === 'OWNER') {
            return {
                callName: 'Mas Agus',
                honorific: 'Mas',
                etiquette: 'REVERENT_TWIN'
            };
        }

        if (tier === 'CLOSE_FRIEND') {
            return {
                callName: honorific ? `${honorific} ${callName}`.trim() : callName,
                honorific: honorific || 'None',
                etiquette: 'WARM_CASUAL'
            };
        }

        if (tier === 'COLLEAGUE' || tier === 'CLIENT_VIP') {
            const prefix = honorific || 'Pak';
            return {
                callName: `${prefix} ${callName}`.trim(),
                honorific: prefix,
                etiquette: 'PROFESSIONAL_RESPECTFUL'
            };
        }

        return {
            callName: honorific ? `${honorific} ${callName}`.trim() : callName,
            honorific: honorific || '',
            etiquette: 'POLITE_NEUTRAL'
        };
    }

    /**
     * What this contact calls Mas Agus / ARKA
     * @param {Object} contact 
     * @returns {string}
     */
    static getHowTheyAddressMe(contact = null) {
        if (!contact) return 'Mas Agus';
        return contact.preferredAddressByThem || 'Mas Agus';
    }
}
