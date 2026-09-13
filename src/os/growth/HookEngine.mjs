// src/os/growth/HookEngine.mjs
// ============================================================================
// SALIM OS - ETHICAL HOOK & CURIOSITY GAP ENGINE
// Honest hooks that provoke thoughtful curiosity without manipulation
// ============================================================================

export class HookEngine {
    static HOOKS = {
        'PROBLEM': 'Masalah utama chatbot bisnis biasanya bukan karena AI-nya kurang pintar, tapi karena dia gak tahu kapan harus diam dan kapan harus lapor ke manusia.',
        'CONTRADICTION': 'AI yang semakin pintar justru makin berisiko buat bisnis kalau sistem izin (permission)-nya gak dikunci ketat.',
        'QUESTION': 'Kalau kamu punya asisten AI yang bisa beresin satu pekerjaan paling menyita waktu tiap hari, pekerjaan apa yang paling pengen kamu otomatisasi?',
        'DEMO': 'Daripada saya jelaskan teori panjang, coba kasih saya satu skenario nyata yang sering bikin repot di tokomu. Biar kita simulasikan alurnya bareng.',
        'CONTROL': 'Yang membedakan bot mainan dengan sistem operasional bisnis itu satu hal: audit trail. Bisnis butuh tahu persis alasan kenapa AI mengirim pesan tertentu ke pelanggan.'
    };

    /**
     * Retrieves an appropriate hook by category
     */
    static getHook(category = 'PROBLEM') {
        return this.HOOKS[category] || this.HOOKS['PROBLEM'];
    }
}
