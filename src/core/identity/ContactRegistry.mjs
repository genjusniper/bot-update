// src/core/identity/ContactRegistry.mjs
// Central Registry for Person Identities, Profiles, and Relationship Mapping

export class ContactRegistry {
    static #contacts = new Map();
    static #jidIndex = new Map();
    static #phoneIndex = new Map();
    static #aliasIndex = new Map();
    static #initialized = false;

    static #initDefaults() {
        if (this.#initialized) return;
        this.#initialized = true;

        // Foundational personas
        this.registerContact({
            personId: 'person_agus',
            canonicalName: 'Agus Salim',
            whatsappJid: 'owner@s.whatsapp.net',
            phone: '628123456789',
            relationshipTier: 'OWNER',
            role: 'Principal Developer & System Architect',
            aliases: ['agus', 'salim', 'mas agus', 'gus', 'bos', 'pak agus'],
            preferredHonorific: 'Mas',
            preferredAddressByThem: 'Mas Agus',
            confidence: 1.0,
            isVerified: true,
            notes: 'System Owner and Master Persona'
        });

        this.registerContact({
            personId: 'person_arka',
            canonicalName: 'Salim',
            whatsappJid: 'arka@s.whatsapp.net',
            phone: null,
            relationshipTier: 'OWNER',
            role: 'Personal Agent OS Digital Twin',
            aliases: ['salim', 'agus', 'arka', 'bot', 'asisten', 'twin'],
            preferredHonorific: 'None',
            preferredAddressByThem: 'Salim',
            confidence: 1.0,
            isVerified: true,
            notes: 'Digital Twin Persona'
        });

        this.#initialized = true;
    }

    /**
     * Registers or updates a contact profile
     * @param {Object} contact 
     * @returns {Object} Normalized contact
     */
    static registerContact(contact = {}) {
        this.#initDefaults();
        if (!contact.personId || !contact.canonicalName) {
            throw new Error('Contact must have at least personId and canonicalName');
        }

        const normalized = {
            personId: String(contact.personId),
            canonicalName: String(contact.canonicalName),
            whatsappJid: contact.whatsappJid ? String(contact.whatsappJid).toLowerCase() : null,
            phone: contact.phone ? String(contact.phone).replace(/[^\d+]/g, '') : null,
            relationshipTier: contact.relationshipTier || 'CASUAL',
            role: contact.role || 'Contact',
            aliases: Array.isArray(contact.aliases) 
                ? [...new Set(contact.aliases.map(a => String(a).toLowerCase().trim()))]
                : [contact.canonicalName.toLowerCase()],
            preferredHonorific: contact.preferredHonorific || 'None',
            preferredAddressByThem: contact.preferredAddressByThem || 'Mas Agus',
            confidence: typeof contact.confidence === 'number' ? contact.confidence : 0.8,
            isVerified: Boolean(contact.isVerified),
            notes: contact.notes || '',
            updatedAt: Date.now()
        };

        const canonLower = normalized.canonicalName.toLowerCase();
        if (!normalized.aliases.includes(canonLower)) {
            normalized.aliases.push(canonLower);
        }

        this.#contacts.set(normalized.personId, normalized);

        if (normalized.whatsappJid) {
            this.#jidIndex.set(normalized.whatsappJid, normalized.personId);
        }

        if (normalized.phone) {
            const cleanPhone = normalized.phone.replace(/[^\d]/g, '');
            this.#phoneIndex.set(cleanPhone, normalized.personId);
        }

        for (const alias of normalized.aliases) {
            this.#aliasIndex.set(alias, normalized.personId);
        }

        return normalized;
    }

    /**
     * Resolves a contact by JID, phone, personId, or alias
     * @param {string} identifier 
     * @returns {Object|null}
     */
    static getContact(identifier) {
        this.#initDefaults();
        if (!identifier) return null;

        const str = String(identifier).trim().toLowerCase();

        // 1. Exact personId
        if (this.#contacts.has(str)) {
            return this.#contacts.get(str);
        }

        // 2. Exact JID
        if (this.#jidIndex.has(str)) {
            const id = this.#jidIndex.get(str);
            return this.#contacts.get(id) || null;
        }

        // 3. Clean Phone
        const digits = str.replace(/[^\d]/g, '');
        if (digits.length >= 8 && this.#phoneIndex.has(digits)) {
            const id = this.#phoneIndex.get(digits);
            return this.#contacts.get(id) || null;
        }

        // 4. Exact Alias
        if (this.#aliasIndex.has(str)) {
            const id = this.#aliasIndex.get(str);
            return this.#contacts.get(id) || null;
        }

        return null;
    }

    /**
     * Lists all registered contacts
     * @returns {Object[]}
     */
    static listAll() {
        this.#initDefaults();
        return Array.from(this.#contacts.values());
    }

    /**
     * Resets registry for testing
     */
    static reset() {
        this.#contacts.clear();
        this.#jidIndex.clear();
        this.#phoneIndex.clear();
        this.#aliasIndex.clear();
        this.#initialized = false;
    }
}
