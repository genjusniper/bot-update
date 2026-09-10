// src/core/tools/PsychologyLieDetector.mjs
// Psychological, Deception & Emotional Subtext Analyzer for WhatsApp

export class PsychologyLieDetector {
    /**
     * Checks if text requests psychological / lie / emotional breakdown
     * @param {string} text 
     * @param {Object} quotedContext 
     * @returns {boolean}
     */
    static isAnalysisRequest(text = '', quotedContext = null) {
        const lower = (text || '').trim().toLowerCase();
        const hasQuoted = Boolean(quotedContext?.text);

        const triggers = [
            'analisis chat', 'analisis pesan', 'deteksi emosi', 
            'cek kebohongan', 'analisis orang ini', 'analisis psikologi',
            'dia jujur gak', 'dia bohong gak', 'maksud chat ini'
        ];

        return triggers.some(t => lower.includes(t));
    }

    /**
     * Builds specialized prompt for psychological decomposition
     * @param {string} targetChatText 
     * @param {string} userNotes 
     * @returns {string}
     */
    static buildAnalysisPrompt(targetChatText = '', userNotes = '') {
        return `Kamu adalah Ahli Psikologi Forensik Percakapan & Bahasa Tubuh Teks.
Analisis pesan berikut secara tajam, realistis, dan jujur (gaya bahasa santai, tajam, deadpan):

PESAN YANG DIANALISIS:
"${targetChatText}"
${userNotes ? 'CATATAN TAMBAHAN DARI USER: ' + userNotes : ''}

BERIKAN OUTPUT DENGAN FORMAT PERSIS SEPERTI INI:
🕵️‍♂️ *ANALISIS PSIKOLOGI PERCAKAPAN*
──────────────────
🎯 *Tingkat Kejujuran & Validitas:* [Persentase]% ([Penjelasan singkat apakah dia jujur, menghindar, atau manipulatif])
🎭 *Nada Emosi Tersembunyi:* [Sebutkan emosi asli, misal: Pasif-agresif, cemas, defensif, mencari validasi, manipulasi rasa bersalah]
🔍 *Maksud Tersembunyi (Subtext):* [Apa yang sebenarnya dia inginkan tapi tidak dia katakan secara gamblang]
💡 *Saran / Trik Balasan:* [1 strategi cara membalas yang elegan dan bikin dia skakmat/tidak bisa berkutik]

Jawab padat, to-the-point, dan sangat akurat layaknya detektif profesional!`;
    }
}
