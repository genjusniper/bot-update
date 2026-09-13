// src/platform/engine/AIVerificationEngine.mjs
// ============================================================================
// SALIM AI OPERATING SYSTEM - AI VERIFICATION & FACT-CHECK GUARDRAIL
// Pre-flight validation and fact-checker to prevent hallucinated execution
// ============================================================================

export class AIVerificationEngine {
    /**
     * Pre-flight checks before attempting tool execution
     */
    static verifyPreconditions(toolName, params = {}) {
        switch (toolName) {
            case 'product.changePrice':
                if (!params.item) return { passed: false, error: 'Nama produk harus ditentukan.' };
                if (typeof params.newPrice !== 'number' || params.newPrice <= 0) {
                    return { passed: false, error: 'Harga baru harus berupa angka positif.' };
                }
                return { passed: true };

            case 'order.createDraft':
                if (!params.customerName) return { passed: false, error: 'Nama pelanggan tidak boleh kosong.' };
                if (!Array.isArray(params.items) || params.items.length === 0) {
                    return { passed: false, error: 'Daftar item pesanan tidak boleh kosong.' };
                }
                return { passed: true };

            case 'payment.requestRefund':
                if (!params.amount || params.amount <= 0) {
                    return { passed: false, error: 'Jumlah refund harus bernilai lebih dari 0.' };
                }
                return { passed: true };

            default:
                return { passed: true };
        }
    }

    /**
     * Validates that the AI output truthfully matches the execution result
     */
    static verifyOutputTruthfulness(executionResult, aiDraft = '') {
        const lower = aiDraft.toLowerCase();

        // If execution required approval but AI says "sudah saya ubah / sudah ditransfer"
        if (executionResult.status === 'REQUIRES_APPROVAL' || executionResult.status === 'BLOCKED') {
            const claimsSuccess = /\b(sudah|berhasil|telah)\s+(diubah|ditransfer|dikirim|selesai|sukses)\b/i.test(lower);
            if (claimsSuccess) {
                return {
                    truthful: false,
                    correctedText: `⚠️ *Tindakan Memerlukan Persetujuan Manusia:*\n` +
                                   `Sistem tidak dapat langsung mengeksekusi tindakan ini secara otomatis karena ${executionResult.reason}.\n` +
                                   `Permintaan telah dicatat dan sedang menunggu konfirmasi pemilik bisnis.`
                };
            }
        }

        return { truthful: true, text: aiDraft };
    }
}
