// src/sales/LeadOpportunityScorer.mjs
// LeadOpportunityScorer — Multi-dimensional opportunity scoring (0-100)

export class LeadOpportunityScorer {
    /**
     * Hitung Opportunity Score untuk sebuah lead
     * @param {Object} lead - lead data dari CRM + hasil research
     * @param {Object} timeline - histori event dari SalesTimeline
     * @returns {Object} { score, breakdown, priorityLabel }
     */
    static score(lead, timeline = []) {
        const bd = {
            businessFit: 0,
            estimatedVolume: 0,
            needSignal: 0,
            accessibility: 0,
            responseSignal: 0,
            potentialValue: 0
        };

        const bizType = (lead.businessType || '').toUpperCase();
        const textCtx = `${lead.businessName || ''} ${lead.notes || ''} ${lead.researchNotes || ''}`.toLowerCase();

        // 1. Business Fit (Max 25)
        // Santan paling cocok untuk katering, resto padang, resto nusantara, bakery.
        if (bizType === 'CATERING') bd.businessFit = 25;
        else if (textCtx.includes('padang') || textCtx.includes('gulai') || textCtx.includes('rendang')) bd.businessFit = 25;
        else if (bizType === 'BAKERY' || bizType === 'WARUNG') bd.businessFit = 20;
        else if (bizType === 'CAFE') bd.businessFit = 10;
        else bd.businessFit = 5;

        // 2. Estimated Volume (Max 25)
        // Dari skala bisnis (omzet/jumlah cabang/ukuran)
        if (textCtx.includes('cabang') || textCtx.includes('grup') || textCtx.includes('pt ')) bd.estimatedVolume = 25;
        else if (bizType === 'CATERING') bd.estimatedVolume = 20; // Default katering cukup tinggi
        else if (bizType === 'WARUNG' || bizType === 'BAKERY') bd.estimatedVolume = 12;
        else bd.estimatedVolume = 8;

        // 3. Need Signal (Max 20)
        // Indikasi mereka sedang mencari supplier atau punya keluhan
        if (textCtx.includes('mencari supplier') || textCtx.includes('butuh santan')) bd.needSignal = 20;
        else if (textCtx.includes('supplier lama') || textCtx.includes('kualitas')) bd.needSignal = 15;
        else if (timeline.some(e => e.event === 'CURIOUS' || e.event === 'INTERESTED')) bd.needSignal = 15;
        else bd.needSignal = 5; // Default (belum ada sinyal kuat)

        // 4. Accessibility (Max 10)
        // Seberapa mudah dihubungi & dicover
        const hasWa = lead.phone ? 5 : 0;
        const covered = (lead.location || '').toLowerCase().includes('surabaya') ? 5 : 0; // Asumsi coverage utama
        bd.accessibility = hasWa + covered;

        // 5. Response Signal (Max 10)
        // Dari interaksi aktual
        if (timeline.some(e => e.event === 'REPLIED')) bd.responseSignal += 5;
        if (timeline.some(e => e.event === 'ASKED_PRICE')) bd.responseSignal += 5;
        // Penalti kalau lost/DNC
        if (lead.status === 'LOST') bd.responseSignal = -100;
        if (lead.status === 'DO_NOT_CONTACT') bd.responseSignal = -100;

        // 6. Potential Value (Max 10)
        // Prospek nilai kontrak jangka panjang
        if (bd.estimatedVolume > 20 && bd.businessFit > 20) bd.potentialValue = 10;
        else if (bd.estimatedVolume > 15) bd.potentialValue = 7;
        else bd.potentialValue = 3;

        // Kalkulasi Total
        let totalScore = bd.businessFit + bd.estimatedVolume + bd.needSignal + bd.accessibility + bd.responseSignal + bd.potentialValue;
        totalScore = Math.max(0, Math.min(100, totalScore));

        // Label
        let priorityLabel = 'LOW';
        if (totalScore >= 80) priorityLabel = 'TIER_1_ENTERPRISE';
        else if (totalScore >= 65) priorityLabel = 'TIER_2_HIGH_YIELD';
        else if (totalScore >= 50) priorityLabel = 'TIER_3_STEADY';
        else priorityLabel = 'TIER_4_OPPORTUNISTIC';

        return { score: totalScore, breakdown: bd, priorityLabel };
    }
}
