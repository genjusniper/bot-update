// src/os/growth/CollaborationDetector.mjs
// ============================================================================
// SALIM OS - COLLABORATION & AGENCY DETECTOR
// Recognizes partnership, agency, and white-label opportunities
// ============================================================================

export class CollaborationDetector {
    static detect(text = '') {
        const lower = text.toLowerCase();
        const isCollab = /(?:punya\s+agency|punya\s+klien|ada\s+projek|proyek|kolaborasi|kerjasama|bagi\s+hasil|white\s*label|partner|reseller)/i.test(lower);

        if (isCollab) {
            return {
                isCollaboration: true,
                suggestedResponse: 'Menarik banget. Kalau kamu sudah kuat di sisi akuisisi klien atau relasi bisnis, saya justru bisa fokus di sisi engine arsitektur dan automasi backend-nya.\n\nModel yang paling masuk akal mungkin bukan sekadar jual bot putus, tapi kita gandeng bareng buat bikinin solusi yang benar-benar kepakai di operasional klienmu.\n\nBoleh tahu klien yang lagi kamu tangani ini bergerak di bidang apa?'
            };
        }

        return { isCollaboration: false };
    }
}
