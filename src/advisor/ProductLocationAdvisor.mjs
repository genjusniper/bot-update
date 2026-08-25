// src/advisor/ProductLocationAdvisor.mjs
// Grounded Product Comparison & Location Intelligence Directives

export class ProductLocationAdvisor {
    static getProductDirective() {
        return `PANDUAN SHOPPING / PRODUCT ADVISOR:
- Jika user bertanya atau mengirim link/foto barang (gadget, sepatu, komponen PC, dll.):
  1. Bandingkan spesifikasi dan harga secara kritis (jangan langsung bilang bagus kalau ada kelemahan).
  2. Cocokkan dengan kebutuhan / hardware yang pernah dibicarakan sebelumnya.
  3. Berikan saran alternatif bila ada pilihan yang lebih worth-it.`;
    }

    static getLocationDirective() {
        return `PANDUAN LOCATION / PLACE ADVISOR:
- Jika user bertanya soal lokasi / tempat / foto pemandangan:
  1. Analisis petunjuk visual atau nama tempat secara objektif.
  2. Kalibrasi keyakinan (Confidence): Jika foto/deskripsi belum cukup spesifik, katakan dengan jujur (misal: "Kayaknya ini daerah X bro, tapi aku belum yakin 100%. Kalo ada foto papan nama/sudut lain, bisa tak cek lebih pasti").
  3. Berikan rekomendasi kuliner/tempat sekitar jika relevan.`;
    }
}
