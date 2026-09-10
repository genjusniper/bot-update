// src/core/interaction/TypingBehaviorEngine.mjs
// Controlled WhatsApp typing texture: abbreviations, lowercase tendencies, and punctuation relaxer

export class TypingBehaviorEngine {
    static CASUAL_ABBREVIATIONS = Object.freeze([
        { pattern: /\byang\b/gi, replace: 'yg' },
        { pattern: /\bbanget\b/gi, replace: 'bgt' },
        { pattern: /\btapi\b/gi, replace: 'tp' },
        { pattern: /\bsudah\b/gi, replace: 'udh' },
        { pattern: /\bbisa\b/gi, replace: 'bs' },
        { pattern: /\bentar\b/gi, replace: 'bntr' }
    ]);

    /**
     * Applies casual typing texture
     * @param {string} text - Cleaned message text
     * @param {Object} options
     * @param {string} [options.interactionMode='Casual']
     * @param {boolean} [options.allowAbbreviations=true]
     * @param {boolean} [options.lowercaseOnly=true]
     * @returns {string} Text with authentic WhatsApp typing texture
     */
    static applyTexture(text = '', options = {}) {
        if (!text || typeof text !== 'string') return '';
        let result = text.trim();

        const isFormal = options.interactionMode === 'Customer' || options.interactionMode === 'Group';

        // 1. Remove rigid trailing period
        result = result.replace(/\.+$/g, '');

        // 2. Casual abbreviation (only in casual / banter modes, never customer/group)
        if (!isFormal && options.allowAbbreviations !== false) {
            // Apply sparingly (50% chance per match)
            for (const item of this.CASUAL_ABBREVIATIONS) {
                if (Math.random() > 0.5) {
                    result = result.replace(item.pattern, item.replace);
                }
            }
        }

        // 3. Lowercase first letter for casual mobile feel (unless formal)
        if (!isFormal && options.lowercaseOnly !== false && result.length > 0) {
            // Lowercase first letter of string
            result = result.charAt(0).toLowerCase() + result.slice(1);
        }

        return result;
    }
}
