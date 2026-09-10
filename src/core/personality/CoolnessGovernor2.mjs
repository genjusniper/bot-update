// src/core/personality/CoolnessGovernor2.mjs
// Personality Engine 2.0 & Coolness Governor
// Strips sycophancy, clamps essay verbosity, injects deadpan cool demeanor and dialect

import { CommunicationDNA } from './CommunicationDNA.mjs';

export class CoolnessGovernor2 {
    constructor(options = {}) {
        this.dna = options.dna || CommunicationDNA;
        
        // Sycophantic cliches and obsequious openers/closers
        this.sycophancyPatterns = [
            /^(halo|hai|selamat pagi|selamat siang|selamat sore|selamat malam)\s*(kak|kakak|gan|sis|bos|om|bang|bro|sahabat)?[,!.]*\s*/i,
            /^(tentu saja|dengan senang hati|siap laksanakan|pasti bisa|tentu)[,!.]*\s*/i,
            /sebagai (asisten virtual|asisten ai|model ai|model bahasa|ai yang cerdas)[,.]*\s*/gi,
            /(apakah )?ada (hal )?lain yang bisa saya bantu(\??|!*)/gi,
            /ada yang perlu dibantu lagi(\??|!*)/gi,
            /jangan ragu untuk (bertanya|menghubungi saya)( lagi)?[!.]*/gi,
            /semoga (informasi ini )?(dapat )?membantu( ya)?[!.]*/gi,
            /semoga harimu menyenangkan[!.]*/gi,
            /terima kasih telah bertanya[!.]*/gi,
            /mohon maaf sebesar-besarnya atas ketidaknyamanan.*?[.!\n]/gi,
            /mohon maaf atas ketidaknyamanan.*?[.!\n]/gi
        ];

        // Redundant robotic introductions
        this.preamblePatterns = [
            /^berikut adalah (ringkasan|penjelasan|informasi|analisis|langkah-langkah)( mengenai| tentang)?[^:\n]*[:\n]\s*/i,
            /^berikut ringkasannya[:\n]\s*/i,
            /^berdasarkan (analisis|informasi|data|pertanyaan) (saya|di atas)[:\n]?\s*/i,
            /^saya akan menjelaskan (mengenai|tentang)[^:\n]*[:\n]\s*/i
        ];
    }

    /**
     * Strips sycophancy and robotic bot boilerplate
     * @param {string} text 
     * @returns {{ cleanedText: string, strippedCount: number }}
     */
    stripSycophancy(text = '') {
        if (typeof text !== 'string' || !text.trim()) {
            return { cleanedText: text, strippedCount: 0 };
        }

        let cleaned = text;
        let strippedCount = 0;

        for (const pattern of this.sycophancyPatterns) {
            if (pattern.test(cleaned)) {
                cleaned = cleaned.replace(pattern, '').trim();
                strippedCount++;
            }
        }

        for (const pattern of this.preamblePatterns) {
            if (pattern.test(cleaned)) {
                cleaned = cleaned.replace(pattern, '').trim();
                strippedCount++;
            }
        }

        // Clean up excessive exclamation marks
        cleaned = cleaned.replace(/!{2,}/g, '.');

        return { cleanedText: cleaned.trim(), strippedCount };
    }

    /**
     * Clamps text length according to cadence target
     * @param {string} text 
     * @param {string} cadence 'ULTRA_CONCISE' | 'CONCISE' | 'BALANCED' | 'DETAILED'
     * @returns {{ text: string, trimmed: boolean, words: number }}
     */
    clampCadence(text = '', cadence = 'CONCISE') {
        if (!text || typeof text !== 'string') {
            return { text: '', trimmed: false, words: 0 };
        }

        // If it's a code block or contains code blocks, do not mutilate code
        if (text.includes('```')) {
            const wordCount = text.split(/\s+/).filter(Boolean).length;
            return { text, trimmed: false, words: wordCount };
        }

        const limits = {
            'ULTRA_CONCISE': { maxWords: 25, maxSentences: 2 },
            'CONCISE': { maxWords: 50, maxSentences: 3 },
            'BALANCED': { maxWords: 120, maxSentences: 7 },
            'DETAILED': { maxWords: 350, maxSentences: 20 }
        };

        const config = limits[cadence] || limits['CONCISE'];
        const words = text.split(/\s+/).filter(Boolean);

        if (words.length <= config.maxWords) {
            return { text, trimmed: false, words: words.length };
        }

        // Split by sentences while keeping punctuation
        const sentenceRegex = /[^.!?]+[.!?]+/g;
        const matchedSentences = text.match(sentenceRegex) || [text];

        let accumulated = [];
        let accumulatedWords = 0;

        for (const s of matchedSentences) {
            const sWords = s.split(/\s+/).filter(Boolean);
            if (accumulated.length < config.maxSentences && (accumulatedWords + sWords.length) <= (config.maxWords + 5)) {
                accumulated.push(s.trim());
                accumulatedWords += sWords.length;
            } else {
                break;
            }
        }

        let result = accumulated.join(' ');
        if (!result) {
            result = words.slice(0, config.maxWords).join(' ') + '...';
        }

        return {
            text: result.trim(),
            trimmed: true,
            words: result.split(/\s+/).filter(Boolean).length
        };
    }

