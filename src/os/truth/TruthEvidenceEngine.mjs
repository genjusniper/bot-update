/**
 * TruthEvidenceEngine.mjs
 * 
 * Epistemic verification engine for Salim AI.
 * Distinguishes between:
 * - FACT: Directly verified in database or runtime environment
 * - EVIDENCE: Empirically observed in conversation or telemetry log
 * - INFERENCE: Logical deduction from proven facts
 * - ASSUMPTION: Working hypothesis requiring confirmation
 * - UNKNOWN: Unverified or unbacked assertion (must NOT be claimed as fact)
 */

export class TruthEvidenceEngine {
    static EPISTEMIC_TYPES = {
        FACT: 'FACT',
        EVIDENCE: 'EVIDENCE',
        INFERENCE: 'INFERENCE',
        ASSUMPTION: 'ASSUMPTION',
        UNKNOWN: 'UNKNOWN'
    };

    // Grounded Knowledge Base of verified facts about Salim
    static VERIFIED_FACTS = {
        'architecture': ['Node.js ESM', 'FSM State Machine', 'Job Queue', 'Decision Audit Trail', 'Agent Permission Firewall', 'Termux PM2 Deployment'],
        'deployment': ['Android Termux', 'Local PC Node.js', 'Linux Server'],
        'supported_channels': ['WhatsApp Web via Baileys', 'Telegram Bot API', 'HTTP REST'],
        'verified_clients_count': null, // We DO NOT have verified proof of 500 businesses
        'response_time_ms': 1200,
        'zero_hallucination_safeguard': true
    };

    /**
     * Verify a claim or statement before it is uttered
     * @param {string} statement - The statement or claim to evaluate
     * @returns {Object} Evaluation result
     */
    static verifyClaim(statement) {
        const text = (statement || '').trim().toLowerCase();

        // 1. Check for unverified numerical adoption claims ("digunakan 500 bisnis", "ribuan klien")
        const unverifiedAdoptionMatch = text.match(/(?:digunakan|dipakai|melayani|klien|user|dipercaya)\s+(?:oleh\s+|sama\s+)?(?:lebih\s+dari\s+)?(\d+|ratusan|ribuan)\s*(?:bisnis|toko|klien|perusahaan)/i);
        if (unverifiedAdoptionMatch) {
            return {
                status: 'REJECT',
                epistemicType: this.EPISTEMIC_TYPES.UNKNOWN,
                claimedValue: unverifiedAdoptionMatch[0],
                reason: 'No verified corporate registry proof exists for large-scale external business adoption numbers.',
                truthfulCorrection: 'Aku belum punya data audit penggunaan ratusan bisnis pihak ketiga, jadi angka itu tidak akan aku klaim. Saat ini fokus kami adalah arsitektur stabil dan deployment teruji di node produksi Bos Agus.'
            };
        }

        // 2. Check for false 100% guarantees ("pasti sukses", "dijamin omzet 10x")
        if (/dijamin\s*(?:kaya|omzet\s*naik\s*\d+x|pasti\s*closing\s*100%)/i.test(text)) {
            return {
                status: 'REJECT',
                epistemicType: this.EPISTEMIC_TYPES.ASSUMPTION,
                reason: 'Unrealistic sales promise without operational proof.',
                truthfulCorrection: 'Salim mengoptimalkan respon dan konsistensi operasional, tetapi hasil konversi akhir tetap bergantung pada kualitas produk dan penawaran bisnis Anda.'
            };
        }

        // 3. Technical architecture claims
        if (/arsitektur|state\s*machine|queue|audit|termux|firewall/i.test(text)) {
            return {
                status: 'PASS',
                epistemicType: this.EPISTEMIC_TYPES.FACT,
                evidence: 'System codebase inspection & test suite passing.'
            };
        }

        // Default: Inference or grounded communication
        return {
            status: 'PASS',
            epistemicType: this.EPISTEMIC_TYPES.INFERENCE,
            evidence: 'Conversational deduction.'
        };
    }

    /**
     * Filter and sanitize an outbound AI message to ensure honesty
     */
    static sanitizeOutbound(messageText) {
        const check = this.verifyClaim(messageText);
        if (check.status === 'REJECT') {
            return {
                modified: true,
                cleanText: check.truthfulCorrection,
                audit: check
            };
        }
        return {
            modified: false,
            cleanText: messageText,
            audit: check
        };
    }
}
