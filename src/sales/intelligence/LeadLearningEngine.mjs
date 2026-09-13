// src/sales/intelligence/LeadLearningEngine.mjs

export class LeadLearningEngine {
    // Dalam production, data ini disimpan di database (JSON/SQLite)
    static historicalData = {
        'RM_PADANG': { attempts: 50, orders: 15, rejections: 5 }, // 30% conversion
        'WARTEG': { attempts: 100, orders: 10, rejections: 20 },  // 10% conversion
        'GORENGAN': { attempts: 20, orders: 1, rejections: 10 }   // 5% conversion
    };

    /**
     * Mengembalikan multiplier (pengali) skor berdasarkan riwayat konversi tipe bisnis.
     * MENGGUNAKAN BAYESIAN SMOOTHING AGAR TIDAK OVERREACT KEPADA SAMPLE KECIL.
     */
    static getBusinessFitMultiplier(businessType) {
        const stats = this.historicalData[businessType] || { attempts: 0, orders: 0, rejections: 0 };
        
        // Bayesian smoothing: Asumsi dasar (prior)
        const priorAttempts = 30; // Butuh setidaknya 30 percobaan sebelum skor bisa miring drastis
        const priorOrders = 4.5;  // Asumsi baseline 15% conversion (4.5 / 30)

        const totalAttempts = stats.attempts + priorAttempts;
        const totalOrders = stats.orders + priorOrders;
        
        const smoothedConversionRate = totalOrders / totalAttempts;
        
        if (smoothedConversionRate >= 0.25) return 1.3; // Sangat menguntungkan, boost +30%
        if (smoothedConversionRate >= 0.10) return 1.0; // Normal
        return 0.7; // Sering nolak, pangkas skor -30%
    }

    /**
     * Endpoint untuk mencatat hasil dari interaksi WA (dipanggil oleh SalesExecutionOS nanti)
     */
    static recordOutcome(businessType, outcome) {
        if (!this.historicalData[businessType]) {
            this.historicalData[businessType] = { attempts: 0, orders: 0, rejections: 0 };
        }
        
        this.historicalData[businessType].attempts += 1;
        
        if (outcome === 'ORDER' || outcome === 'INTERESTED') {
            this.historicalData[businessType].orders += 1;
        } else if (outcome === 'REJECTED' || outcome === 'OPT_OUT') {
            this.historicalData[businessType].rejections += 1;
        }
    }
}
