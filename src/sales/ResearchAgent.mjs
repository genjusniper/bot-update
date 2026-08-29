// src/sales/ResearchAgent.mjs
// ResearchAgent — Builds deep profiles of businesses using web search

import { SalesEventLedger } from './SalesEventLedger.mjs';
import { LeadCRM } from './LeadCRM.mjs';

// Note: Dalam production environment, kita panggil tools search_web dan read_url_content dari Agent.
// Di sini kita build logic wrapper-nya.

export class ResearchAgent {
    
    /**
     * Membuat prompt instruksi untuk AI (Subagent) melakukan riset
     */
    static generateResearchPrompt(businessName, location) {
        return `Tugas: Buat profil bisnis mendalam untuk "${businessName}" di area "${location}".
Kamu adalah Research Agent. Lakukan pencarian web mendalam.

Kumpulkan informasi berikut:
1. Jenis Usaha yang spesifik (bukan sekadar "katering", tapi "katering harian diet", dll)
2. Kanal Kontak Publik (Website, Instagram, GoFood/GrabFood link, dsb)
3. Produk/Menu Unggulan (Apakah ada menu bersantan seperti kari, rendang, opor?)
4. Skala Usaha (Apakah punya banyak cabang? Apakah franchise nasional?)
5. Jam Operasional (Kapan mereka buka/tutup?)

ATURAN MUTLAK:
- JANGAN MENGARANG. Jika tidak ketemu, tulis "TIDAK DITEMUKAN".
- Setiap fakta WAJIB diberi referensi sumber (Source URL).
- Jika bisnis adalah "franchise nasional/internasional besar" (misal: KFC, McD, HokBen pusat), berikan label [RED_FLAG: NATIONAL_FRANCHISE] karena birokrasi vendor mereka biasanya tertutup untuk supplier lokal.

Format Output (JSON murni, tanpa markdown):
{
  "businessName": "${businessName}",
  "specificType": "...",
  "publicLinks": ["..."],
  "menuIndication": ["..."],
  "santanNeedSignal": "HIGH/MEDIUM/LOW/NONE",
  "scale": "...",
  "redFlag": "...",
  "sources": ["..."]
}`;
    }

    /**
     * Memproses hasil JSON dari Subagent menjadi data profil yang siap disimpan
     */
    static processResearchResult(phone, rawJsonResult) {
        try {
            const data = JSON.parse(rawJsonResult);
            
            const lead = LeadCRM.load(phone);
            if (!lead) throw new Error("Lead tidak ditemukan di CRM");

            lead.researchNotes = `Tipe Spesifik: ${data.specificType}\nMenu: ${data.menuIndication?.join(', ')}\nSkala: ${data.scale}`;
            lead.publicLinks = data.publicLinks || [];
            lead.santanNeedSignal = data.santanNeedSignal || 'UNKNOWN';
            
            let researchFlags = [];
            if (data.redFlag && data.redFlag.includes('NATIONAL_FRANCHISE')) {
                researchFlags.push('NATIONAL_FRANCHISE');
                lead.status = 'SKIP'; // Langsung diskip
            }

            lead.lastResearched = new Date().toISOString();
            
            LeadCRM.update(phone, lead);
            SalesEventLedger.record('ResearchAgent', phone, 'RESEARCH_COMPLETED', {
                flags: researchFlags,
                needSignal: lead.santanNeedSignal
            });

            return { success: true, lead, flags: researchFlags };
            
        } catch (e) {
            console.error(`[ResearchAgent] Gagal parsing hasil: ${e.message}`);
            return { success: false, error: e.message };
        }
    }
}
