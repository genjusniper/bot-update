// src/sales/DynamicOfferOptimization.mjs
// Mesin untuk memvariasikan angle penawaran dan mencatat efektivitasnya

import { SalesEventLedger } from './SalesEventLedger.mjs';
import { SalesLearningEngine } from './SalesLearningEngine.mjs';

export class DynamicOfferOptimization {
    
    /**
     * Dapatkan strategi penawaran terbaik untuk lead ini
     */
    static getOptimalPitch(lead) {
        // Ambil data belajar sebelumnya
        const learnData = SalesLearningEngine.learn();
        
        const PITCH_ANGLES = [
            { id: 'QUALITY_FOCUS', directive: 'Fokuskan penawaran pada KUALITAS santan yang murni tanpa campuran air. Cocok untuk masakan premium.' },
            { id: 'PRICE_FOCUS', directive: 'Fokuskan penawaran pada HARGA GROSIR yang lebih murah jika langganan. Tekankan efisiensi HPP.' },
            { id: 'SPEED_FOCUS', directive: 'Fokuskan penawaran pada KECEPATAN pengiriman dan stok yang selalu ready tiap subuh.' }
        ];

        let selectedAngle = PITCH_ANGLES[0]; // Default: Kualitas
        
        // Pilih angle secara dinamis (A/B testing ringan atau exploit yang menang)
        const rand = Math.random();
        
        if (rand < 0.2) {
            // 20% Eksplorasi (coba angle baru)
            selectedAngle = PITCH_ANGLES[Math.floor(Math.random() * PITCH_ANGLES.length)];
        } else {
            // 80% Eksploitasi (gunakan yang paling sering menang di tipe bisnis ini)
            let bestAngleId = 'QUALITY_FOCUS';
            let maxWin = 0;
            const angleCounts = {};

            if (learnData && learnData.winningPatterns) {
                for (const p of learnData.winningPatterns) {
                    // Dalam implementasi ideal, winningPatterns mencatat pitchAngleId. 
                    // Jika ada, kita gunakan:
                    if (p.pitchAngleId && p.type === lead.businessType) {
                        angleCounts[p.pitchAngleId] = (angleCounts[p.pitchAngleId] || 0) + 1;
                        if (angleCounts[p.pitchAngleId] > maxWin) {
                            maxWin = angleCounts[p.pitchAngleId];
                            bestAngleId = p.pitchAngleId;
                        }
                    }
                }
            }
            const found = PITCH_ANGLES.find(a => a.id === bestAngleId);
            if (found) selectedAngle = found;
        }

        // Catat ke ledger bahwa angle ini digunakan
        SalesEventLedger.record('DynamicOffer', lead.phone, 'PITCH_OFFER_SELECTED', { 
            pitchAngleId: selectedAngle.id,
            businessType: lead.businessType
        });

        return selectedAngle;
    }
}
