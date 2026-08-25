// src/multimodal/SemanticCache.mjs
// Semantic Cache for High-Frequency Queries (0 API Tokens, <5ms Response)

export class SemanticCache {
    static clusters = {
        FOOD_RECOMMENDATION: [
            "Lagi pengen yang kuah seger apa yang gurih krispi nih bro? Nek pengen kuah, soto ayam opo bakso urat enak ki. Nek gurih, ayam geprek opo bebek goreng sambel korek mantep tenan!",
            "Jajal soto madura, mie ayam bakso, opo nasi padang wae bro. Pas tenan jam semene nek golek sing marem!",
            "Rekomendasi hari ini: Sate ayam bumbu kacang anget opo penyetan lele sambel terasi! Mau pilih sing ndi ki?"
        ],
        TIRED_BORED: [
            "wkwk yaudah rebahan santai sek bro, kadang otak emang butuh istirahat total. Ojo diforsir terus!",
            "Tarik nafas sek bro, ngopi anget karo nyemil gih ben pikiran lu rada enteng.",
            "Santai wae bro, nek lagi mager ra usah dipaksa mikir abot-abot wkwk."
        ]
    };

    static match(message) {
        const text = (message || '').trim().toLowerCase();

        if (text.match(/^(makan apa|laper nih|rekomendasi makan|enak makan apa|bingung makan|makan siang apa|makan malem apa)/i)) {
            const replies = this.clusters.FOOD_RECOMMENDATION;
            return {
                hit: true,
                cluster: 'FOOD_RECOMMENDATION',
                response: replies[Math.floor(Math.random() * replies.length)]
            };
        }

        if (text.match(/^(lagi males|mager banget|bosen nih|capek mikir|gabut)/i)) {
            const replies = this.clusters.TIRED_BORED;
            return {
                hit: true,
                cluster: 'TIRED_BORED',
                response: replies[Math.floor(Math.random() * replies.length)]
            };
        }

        return { hit: false, response: null };
    }
}
