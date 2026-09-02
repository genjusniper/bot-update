// src/sales/OrderFulfillmentOS.mjs
// Mesin Kasir: Deteksi -> Ekstrak -> Rekap -> Balas

import { OrderExtractionEngine } from './OrderExtractionEngine.mjs';
import { OrderLedger } from './OrderLedger.mjs';
import { SalesEventLedger } from './SalesEventLedger.mjs';

export class OrderFulfillmentOS {
    
    /**
     * Cek apakah chat kemungkinan adalah chat pesanan
     */
    static isOrderIntent(text) {
        if (!text) return false;
        const lower = text.toLowerCase();
        
        // Keyword pesanan kasar
        const keywords = ['sntn', 'santan', 'tmp', 'tempe', 'bamer', 'baput', 'pesen', 'pesan', 'kirim'];
        const qtyWords = ['sekilo', 'stngh', 'setengah', 'liter', 'kg', 'ikat', 'bungkus'];
        
        // Punya angka atau keyword kuantitas
        const hasNumber = /\d+/.test(text) || qtyWords.some(q => lower.includes(q));
        const hasItem = keywords.some(k => lower.includes(k));

        // Jika kombinasi (misal: "sntn 4" atau "pesan bamer sekilo")
        return hasItem && hasNumber;
    }

    /**
     * Memproses pesan masuk. Jika ini order, akan dikembalikan teks balasannya.
     * Jika bukan, kembalikan null (biar AI biasa yang jawab).
     */
    static async processIncomingMessage(chatId, text, pushName) {
        if (!this.isOrderIntent(text)) {
            return null; // Bukan order
        }

        console.log(`[OrderFulfillmentOS] 🔍 Terdeteksi intent pesanan dari ${pushName}. Mengekstrak JSON...`);
        
        const orderData = await OrderExtractionEngine.extractOrder(text, pushName);
        
        if (orderData && orderData.items && orderData.items.length > 0) {
            // [UPDATE] Sisipkan chatId agar kita tahu siapa yang pesan
            orderData.chatId = chatId;
            orderData.customerName = pushName;

            // 1. Simpan ke Ledger Harian
            await OrderLedger.saveOrder(orderData);
            
            // 2. Simpan ke Global Sales Event Ledger
            SalesEventLedger.record('OrderFulfillment', chatId, 'ORDER_RECEIVED', { items: orderData.items });

            // 3. Buat balasan Auto-Invoice
            let reply = `Oke siap ${pushName}, pesanan sudah direkap ya:\n\n`;
            let totalEstimasi = 0;

            for (const item of orderData.items) {
                reply += `- ${item.item_name}: ${item.qty} ${item.unit}\n`;
                // Simulasi harga (ideal: baca dari ProductKnowledgeBase)
                // Default aja Rp 15.000 / item utk demo
                totalEstimasi += (parseFloat(item.qty) || 1) * 15000; 
            }

            reply += `\nEstimasi Total: Rp ${totalEstimasi.toLocaleString('id-ID')}\n`;
            reply += `Barang akan dikirim jam 5 subuh. Matur nuwun! 🙏`;

            console.log(`[OrderFulfillmentOS] ✅ Pesanan sukses direkap dan dibalas.`);
            return reply;
        }

        // Kalau AI gagal ektrak JSON meski udah diduga order
        console.warn(`[OrderFulfillmentOS] ⚠️ Intent terdeteksi, tapi JSON gagal diekstrak.`);
        return null;
    }
}
