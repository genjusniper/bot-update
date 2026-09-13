const PRODUCT_LABELS = {
    'telur': 'Telur Ayam',
    'tahu': 'Tahu Putih',
    'tempe': 'Tempe Kedelai',
    'bawang_merah': 'Bawang Merah Kupas',
    'bawang_putih': 'Bawang Putih Kupas',
    'cabai': 'Lombok / Cabai',
    'kelapa_parut': 'Kelapa Parut',
    'daun_singkong': 'Daun Singkong',
    'gori': 'Gori Cacah',
    'ikan_asin': 'Ikan Asin',
    'pisang': 'Pisang Kepok'
};

export class ContextAwarePitchEngine {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY ;
        this.model = "models/gemini-1.5-flash"; 
    }

    getFriendlyProductName(id) {
        if (!id) return "Bahan Dapur Pasar";
        const clean = String(id).toLowerCase().trim();
        return PRODUCT_LABELS[clean] || clean.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    async generatePitch(lead, opportunityScoreData) {
        const primary = opportunityScoreData.primaryOpportunity;
        const secondaries = opportunityScoreData.secondaryOpportunities || [];
        
        const primaryId = primary?.id || primary?.name || 'bahan_pangan';
        const productName = this.getFriendlyProductName(primaryId);
        const secondaryNames = secondaries.slice(0, 2).map(s => this.getFriendlyProductName(s.id || s.name)).filter(Boolean);
        const secondaryText = secondaryNames.length > 0 ? secondaryNames.join(' & ') : '';

        const nba = opportunityScoreData.nextBestAction || 'SEND_PRICE';

        // Check if we can use Gemini AI
        if (this.apiKey) {
            try {
                const prompt = `Anda adalah asisten Mas Agus (supplier bahan dapur harian warung di Semarang).
Tugas Anda meracik sapaan WhatsApp pertama kali untuk pemilik usaha kuliner.
Sapaan harus sederhana, sopan, wajar, tidak berlebihan, dan TIDAK lebay.

DATA TARGET:
- Nama Tempat: ${lead.businessName}
- Kategori Usaha: ${lead.businessCategory || 'Kuliner'}

PRODUK UTAMA YANG DITAWARKAN:
- Produk Utama: ${productName}
${secondaryText ? `- Produk Tambahan: ${secondaryText}` : ''}

NEXT BEST ACTION:
"${nba}"

PANDUAN KONTEN & GAYA BAHASA (SANGAT KETAT):
1. Wajib sebutkan nama tempat usaha: "${lead.businessName}".
2. DILARANG menggunakan kata pujian berlebihan: "segar", "fresh", "muda", "kualitas super", "istimewa", "premium", "terbaik".
   Kualitas barang adalah barang pasar biasa standar kebutuhan harian warung (pas-pasan / barang olahan pasar harian).
3. Nilai jual yang ditawarkan adalah: KEMUDAHAN BAHAN SIAP MASAK (sudah dikupas/dicacah seperti bawang kupas, gori cacah), RUTINITAS PENGIRIMAN PAGI, dan HARGA PASAR GROSIR YANG HEMAT.
4. Buat 2-3 kalimat santai dan sopan khas obrolan antar pedagang pasar Semarang.
5. OUTPUT WAJIB FORMAT JSON MURNI:
{
  "strategy": "${nba}",
  "draft": "<pesan WA>"
}`;

                const payload = {
                    contents: [{ role: "user", parts: [{ text: prompt }] }]
                };

                const url = `https://generativelanguage.googleapis.com/v1beta/${this.model}:generateContent?key=${this.apiKey}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    const textResponse = data.candidates[0].content.parts[0].text;
                    const parsed = JSON.parse(textResponse.replace(/```json/g, '').replace(/```/g, '').trim());
                    if (parsed?.draft) {
                        return {
                            strategy: parsed.strategy || nba,
                            draft: parsed.draft,
                            productName,
                            metadata: {
                                draftSource: "AI_GENERATED",
                                confidence: "HIGH",
                                requiresHumanReview: false
                            }
                        };
                    }
                }
            } catch (error) {
                console.warn("[ContextAwarePitchEngine] AI API call fallback:", error.message);
            }
        }

        // ====================================================
        // REALISTIC HEURISTIC VARIATIONS (Tanpa kata lebay: segar/fresh/muda)
        // ====================================================
        const templates = [
            // Angle 1: Pasokan harian pasar
            `Halo tim ${lead.businessName}, salam kenal dari kami supplier bahan pangan pasar di Semarang. Kami ada pasokan harian seperti ${productName}. Boleh kami kirimkan daftar harganya hari ini?`,
            
            // Angle 2: Bahan siap olah & hemat
            `Selamat siang Kak di ${lead.businessName}. Kami menyuplai bahan siap masak seperti ${productName}${secondaryText ? ` dan ${secondaryText}` : ''} dengan harga grosir pasar. Apakah berkenan jika kami bagikan daftar harganya?`,
            
            // Angle 3: Kirim rutin tiap pagi
            `Salam kenal Kak, kami supplier kebutuhan dapur warung di Semarang. Barangkali ${lead.businessName} sedang butuh tambahan pasokan ${productName}? Kami siap kirim rutin tiap pagi. Boleh kami info pricelist-nya?`,
            
            // Angle 4: Kebutuhan masak harian
            `Halo Kak dari ${lead.businessName}, salam kenal. Kami ada pasokan rutin untuk ${productName} siap olah untuk kebutuhan masak harian. Jika berkenan, bolehkah kami bagikan penawaran harga pasar kami hari ini?`
        ];

        const hash = (lead.businessName ).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const chosenDraft = templates[hash % templates.length];

        return {
            strategy: nba,
            draft: chosenDraft,
            productName,
            metadata: {
                draftSource: "DYNAMIC_HEURISTIC",
                confidence: "MEDIUM",
                requiresHumanReview: true
            }
        };
    }
}
