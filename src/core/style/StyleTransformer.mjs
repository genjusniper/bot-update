// src/core/style/StyleTransformer.mjs
// Post-generation transformer stripping robot fluff, corporate apologies, and enforcing persona purity

import { RhythmCalibrator } from './RhythmCalibrator.mjs';

export class StyleTransformer {
    static ROBOT_PHRASES = Object.freeze([
        /sebagai (model bahasa|asisten)?\s*ai[,.!]*\s*/gi,
        /sebagai model bahasa[,.!]*\s*/gi,
        /sebagai asisten ai[,.!]*\s*/gi,
        /sebagai asisten[,.!]*\s*/gi,
        /sebagai ai[,.!]*\s*/gi,
        /saya siap membantu[,.!]*\s*/gi,
        /siap membantu[,.!]*\s*/gi,
        /mohon maaf atas ketidaknyamanan[,.!]*\s*/gi,
        /ada yang bisa (saya|aku) bantu\??/gi,
        /apakah ada hal lain yang ingin anda tanyakan\??/gi,
        /semoga harimu menyenangkan[,.!]*\s*/gi,
        /^(tentu saja|tentu|baik)[,!.]*\s*/gim
    ]);

    /**
     * Cleans and transforms text through the Mas Agus authenticity filter
     * @param {string} text - Raw AI output
     * @param {Object} [contract={}] - PersonalContextContract
     * @returns {Object} Transformed output { bubbles: string[], fullText: string }
     */
    static transform(text = '', contract = {}) {
        if (!text || typeof text !== 'string') {
            return { bubbles: [], fullText: '' };
        }

        let cleaned = text.trim();

        // 1. Strip robotic prefixes and boilerplate
        for (const pattern of this.ROBOT_PHRASES) {
            cleaned = cleaned.replace(pattern, '').trim();
        }

        // Clean dangling leading commas or excessive horizontal whitespace per line
        cleaned = cleaned.replace(/^[,\s]+/gm, '').replace(/[ \t]{2,}/g, ' ').trim();

        // 2. Strip AI markdown headers if leaked
        cleaned = cleaned.replace(/^#+\s+.*$/gm, '').trim();

        // 3. Normalize laughter
        cleaned = RhythmCalibrator.normalizeLaughter(cleaned);

        // 4. Calibrate into natural chat bubbles
        const bubbles = RhythmCalibrator.calibrateBubbles(cleaned);

        return {
            bubbles,
            fullText: bubbles.join('\n'),
            bubbleCount: bubbles.length
        };
    }
}
