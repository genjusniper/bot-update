// src/cognitive/SituationAwarenessEngine.mjs
// Real-world situation evaluator fusing Temporal, Energy/Fatigue, and Next-Action Prediction

export class SituationAwarenessEngine {
    /**
     * Evaluates current situation from real-time context and incoming text
     * @param {Object} params
     * @param {string} params.text - Owner's incoming text
     * @param {Object} [params.openLoops=[]] - List of active open loops
     * @param {number} [params.timestamp=Date.now()]
     * @returns {Object} Situation snapshot
     */
    static evaluate({ text = '', openLoops = [], timestamp = Date.now() }) {
        const date = new Date(timestamp);
        const hour = date.getHours(); // 0 - 23 (WIB assumed or local)
        const day = date.getDay(); // 0 = Sunday, 6 = Saturday
        const raw = String(text || '').trim().toLowerCase();

        // 1. Temporal Phase
        let timePhase = 'DAY';
        let isLateNight = false;
        let isEarlyMorning = false;

        if (hour >= 22 || hour < 4) {
            timePhase = 'LATE_NIGHT';
            isLateNight = true;
        } else if (hour >= 4 && hour < 7) {
            timePhase = 'EARLY_MORNING';
            isEarlyMorning = true;
        } else if (hour >= 7 && hour < 12) {
            timePhase = 'MORNING_WORK';
        } else if (hour >= 12 && hour < 18) {
            timePhase = 'AFTERNOON_ACTIVE';
        } else {
            timePhase = 'EVENING_WIND_DOWN';
        }

        // 2. Fatigue & Energy Level Detection
        const wordCount = raw.split(/\s+/).filter(Boolean).length;
        const fatigueKeywords = ['capek', 'lelah', 'ngantuk', 'mumet', 'pusing', 'kesel', 'mager', 'besok aja', 'ntar aja', 'wes bengi'];
        const expressesFatigue = fatigueKeywords.some(kw => raw.includes(kw));
        
        let energyLevel = 'NORMAL';
        if (expressesFatigue || (isLateNight && wordCount <= 3)) {
            energyLevel = 'LOW_ENERGY';
        } else if (wordCount > 15 || raw.includes('gas') || raw.includes('semangat') || raw.includes('ayo')) {
            energyLevel = 'HIGH_ENERGY';
        }

        // 3. Urgency & Friction Estimation
        const urgentKeywords = ['besok masuk', 'besok kerja', 'pagi harus', 'segera', 'urgent', 'penting', 'darurat', 'belum beres'];
        const hasUrgency = urgentKeywords.some(kw => raw.includes(kw));

        // 4. What-Happens-Next Prediction & Strategy
        let predictedNeed = 'GENERAL_ASSISTANCE';
        let suggestedStrategy = 'BALANCED_CO_PILOT';

        if (isLateNight && energyLevel === 'LOW_ENERGY') {
            predictedNeed = 'WIND_DOWN_OR_REST';
            suggestedStrategy = 'MINIMIZE_COGNITIVE_LOAD';
        } else if (hasUrgency && (raw.includes('laptop') || raw.includes('pc') || raw.includes('bcd') || raw.includes('windows'))) {
            predictedNeed = 'RAPID_TROUBLESHOOT_OR_DEFER_PLAN';
            suggestedStrategy = 'ONE_CRITICAL_NEXT_STEP';
        } else if (raw.includes('lanjut') || raw.includes('next') || raw.includes('terusin')) {
            predictedNeed = 'RESUME_PREVIOUS_MISSION';
            suggestedStrategy = 'RESUME_DAG_STEP';
        }

        // 5. Higher-Order Intent Implication & Latent Goal Extraction
        const intentImplication = this.extractIntentImplication(text, {
            raw,
            timePhase,
            hour,
            isLateNight,
            isEarlyMorning,
            energyLevel,
            hasUrgency,
            predictedNeed
        });

        return {
            timePhase,
            hour,
            isLateNight,
            isEarlyMorning,
            energyLevel,
            hasUrgency,
            predictedNeed,
            suggestedStrategy,
            intentImplication,
            rawText: text
        };
    }

