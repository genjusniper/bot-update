// src/core/style/RhythmCalibrator.mjs
// Human-like chat cadence, bubble splitting, and punctuation relaxer

export class RhythmCalibrator {
    /**
     * Calibrates and formats raw text into human-like WhatsApp bubbles
     * @param {string} text - Raw generated text
     * @param {Object} options - Calibration options
     * @returns {string[]} Array of chat bubbles
     */
    static calibrateBubbles(text = '', options = {}) {
        if (!text || typeof text !== 'string') return [];

        let cleaned = text.trim();

        // 1. Remove rigid formal full stops and exclamation marks at the end of lines
        cleaned = cleaned.replace(/[.!?]+$/g, '');

        // 2. Split on explicit double newlines or natural transition points
        let bubbles = cleaned
            .split(/\n\n+|(?<=[a-z0-9])\n(?=[a-z0-9])/i)
            .map(b => b.trim())
            .filter(b => b.length > 0);

        if (bubbles.length === 0) return [];

        // 3. Clean trailing punctuation per bubble
        bubbles = bubbles.map(b => b.replace(/[.!?]+$/g, '').trim());

        // 4. Cap at maximum 2 bubbles for natural mobile WhatsApp rhythm
        if (bubbles.length > 2) {
            bubbles = [bubbles[0], bubbles.slice(1).join(' ')];
        }

        return bubbles;
    }

    /**
     * Normalizes laughter patterns to prevent artificial repetitiveness
     * @param {string} text 
     * @returns {string} Normalized text
     */
    static normalizeLaughter(text = '') {
        if (!text) return '';
        // Clamp excessive wkwkwkwk to natural wkwk
        return text
            .replace(/w+k+w+k+[wk]*/gi, 'wkwk')
            .replace(/h+a+h+a+[ha]*/gi, 'haha');
    }
}
