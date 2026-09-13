/**
 * PaymentProofVisionEngine.mjs
 * 
 * Verifies bank transfer receipts and QRIS payment slips.
 * Extracts amounts, destination accounts, timestamps, and status.
 */

export class PaymentProofVisionEngine {
    /**
     * Build Vision prompt for verifying payment slips
     */
    static buildPrompt({ expectedAmount = null, targetBank = null, tenantName = 'Toko' }) {
        return `Kamu adalah Sistem Verifikasi Pembayaran Otomatis untuk ${tenantName}.
Tugasmu adalah memeriksa gambar bukti transfer atau struk QRIS yang dikirimkan pelanggan.

Lakukan ekstraksi data berikut secara akurat:
1. Bank / Dompet Digital Pengirim dan Penerima (BCA / Mandiri / BRI / BNI / QRIS / DANA / GoPay / ShopeePay)
2. Nomor Rekening Tujuan & Nama Penerima
3. Nominal Transfer (Rp)
4. Tanggal & Jam Transaksi
5. Status Transaksi (BERHASIL / SUKSES / PENDING / GAGAL)

${expectedAmount ? `Nominal yang diharapkan: Rp ${expectedAmount.toLocaleString('id-ID')}.` : ''}

Format balasan ke pelanggan:
Jika Berhasil:
"✅ *Pembayaran Terverifikasi!*\nNominal: Rp [nominal]\nBank: [bank]\nStatus: Berhasil\nPesananmu langsung kami siapkan ya!"

Jika Nominal Kurang / Mencurigakan:
"⚠️ *Perhatian:* Nominal transfer terdeteksi Rp [nominal], sedangkan total pesanan Rp [expectedAmount]. Mohon dicek kembali ya kak."`;
    }

    /**
     * Inspect parsed OCR text from payment receipt
     */
    static inspectReceiptText(ocrText, expectedAmount = null) {
        const clean = (ocrText || '').toUpperCase();

        const isSuccess = /BERHASIL|SUKSES|SUCCESSFUL|TRANSAKSI BERHASIL|DITERIMA/i.test(clean);
        const isFailed = /GAGAL|FAILED|BATAL|EXPIRED/i.test(clean);

        // Find currency amount
        const amountMatch = clean.match(/(?:RP|IDR|TOTAL|NOMINAL)?\s*[:=.]?\s*([\d.,]{4,12})/i);
        let detectedAmount = 0;
        if (amountMatch) {
            const rawDigits = amountMatch[1].replace(/[^0-9]/g, '');
            detectedAmount = parseInt(rawDigits, 10) || 0;
        }

        const matchesExpected = expectedAmount ? Math.abs(detectedAmount - expectedAmount) <= 1000 : true;

        return {
            isValid: isSuccess && !isFailed,
            status: isFailed ? 'FAILED' : (isSuccess ? 'SUCCESS' : 'UNCERTAIN'),
            detectedAmount,
            matchesExpected,
            verified: isSuccess && matchesExpected
        };
    }
}
