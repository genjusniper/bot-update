// src/os/growth/StorytellingEngine.mjs
// ============================================================================
// SALIM OS - STORYTELLING & PERSONAL BRAND MEMORY ENGINE
// Framework: Problem ➔ Struggle ➔ Discovery ➔ Solution ➔ Proof
// ============================================================================

export class StorytellingEngine {
    static BRAND_STORIES = {
        'ORIGIN': {
            hook: 'Awalnya bot ini cuma dibuat buat nyelesaiin masalah pribadi sehari-hari.',
            struggle: 'Waktu awal jalan, saya kira bikin AI cukup manggil API LLM. Tapi ternyata masalah terbesarnya justru saat AI bikin jawaban ngawur, duplicate action, atau gak tahu kapan harus diem.',
            discovery: 'Dari situ saya belajar: yang dijual di bisnis bukan kepintaran AI-nya ngobrol, tapi keandalan dan kontrol amannya.',
            solution: 'Makanya sistem ini saya ubah jadi AI Operating System: AI cuma mengusulkan, sistem memvalidasi, dan pemilik bisnis yang punya hak otorisasi terakhir.'
        },
        'CONTROL_PHILOSOPHY': {
            hook: 'Banyak orang takut AI bakal bikin kacau bisnisnya kalau dilepas otomatis.',
            struggle: 'Ketakutan itu 100% beralasan. Chatbot yang dikasih akses refund uang atau ubah harga tanpa rem itu bom waktu.',
            discovery: 'Solusinya bukan melarang AI, tapi pasang sistem permission dan Approval Center.',
            solution: 'Kalau urusan jawab FAQ produk, AI jalan otomatis. Tapi kalau urusan diskon di atas 10% atau komplain berat, sistem langsung nahan dan minta approval ke pemiliknya.'
        },
        'COST_AND_RESOURCE': {
            hook: 'Banyak yang ngira sistem canggih kayak gini harus sewa server cloud mahal jutaan sebulan.',
            struggle: 'Dulu saya juga mikir gitu, sampai akhirnya saya optimasi arsitekturnya seringan mungkin.',
            discovery: 'Dengan antrean job queue, FSM, dan manajemen memori yang bener, seluruh engine ini stabil berjalan di konsumsi RAM di bawah 150 MB.',
            solution: 'Bahkan sistem yang kamu ajak ngobrol sekarang ini hidup mandiri di HP Android Termux dengan uptime berminggu-minggu tanpa crash.'
        }
    };

    /**
     * Gets a tailored story response for a given topic
     */
    static getStory(topic = 'ORIGIN') {
        const s = this.BRAND_STORIES[topic] || this.BRAND_STORIES['ORIGIN'];
        return `${s.hook}\n\n${s.struggle}\n\n${s.solution}`;
    }
}