    /**
     * Applies dialect styling based on user profile and relationship
     * @param {string} text 
     * @param {string} dialect 'SEMARANGAN' | 'JAKSEL' | 'CASUAL_INDONESIAN' | 'FORMAL'
     * @param {string} relationshipTier 
     * @returns {{ text: string, appliedDialect: string }}
     */
    applyDialect(text = '', dialect = 'CASUAL_INDONESIAN', relationshipTier = 'ACQUAINTANCE') {
        if (!text || typeof text !== 'string') return { text: '', appliedDialect: dialect };

        // Formal clients do not get dialect slang
        if (relationshipTier === 'CLIENT_VIP' || relationshipTier === 'CUSTOMER' || dialect === 'FORMAL') {
            return { text, appliedDialect: 'FORMAL' };
        }

        let modified = text;

        if (dialect === 'SEMARANGAN') {
            const semarangReplacements = [
                { reg: /\bbagaimana\b/gi, rep: 'piye' },
                { reg: /\bgimana\b/gi, rep: 'piye' },
                { reg: /\bkenapa\b/gi, rep: 'ngopo' },
                { reg: /\bmengapa\b/gi, rep: 'ngopo' },
                { reg: /\bbegitu\b/gi, rep: 'ngono' },
                { reg: /\bsangat\b/gi, rep: 'nemen' },
                { reg: /\bbanget\b/gi, rep: 'nemen' },
                { reg: /\btidak mau\b/gi, rep: 'emoh' }
            ];
            for (const r of semarangReplacements) {
                modified = modified.replace(r.reg, r.rep);
            }
        } else if (dialect === 'JAKSEL') {
            const jakselReplacements = [
                { reg: /\bsebenarnya\b/gi, rep: 'basically' },
                { reg: /\bjujur saja\b/gi, rep: 'honestly' },
                { reg: /\bmenurut saya\b/gi, rep: 'in my opinion' },
                { reg: /\bsangat bagus\b/gi, rep: 'worth it banget' },
                { reg: /\bbisa dipahami\b/gi, rep: 'make sense' }
            ];
            for (const r of jakselReplacements) {
                modified = modified.replace(r.reg, r.rep);
            }
        } else {
            // Casual Indonesian default
            const casualReplacements = [
                { reg: /\btidak\b/gi, rep: 'nggak' },
                { reg: /\btak\b/gi, rep: 'nggak' },
                { reg: /\bsudah\b/gi, rep: 'udah' },
                { reg: /\bhanya\b/gi, rep: 'cuma' },
                { reg: /\bsaja\b/gi, rep: 'aja' },
                { reg: /\btetapi\b/gi, rep: 'tapi' }
            ];
            for (const r of casualReplacements) {
                modified = modified.replace(r.reg, r.rep);
            }
        }

        return { text: modified, appliedDialect: dialect };
    }

    /**
     * Deadpan modulation: removes overly emotional excitement
     * @param {string} text 
     * @returns {string}
     */
    applyDeadpanCoolness(text = '') {
        if (!text) return '';
        let cool = text;

        // Strip exclamation hype
        cool = cool.replace(/!{1,}/g, '.');

        // Replace robotic hype phrases
        cool = cool.replace(/\b(luar biasa|sangat hebat|sungguh mengagumkan)\b/gi, 'mantap');
        cool = cool.replace(/\b(wah keren sekali)\b/gi, 'oke');

        // Smooth lowercase if first word isn't acronym/command
        if (!cool.startsWith('/') && !cool.startsWith('http') && !cool.includes('```')) {
            if (cool.length < 80) {
                cool = cool.charAt(0).toLowerCase() + cool.slice(1);
            }
        }

        return cool;
    }

    /**
     * Master governance pipeline
     * @param {string} candidateText 
     * @param {Object} context 
     * @returns {Object} Governed response and telemetry
     */
    govern(candidateText = '', context = {}) {
        const {
            dialect = 'CASUAL_INDONESIAN',
            relationshipTier = 'ACQUAINTANCE',
            cadence = 'CONCISE'
        } = context;

        // 1. Strip sycophancy
        const { cleanedText, strippedCount } = this.stripSycophancy(candidateText);

        // 2. Clamp cadence
        const { text: clampedText, trimmed, words } = this.clampCadence(cleanedText, cadence);

        // 3. Apply dialect
        const { text: dialectText, appliedDialect } = this.applyDialect(clampedText, dialect, relationshipTier);

        // 4. Deadpan & cool demeanor
        let finalOutput = this.applyDeadpanCoolness(dialectText);

        // Calculate coolness score: high brevity, zero sycophancy, calm tone
        let coolnessScore = 0.85;
        if (strippedCount > 0) coolnessScore += 0.05;
        if (words <= 25) coolnessScore += 0.08;
        if (finalOutput.endsWith('.')) coolnessScore += 0.02;
        coolnessScore = Math.min(1.0, coolnessScore);

        return {
            governedText: finalOutput,
            metrics: {
                originalLength: candidateText.length,
                governedLength: finalOutput.length,
                wordCount: words,
                sycophancyRemoved: strippedCount,
                cadenceClamped: trimmed,
                appliedDialect,
                coolnessScore: parseFloat(coolnessScore.toFixed(2))
            }
        };
    }
}

export const coolnessGovernor2 = new CoolnessGovernor2();