    /**
     * Extracts latent implications, hidden constraints, and next probable actions from owner chat
     */
    static extractIntentImplication(originalText = '', ctx = {}) {
        const raw = ctx.raw || String(originalText || '').toLowerCase();
        let explicit = originalText.trim();
        let implied = 'Membutuhkan respon tanggap dan solutif.';
        let goal = 'Menjawab atau menyelesaikan topik.';
        let constraint = 'Normal';
        let nextProbableAction = 'Memberikan insight atau panduan jelas.';

        if (ctx.hasUrgency) {
            if (raw.includes('laptop') || raw.includes('pc') || raw.includes('komputer') || raw.includes('bcd') || raw.includes('windows')) {
                implied = 'Device PC/Laptop harus segera siap sebelum jadwal esok, atau opsi cadangan harus diputuskan malam ini.';
                goal = 'Menyelesaikan perbaikan boot Windows tanpa membuang waktu.';
                constraint = ctx.isLateNight ? 'Waktu tidur sangat terbatas & energi mulai menipis' : 'Waktu mendesak';
                nextProbableAction = 'Ketik 1 instruksi CMD perbaikan terarah atau putuskan tunda tidur.';
            } else if (raw.includes('kerja') || raw.includes('masuk') || raw.includes('kantor') || raw.includes('tugas')) {
                implied = 'Ada kewajiban esok pagi yang menekan pikiran malam ini.';
                goal = 'Menyaring prioritas agar tidak panik / burnout.';
                constraint = 'Jadwal masuk kerja esok pagi';
                nextProbableAction = 'Pangkas daftar tugas menjadi 1 hal paling krusial.';
            }
        } else if (raw.includes('proyek') || raw.includes('bikin') || raw.includes('ide baru')) {
            implied = 'Sedang antusias dengan ide baru namun berisiko memecah fokus open loop yang belum tuntas.';
            goal = 'Eksplorasi ide tanpa mengorbankan project utama.';
            constraint = 'Beban kognitif & batas fokus harian';
            nextProbableAction = 'Catat idenya di backlog, selesaikan loop aktif dulu.';
        } else if (ctx.isLateNight && ctx.energyLevel === 'LOW_ENERGY') {
            implied = 'Sebenarnya sudah lelah dan butuh jeda istirahat.';
            goal = 'Menutup hari tanpa beban pikiran menggantung.';
            constraint = 'Energi fisik & mental rendah';
            nextProbableAction = 'Rangkum status terakhir & sarankan tidur.';
        }

        return {
            explicit,
            implied,
            goal,
            constraint,
            nextProbableAction
        };
    }

    /**
     * Formats situational guidance for the Master Brain
     */
    static formatDirective(situation) {
        let out = `\n[SITUATION AWARENESS & INTENT PREDICTION]:\n`;
        out += `• Waktu: Jam ${situation.hour}.00 (${situation.timePhase})\n`;
        out += `• Tingkat Energi Bos: ${situation.energyLevel}\n`;
        out += `• Urgensi: ${situation.hasUrgency ? 'TINGGI (Mendesak / Esok ada jadwal)' : 'NORMAL'}\n`;
        
        if (situation.intentImplication) {
            const ii = situation.intentImplication;
            out += `• INTENT EKSPLISIT: "${ii.explicit}"\n`;
            out += `• INTENT TERSIRAT (IMPLIED): ${ii.implied}\n`;
            out += `• TUJUAN SEBENARNYA (GOAL): ${ii.goal}\n`;
            out += `• KENDALA (CONSTRAINT): ${ii.constraint}\n`;
            out += `• TINDAKAN TERBAIK BERIKUTNYA: ${ii.nextProbableAction}\n`;
        }

        if (situation.isLateNight && situation.energyLevel === 'LOW_ENERGY') {
            out += `• ATURAN COGNITIVE LOAD: Bos sedang malam hari & lelah. JANGAN BERIKAN 10 OPSI ATAU PARAGRAF PANJANG! Cukup 1 langkah praktis atau ajak istirahat.\n`;
        } else if (situation.hasUrgency) {
            out += `• ATURAN COGNITIVE LOAD: Langsung to-the-point ke solusi utama yang menyelesaikan hambatan Bos.\n`;
        }

        return out;
    }
}
