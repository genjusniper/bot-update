// src/sales/LeadHuntingIntelligence.mjs
// Otak intelijen untuk mencari prospek bernilai tinggi berdasarkan data konversi sebelumnya

import { SalesLearningEngine } from './SalesLearningEngine.mjs';

export class LeadHuntingIntelligence {
    
    /**
     * Tentukan kueri pencarian (hunting target) terbaik berdasarkan conversion data
     */
    static getBestHuntingTargets(requiredLeads) {
        const learnData = SalesLearningEngine.learn();
        
        let bestType = 'CATERING'; // Default
        
        // Cari tipe bisnis dengan closing rate terbaik
        if (learnData && learnData.winningPatterns) {
            let maxScore = 0;
            const typeCounts = {};

            // Analisis sederhana frekuensi kemunculan tipe bisnis yang menang
            for (const p of learnData.winningPatterns) {
                if (p.type) {
                    typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
                    if (typeCounts[p.type] > maxScore) {
                        maxScore = typeCounts[p.type];
                        bestType = p.type;
                    }
                }
            }
        }

        // Generate query yang spesifik mengejar tipe bisnis tersebut
        const queries = [];
        if (bestType === 'CATERING') {
            queries.push('Katering hajatan');
            queries.push('Catering nasi kotak');
            queries.push('Katering pabrik');
        } else if (bestType === 'RESTO') {
            queries.push('Restoran Padang');
            queries.push('Rumah Makan Prasmanan');
            queries.push('Soto Ayam Kuah Santan');
        } else {
            queries.push('Rumah Makan');
            queries.push('Toko Roti & Kue Tradisional');
        }

        return {
            recommendedSegments: queries,
            estimatedRequired: requiredLeads,
            targetType: bestType
        };
    }
}
