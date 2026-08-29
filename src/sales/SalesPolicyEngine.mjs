// src/sales/SalesPolicyEngine.mjs
// SalesPolicyEngine - Pusat Aturan Bisnis Deterministik

export const PolicyAction = {
    DO: 'DO',
    WAIT: 'WAIT',
    RESEARCH: 'RESEARCH',
    PRIORITIZE: 'PRIORITIZE',
    HANDOFF: 'HANDOFF',
    SKIP: 'SKIP'
};

export class SalesPolicyEngine {

    /**
     * Menentukan tindakan mutlak berdasarkan kondisi lead dan sistem
     */
    static evaluate(lead, recentHistory, salesPhase) {
        if (!lead) return { action: PolicyAction.SKIP, reason: 'Invalid lead data' };

        // 1. SKIP Conditions (Mutlak tidak boleh dihubungi)
        if (['LOST', 'DO_NOT_CONTACT', 'SKIP'].includes(lead.status)) {
            return { action: PolicyAction.SKIP, reason: `Status lead adalah ${lead.status}` };
        }
        if (lead.researchFlags?.includes('NATIONAL_FRANCHISE')) {
            return { action: PolicyAction.SKIP, reason: 'Kebijakan: Skip franchise nasional' };
        }
        if (lead.blacklist) {
            return { action: PolicyAction.SKIP, reason: 'Lead di-blacklist' };
        }

        // 2. RESEARCH Conditions (Data kurang)
        if (!lead.businessType || lead.businessType === 'UNKNOWN') {
            if (!lead.lastResearched) {
                return { action: PolicyAction.RESEARCH, reason: 'Tipe bisnis tidak diketahui' };
            }
        }

        // 3. WAIT Conditions (Menunggu)
        if (lead.nextFollowUp && new Date(lead.nextFollowUp) > new Date()) {
            return { action: PolicyAction.WAIT, reason: 'Belum waktunya follow-up' };
        }
        if (recentHistory && recentHistory.length > 0) {
            // Cek cooldown (misal baru dichat 1 jam lalu, jangan chat lagi jika mereka belum balas)
            const lastContact = new Date(lead.lastContact || 0);
            const hoursSince = (new Date() - lastContact) / (1000 * 60 * 60);
            
            // Jika bot yang terakhir chat (WAIT)
            const lastWasBot = lead.contactHistory && lead.contactHistory.length > 0 && 
                               lead.contactHistory[lead.contactHistory.length-1].direction === 'OUT';
            if (lastWasBot && hoursSince < 24) {
                return { action: PolicyAction.WAIT, reason: 'Cooldown: Tunggu 24 jam setelah bot chat terakhir' };
            }
        }

        // 4. HANDOFF Conditions (Butuh Mas Agus)
        if (['ORDER', 'NEGOTIATION'].includes(salesPhase)) {
            if (lead.offerType && lead.offerType.includes('ENTERPRISE')) {
                return { action: PolicyAction.HANDOFF, reason: 'Volume besar (Enterprise) butuh negosiasi manusia' };
            }
        }
        if (salesPhase === 'ANGRY' || salesPhase === 'COMPLAINT') {
            return { action: PolicyAction.HANDOFF, reason: 'Lead marah/komplain' };
        }

        // 5. PRIORITIZE Conditions (Prospek Panas)
        if (['TIER_1_ENTERPRISE', 'TIER_2_HIGH_YIELD'].includes(lead.score)) {
            if (['INTERESTED', 'ASKED_PRICE'].includes(salesPhase)) {
                return { action: PolicyAction.PRIORITIZE, reason: 'High-yield lead siap dikonversi' };
            }
        }

        // 6. DO Condition (Boleh dilanjutkan)
        return { action: PolicyAction.DO, reason: 'Semua aturan lolos' };
    }
}
