// src/os/finance/ReceiptScannerOCR.mjs
// Smart Receipt & QRIS OCR Engine for Salim OS
// Scans paper receipts, nota, and QRIS payment screenshots via Gemini Vision and syncs to SmartBudgetGuard

import { SmartBudgetGuard } from './SmartBudgetGuard.mjs';

export class ReceiptScannerOCR {
    /**
     * Inspects if caption or incoming text suggests a receipt / payment proof
     * @param {string} caption 
     * @returns {boolean}
     */
    static isReceiptLure(caption = '') {
        const text = (caption || '').toLowerCase();
        return /(?:struk|nota|bon|bill|qris|transfer|bayar|kasir|belanja|indomaret|alfamart|spbu|pertamina|receipt)/i.test(text);
    }

    /**
     * Scans receipt image using Gemini Vision
     * @param {string} imageBase64 
     * @param {string} mimeType 
     * @returns {Promise<{ success: boolean, merchant?: string, total?: number, category?: string, items?: string[], rawSummary?: string }>}
     */
    static async scanImage(imageBase64, mimeType = 'image/jpeg') {
        const rawKey = process.env.GEMINI_API_KEY || '';
        const apiKey = rawKey.split(',')[0].trim();

        if (!apiKey || !imageBase64) {
            return { success: false, error: 'API Key atau gambar tidak tersedia' };
        }

        const prompt = `Analisis foto struk belanja, nota kasir, bon, atau bukti transfer/QRIS berikut.
Ekstrak data dengan teliti dan hasilkan HANYA format JSON valid tanpa format markdown atau backticks lain:
{
  "merchant": "Nama Toko / Merchant / Tempat Makan / SPBU",
  "total": 0,
  "category": "Makanan / Belanja / Bensin / Transportasi / Tagihan / Kebutuhan",
  "items": ["daftar barang singkat (maksimal 4 item)"],
  "date": "Tanggal struk jika terbaca"
}
Catatan: Field "total" harus berupa angka murni integer (contoh: 45000, jangan pakai Rp atau titik). Jika total tidak terbaca sama sekali, isi 0.`;

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: imageBase64
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 500
                    }
                }),
                signal: AbortSignal.timeout(12000)
            });

            if (!res.ok) {
                throw new Error(`Gemini Vision API returned ${res.status}`);
            }

            const data = await res.json();
            const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Extract JSON from response
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Gagal mengekstrak struktur data JSON dari hasil pembacaan');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            return {
                success: true,
                merchant: parsed.merchant || 'Struk Belanja',
                total: parseInt(parsed.total, 10) || 0,
                category: parsed.category || 'Belanja',
                items: Array.isArray(parsed.items) ? parsed.items : [],
                date: parsed.date || ''
            };
        } catch (err) {
            console.warn('[ReceiptScannerOCR] ⚠️ Scan error:', err.message);
            return { success: false, error: err.message };
        }
    }

    /**
     * Processes receipt image, saves to SmartBudgetGuard, and formats WhatsApp response
     * @param {string} chatId 
     * @param {string} imageBase64 
     * @param {string} mimeType 
     * @returns {Promise<string>}
     */
    static async processAndRecord(chatId, imageBase64, mimeType = 'image/jpeg') {
        const scanResult = await this.scanImage(imageBase64, mimeType);

        if (!scanResult.success || !scanResult.total || scanResult.total <= 0) {
            return `🧾 *PEMINDAIAN STRUK / NOTA*\n━━━━━━━━━━━━━━━━━━\n` +
                   `⚠️ Gambar berhasil dipindai, namun nominal total pembayaran tidak terbaca dengan jelas.\n` +
                   `Pastikan foto struk terang dan angka total terlihat jelas ya Bos!\n` +
                   `_Atau catat manual via: \`catat makan 25rb\`_`;
        }

        const itemsSummary = scanResult.items.length > 0 ? scanResult.items.join(', ') : 'Belanja umum';
        const description = `${scanResult.merchant} (${itemsSummary})`;

        // Record to SmartBudgetGuard
        const recorded = SmartBudgetGuard.recordExpense({
            chatId,
            amount: scanResult.total,
            description,
            category: scanResult.category
        });

        const weekly = SmartBudgetGuard.getWeeklyStats(chatId);

        let out = `🧾 *STRUK BELANJA BERHASIL DIPINDAI!* 🧾\n` +
                  `━━━━━━━━━━━━━━━━━━\n` +
                  `🏪 *Tempat / Merchant:* *${scanResult.merchant}*\n` +
                  `💵 *Total Tagihan:* *Rp ${recorded.amount.toLocaleString('id-ID')}*\n` +
                  `🏷️ *Kategori:* ${recorded.category}\n`;

        if (scanResult.items.length > 0) {
            out += `📦 *Daftar Item:*\n• ` + scanResult.items.join('\n• ') + `\n`;
        }

        out += `━━━━━━━━━━━━━━━━━━\n` +
               `📊 *Total Pengeluaran Minggu Ini:* Rp ${weekly.total.toLocaleString('id-ID')}\n` +
               `💰 *Sisa Budget Mingguan:* Rp ${weekly.remaining.toLocaleString('id-ID')}\n`;

        if (weekly.remaining <= 100000) {
            out += `⚠️ *Perhatian:* Sisa budget menipis Bos! Rem dulu belanja non-esensial.\n`;
        }

        out += `━━━━━━━━━━━━━━━━━━\n_Otomatis dicatat oleh Salim OS Receipt Vision._`;
        return out;
    }
}
