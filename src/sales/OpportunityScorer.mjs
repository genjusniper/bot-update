// src/sales/OpportunityScorer.mjs

export class OpportunityScorer {
    /**
     * Mengevaluasi pelanggan berdasarkan probabilitas reorder dan margin.
     * Menggunakan model Expected Value (EV = Probability * Expected Margin).
     */
    static evaluate(contact, history) {
        if (!contact || !history) return null;

        const reasons = [];

        // 1. HARD SKIPS (Tidak Boleh Dihubungi)
        if (history.isBlacklisted || contact.status === 'BLACKLIST') {
            reasons.push('blacklisted_contact');
            return this._buildResult(contact.phone, 0, 0, 'SKIP', reasons);
        }

        if (!history.orderCount || history.orderCount === 0) {
            reasons.push('no_order_history_use_lead_hunter');
            return this._buildResult(contact.phone, 0, 0, 'SKIP', reasons);
        }

        // 2. MENGHITUNG PROBABILITAS (Base = 30%)
        let probability = 0.30;
        const now = Date.now();
        const daysSinceLastOrder = (now - history.lastOrderAt) / (1000 * 60 * 60 * 24);

        if (history.orderFrequency) {
            const diff = daysSinceLastOrder - history.orderFrequency;
            // Jika hari ini adalah jadwal dia biasa reorder (+/- 1 hari)
            if (Math.abs(diff) <= 1) {
                probability += 0.40;
                reasons.push('reorder_interval_reached');
            } 
            // Jika sudah telat lebih dari 3 hari dari jadwal biasanya
            else if (diff > 3) {
                probability -= 0.15;
                reasons.push('dormancy_penalty');
            }
        }

        if (daysSinceLastOrder > 30) {
            probability -= 0.25;
            reasons.push('long_inactive_customer');
        }

        if (history.historicalConversion > 0.6) {
            probability += 0.20;
            reasons.push('strong_historical_conversion');
        }

        // Clamp probabilitas ke batas rasional (5% - 95%)
        probability = Math.max(0.05, Math.min(0.95, probability));

        // 3. MENGHITUNG EXPECTED MARGIN & VALUE
        // Asumsi: Margin per liter/kg = Rp 5.000
        const marginPerUnit = 5000;
        const expectedMargin = (history.averageLiters || 1) * marginPerUnit;
        
        if (history.averageLiters >= 10) {
            reasons.push('high_historical_volume');
        } else if (history.averageLiters <= 2) {
            reasons.push('low_historical_volume');
        }

        if (contact.businessType === 'RM_PADANG' || contact.businessType === 'WARTEG') {
            reasons.push(`heavy_fit_${contact.businessType.toLowerCase()}`);
            probability += 0.10; // Extra bump for sticky business types
        }

        // KUNCI UTAMA: EXPECTED VALUE
        const expectedValue = probability * expectedMargin;

        // 4. KLASIFIKASI & ACTION
        let priority = 'LOW';
        let action = 'PROACTIVE_OUTREACH';

        if (expectedValue >= 35000) {
            priority = 'HIGH';
        } else if (expectedValue >= 15000) {
            priority = 'MEDIUM';
        } else if (expectedValue > 5000) {
            priority = 'LOW';
        } else {
            priority = 'SKIP';
            action = 'SKIP';
            reasons.push('expected_value_too_low');
        }

        // Visual Score (skala 0-100) berdasarkan limit EV 50rb
        const score = Math.min(100, Math.max(1, Math.round((expectedValue / 50000) * 100)));

        return {
            phone: contact.phone,
            name: contact.name,
            score,
            priority,
            expectedValue: Math.round(expectedValue),
            reasons,
            recommendedAction: action,
            _debug: { probability: probability.toFixed(2), expectedMargin }
        };
    }

    static _buildResult(phone, score, ev, priority, reasons) {
        return { 
            phone, 
            score, 
            priority, 
            expectedValue: ev, 
            reasons, 
            recommendedAction: 'SKIP' 
        };
    }
}
