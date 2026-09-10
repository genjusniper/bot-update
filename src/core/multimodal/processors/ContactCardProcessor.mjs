// src/core/multimodal/processors/ContactCardProcessor.mjs
// Contact Card (vCard) Intelligence: VCF parsing and Identity Entity Resolution

export class ContactCardProcessor {
    /**
     * Processes shared contact card
     * @param {Object} params
     * @param {string} params.displayName
     * @param {string} [params.vcard='']
     * @param {string} [params.phoneNumber='']
     * @returns {Object} Contact Card Analysis
     */
    static process({ displayName = '', vcard = '', phoneNumber = '' }) {
        let phone = phoneNumber;
        if (!phone && vcard) {
            const match = vcard.match(/waid=(\d+)/i) || vcard.match(/TEL.*:(\+?\d+)/i);
            if (match) phone = match[1];
        }

        const name = displayName || 'Shared Contact';
        return {
            modality: 'CONTACT',
            contactName: name,
            phoneNumber: phone,
            extractedText: `Kontak Dibagikan: ${name} (${phone || 'Nomor tidak terlampir'})`,
            personEntity: {
                id: phone ? `${phone}@s.whatsapp.net` : `contact_${name.toLowerCase().replace(/\s+/g, '_')}`,
                canonicalName: name,
                type: 'PERSON'
            },
            isUnderstood: true
        };
    }
}
