// src/core/style/DialectModel.mjs
// Authentic Semarangan Javanese dialect & vocabulary model for Mas Agus

export const DialectModel = Object.freeze({
    PARTICLES: Object.freeze(['to', 'lha', 'po', 'e', 'sik', 'wae', 'yo', 'rak', 'ndak', 'og']),
    
    COMMON_EXPRESSIONS: Object.freeze({
        'tidak apa-apa': 'ra popo',
        'tidak usah': 'rasah',
        'bagaimana': 'piye',
        'bisa': 'isoh',
        'begitu': 'ngono',
        'lagi': 'meneh',
        'sudah': 'wis',
        'belum': 'durung',
        'santai saja': 'santai wae',
        'kenapa': 'ngopo'
    }),

    AUTHENTIC_GREETINGS: Object.freeze([
        'halo mas', 'piye kabare', 'aman lur', 'oi', 'halo'
    ]),

    /**
     * Checks whether dialect injection is permitted for the given context
     * @param {string} relationshipTier 
     * @returns {boolean}
     */
    isDialectPermitted(relationshipTier = 'REGULAR_USER') {
        const tier = String(relationshipTier).toUpperCase();
        return tier === 'OWNER' || tier === 'CLOSE_FRIEND' || tier === 'FRIEND';
    }
});
