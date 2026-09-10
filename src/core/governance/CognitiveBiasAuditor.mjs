// src/core/governance/CognitiveBiasAuditor.mjs
// Cognitive Bias & Fairness Auditor
// Detects epistemic arrogance, anchoring, confirmation bias, and false dichotomies in reasoning and response drafts

export class CognitiveBiasAuditor {
    constructor() {
        this.biasPatterns = [
            {
                type: 'EPISTEMIC_ARROGANCE',
                pattern: /(?:\bpasti 100%|\btanpa keraguan sedikitpun\b|\bsudah pasti mutlak\b|\bdijamin pasti\b|\btidak mungkin salah\b)/gi,
                remedy: 'Softens unwarranted certainty with epistemic modesty.'
            },
            {
                type: 'FALSE_DICHOTOMY',
                pattern: /\b(hanya ada dua pilihan|kalau bukan.*pasti.*|pilihannya cuma.*atau.*)\b/gi,
                remedy: 'Introduces nuanced third-path alternatives.'
            },
            {
                type: 'HASTY_GENERALIZATION',
                pattern: /\b(semua orang selalu|seluruh sistem pasti rusak|tidak pernah ada yang berhasil)\b/gi,
                remedy: 'Frames claims with specific context rather than sweeping absolutes.'
            },
            {
                type: 'SYCOPHANTIC_CONFIRMATION',
                pattern: /\b(anda benar sekali tanpa cela|apapun kata anda selalu benar)\b/gi,
                remedy: 'Ensures objective grounding over subservient flattery.'
            }
        ];
    }

    /**
     * Audits reasoning trace or candidate response for cognitive biases and fallacies
     * @param {string} text 
     * @param {Object} [context={}] 
     * @returns {{ passesAudit: boolean, biasScore: number, detectedBiases: Array<Object>, recommendations: string[], correctedDraft: string }}
     */
    auditDraft(text = '', context = {}) {
        if (!text || typeof text !== 'string') {
            return {
                passesAudit: true,
                biasScore: 0.0,
                detectedBiases: [],
                recommendations: [],
                correctedDraft: ''
            };
        }

        const detected = [];
        let corrected = text;

        for (const b of this.biasPatterns) {
            b.pattern.lastIndex = 0;
            if (b.pattern.test(text)) {
                detected.push({
                    type: b.type,
                    remedy: b.remedy
                });

                // Auto-correct unwarranted arrogance
                if (b.type === 'EPISTEMIC_ARROGANCE') {
                    corrected = corrected.replace(/(?:\bpasti 100%|\btanpa keraguan sedikitpun\b|\bsudah pasti mutlak\b)/gi, 'kemungkinan besar');
                }
            }
        }

        const biasScore = parseFloat((detected.length * 0.25).toFixed(2));
        const passesAudit = detected.length <= 1; // Passes if minimal or zero severe biases

        return {
            passesAudit,
            biasScore: Math.min(1.0, biasScore),
            detectedBiases: detected,
            recommendations: detected.map(d => d.remedy),
            correctedDraft: corrected
        };
    }
}

export const cognitiveBiasAuditor = new CognitiveBiasAuditor();
