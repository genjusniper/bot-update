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

        // 4. What-Happens-Next Prediction
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

        return {
            timePhase,
            hour,
            isLateNight,
            isEarlyMorning,
            energyLevel,
            hasUrgency,
            predictedNeed,
            suggestedStrategy,
            rawText: text
        };
    }

    /**
     * Formats situational guidance for the Master Brain
     */
    static formatDirective(situation) {
        let out = `\n[SITUATION AWARENESS & PREDICTION]:\n`;
        out += `• Waktu: Jam ${situation.hour}.00 (${situation.timePhase})\n`;
        out += `• Tingkat Energi Bos: ${situation.energyLevel}\n`;
        out += `• Urgensi/Tenggat: ${situation.hasUrgency ? 'TINGGI (Besok ada aktivitas/urgensi)' : 'NORMAL'}\n`;
        out += `• Prediksi Kebutuhan: ${situation.predictedNeed}\n`;

        if (situation.isLateNight && situation.energyLevel === 'LOW_ENERGY') {
            out += `• PETUNJUK RESPOIN: Jangan berikan esai panjang! Bos sedang lelah/malam hari. Berikan 1 langkah esensial atau sarankan istirahat & lanjut besok pagi.\n`;
        } else if (situation.hasUrgency) {
            out += `• PETUNJUK RESPON: Prioritaskan solusi langsung to-the-point agar masalah utama beres secepat mungkin tanpa basa-basi.\n`;
        }

        return out;
    }
}
