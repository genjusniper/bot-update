// src/sales/OrderExtractionEngine.mjs

import { AIGatewayObservable } from '../resilience/AIGatewayObservable.mjs';

/**
 * Modul untuk mengekstrak teks berantakan menjadi Structured JSON Order
 * menggunakan Gemini API (JSON Mode).
 */
export class OrderExtractionEngine {

    static gateway = new AIGatewayObservable();

    static async extractOrder(rawTextMessage, customerName = "Pelanggan") {
        // System Prompt khusus untuk bahasa warung/pasar
        const systemPrompt = `Kamu adalah AI Ekstraktor Pesanan untuk supplier bahan pokok pasar.
Tugasmu: Mengubah teks pesan WhatsApp berbahasa gaul/singkatan/Jawa menjadi data JSON terstruktur.

Kamus Bahasa Lokal & Singkatan:
- sntn / santen = Santan
- tmp / tempe = Tempe
- bamer / bm = Bawang Merah
- baput / bp = Bawang Putih
- gereh / ikan asin = Ikan Asin
- dpepaya / godong kates = Daun Pepaya
- psg = Pisang

Aturan Kuantitas:
- "sekilo" = 1 kg
- "setengah" / "stngh" = 0.5
- "seperempat" / "prapat" = 0.25

Keluarkan HANYA JSON murni dengan struktur berikut:
{
  "order_id": "ORD-" + <3 digit angka random>,
  "customer": "<nama_pelanggan>",
  "items": [
    {
      "item_name": "<nama_barang_baku_standar (misal: Bawang Merah)>",
      "qty": <angka (misal: 1, 0.5, 20)>,
      "unit": "<satuan (misal: kg, liter, bungkus, ikat)>"
    }
  ],
  "status": "MENUNGGU KULAK"
}`;

        try {
            // Panggil gateway dengan custom config
            const response = await this.gateway.generate(
                systemPrompt, 
                rawTextMessage, 
                `extract_order_${Date.now()}`,
                [], // images
                null, // quoted context
                {
                    generationConfig: {
                        responseMimeType: "application/json",
                        temperature: 0.1
                    }
                }
            );

            if (response.success && response.text) {
                const parsedData = JSON.parse(response.text);
                if (!parsedData.customer || parsedData.customer === "<nama_pelanggan>") {
                    parsedData.customer = customerName;
                }
                return parsedData;
            } else {
                console.warn(`[OrderExtractionEngine] AI Gateway gagal: ${response.error}`);
                return null;
            }

        } catch (error) {
            console.error("[OrderExtractionEngine] ❌ Gagal mengekstrak pesanan:", error);
            return null;
        }
    }
}
