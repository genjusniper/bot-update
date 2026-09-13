
export class SalesDraftEngine {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY ;
        // Menggunakan model yang tersedia di key milik user (Antigravity Preview atau model lain yang stabil)
        this.model = "models/antigravity-preview-05-2026"; 
    }

    _buildSystemPrompt() {
        return `Anda adalah AI sales assistant. Tugas Anda adalah membuat draft pesan penawaran B2B.

ATURAN MUTLAK:
1. Jangan mengaku mengetahui kebutuhan calon pelanggan jika tidak ada bukti.
2. Jangan mengarang volume pembelian, omzet, supplier, harga, masalah, atau keputusan.
3. Jangan menggunakan klaim seperti "Saya tahu Anda membutuhkan..." tanpa bukti nyata.
4. Jangan menggunakan kata menekan (harus, wajib, pasti cocok).
5. Gunakan bahasa manusia sederhana yang humble.
6. Maksimal 3-5 kalimat.
7. Fokus: siapa kita, penawaran, alasan kontekstual, opsi ringan untuk berdiskusi/mencoba.
8. Jika evidence kurang, gunakan bahasa tentatif ("Barangkali...").
9. DILARANG keras menampilkan reasoning atau THOUGHT.

OUTPUT HANYA JSON:
{
  "message": "...",
  "confidence": "LOW|MEDIUM|HIGH",
  "claims": [],
  "warnings": []
}`;
    }

    _buildUserPrompt(lead, productContext) {
        return `DATA CALON PELANGGAN:
- Nama: ${lead.businessName || 'Unknown'}
- Kategori: ${lead.businessCategory || 'Unknown'}
- Lokasi: ${lead.location || 'Unknown'}
- Fakta (Evidence): ${lead.evidence || 'N/A'}

DATA PENJUAL (SAYA):
- Produk: ${productContext.product}
- Profil: ${productContext.sellerProfile}

Buat penawaran B2B untuk prospek ini. HANYA KELUARKAN JSON SESUAI FORMAT.`;
    }

    async generateDraft(lead, productContext) {
        if (!this.apiKey) throw new Error("API Key AI tidak tersedia.");
        
        const systemPrompt = this._buildSystemPrompt();
        const userPrompt = this._buildUserPrompt(lead, productContext);
        
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/${this.model}:generateContent?key=${this.apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });
            
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            
            const rawText = data.candidates[0].content.parts[0].text;
            return JSON.parse(rawText);
        } catch (error) {
            console.error("[SalesDraftEngine] Gagal memanggil AI:", error.message);
            // Fallback sederhana jika gagal parsing JSON atau timeout
            return {
                message: `Halo, saya ${productContext.sellerProfile.split(',')[0]}. Barangkali ${lead.businessName} sedang membutuhkan ${productContext.product} untuk operasional, saya siap mengirim tester.`,
                confidence: "LOW",
                claims: [],
                warnings: ["Error parsing AI response"]
            };
        }
    }
}
