// src/core/interaction/DynamicTextureEngine.mjs
// Contextual Humor & Dynamic WhatsApp Texture
// Computes typing delay, recommends native WhatsApp reactions, formats multi-bubble bursts, and contextual dry humor

import { HumorBudgetEngine } from './HumorBudgetEngine.mjs';
import { TypingBehaviorEngine } from './TypingBehaviorEngine.mjs';

export class DynamicTextureEngine {
    constructor(options = {}) {
        this.humorBudget = options.humorBudget || HumorBudgetEngine;
        this.typingBehavior = options.typingBehavior || TypingBehaviorEngine;

        this.humorCatalog = {
            TECH_FATIGUE: [
                'server juga butuh napas bro.',
                'restart dulu biar nggak pusing kodingan lu.',
                'bug itu fitur yang belum siap mental.'
            ],
            OVERTHINKING: [
                'santai, jangan overthinking.',
                'tarik napas dulu, dunia belum kiamat.',
                'tenang aja, nggak bakal meledak.'
            ],
            LATE_NIGHT: [
                'tidur sono, besok kerja.',
                'begadang mulu, besok tepar lu.',
                'jam segini masih ngoding, luar biasa.'
            ],
            DEFAULT_DEADPAN: [
                'aman, terkendali.',
                'beres, tinggal ngopi.',
                'gitu doang kok repot.'
            ]
        };
    }

    /**
     * Computes human-realistic WhatsApp typing delay based on text length and complexity
     * @param {string} text 
     * @param {Object} options 
     * @returns {number} Delay in milliseconds (clamped between 350ms and 3500ms)
     */
    computeTypingDelay(text = '', options = {}) {
        if (!text || typeof text !== 'string') return 350;

        const charCount = text.length;
        const words = text.split(/\s+/).filter(Boolean).length;
        const depth = options.depth || 'FAST'; // FAST | DEEP | CODE

        // Base typing speed ~ 45 ms per char, with small jitter
        let baseDelay = charCount * 38;

        if (depth === 'DEEP') {
            baseDelay += 500; // Simulated thinking pause
        } else if (depth === 'CODE') {
            baseDelay += 750;
        }

        // Clamp to prevent annoying WhatsApp lag
        const minDelay = options.minDelay || 400;
        const maxDelay = options.maxDelay || 3200;

        return Math.max(minDelay, Math.min(maxDelay, Math.round(baseDelay)));
    }

    /**
     * Recommends contextual WhatsApp emoji reaction based on content & sentiment
     * @param {string} text 
     * @param {Object} context 
     * @returns {{ emoji: string, confidence: number } | null}
     */
    recommendReaction(text = '', context = {}) {
        if (!text || typeof text !== 'string') return null;

        const lower = text.toLowerCase();

        if (/\b(berhasil|sukses|selesai|done|beres|mantap|siap|aman)\b/i.test(lower)) {
            return { emoji: '👍', confidence: 0.9 };
        }
        if (/\b(ngopi|kopi|lelah|capek|rehat|istirahat)\b/i.test(lower)) {
            return { emoji: '☕', confidence: 0.85 };
        }
        if (/\b(gacor|keren|juara|gg|fire|api|top)\b/i.test(lower)) {
            return { emoji: '🔥', confidence: 0.88 };
        }
        if (/\b(cek|periksa|pantau|lihat|inspect|investigasi)\b/i.test(lower)) {
            return { emoji: '👀', confidence: 0.8 };
        }
        if (/\b(lapor|hormat|siap komandan|patuh)\b/i.test(lower)) {
            return { emoji: '🫡', confidence: 0.92 };
        }
        if (/\b(aneh|random|gajelas|absurd|maksudnya)\b/i.test(lower)) {
            return { emoji: '🗿', confidence: 0.75 };
        }

        return null;
    }

    /**
     * Retrieves contextual dry humor line if budget allows
     * @param {string} category 
     * @param {Object} context 
     * @returns {{ humorLine: string | null, consumed: boolean }}
     */
    getContextualHumor(category = 'DEFAULT_DEADPAN', context = {}) {
        const { chatId = 'default', humorStyle = 'DEADPAN', interactionMode = 'Casual' } = context;
        
        const evaluation = this.humorBudget.evaluate({
            chatId,
            humorStyle,
            interactionMode,
            consume: true
        });

        if (!evaluation.canJoke) {
            return { humorLine: null, consumed: false };
        }

        const pool = this.humorCatalog[category] || this.humorCatalog.DEFAULT_DEADPAN;
        const index = Math.floor(Math.random() * pool.length);

        return {
            humorLine: pool[index],
            consumed: true
        };
    }

    /**
     * Packages response into authentic multi-bubble burst if split is beneficial
     * @param {string} text 
     * @param {Object} options 
     * @returns {{ bubbles: string[], delays: number[], reaction: string | null }}
     */
    packageBubbles(text = '', options = {}) {
        if (!text || typeof text !== 'string') {
            return { bubbles: [], delays: [], reaction: null };
        }

        const reactionRec = this.recommendReaction(text, options);
        const reaction = reactionRec ? reactionRec.emoji : null;

        // Check if message should split: e.g. contains double newline or explicit transition
        const parts = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

        let bubbles = [];
        if (options.allowSplit !== false && parts.length >= 2 && parts.length <= 3 && !text.includes('```')) {
            bubbles = parts;
        } else {
            bubbles = [text.trim()];
        }

        // Apply typing texture to casual bubbles
        if (options.interactionMode !== 'Customer' && options.interactionMode !== 'Group') {
            bubbles = bubbles.map(b => this.typingBehavior.applyTexture(b, options));
        }

        const delays = bubbles.map(b => this.computeTypingDelay(b, options));

        return {
            bubbles,
            delays,
            reaction
        };
    }
}

export const dynamicTextureEngine = new DynamicTextureEngine();
