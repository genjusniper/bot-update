/**
 * PersonalizationEngine.mjs
 * 
 * Deep personalization matrix:
 * Persona + Communication Style + Technical Level + Business Maturity + Decision Style
 * 
 * Maps business explanations into 4 distinct linguistic registers:
 * - DEVELOPER: High technical depth, low fluff, high architecture detail
 * - UMKM: Low technical depth, high outcome focus, concrete examples
 * - AGENCY: High white-label focus, multi-client, API/webhook capabilities
 * - ENTERPRISE: High security/governance focus, audit trail, SLA, RBAC
 */

export class PersonalizationEngine {
    static ARCHETYPES = {
        DEVELOPER: {
            technicalDepth: 'HIGH',
            outcomeFocus: 'MEDIUM',
            architectureDetail: 'HIGH',
            whiteLabelFocus: 'LOW',
            governanceFocus: 'MEDIUM',
            vocabulary: 'technical'
        },
        UMKM: {
            technicalDepth: 'LOW',
            outcomeFocus: 'HIGH',
            architectureDetail: 'LOW',
            whiteLabelFocus: 'LOW',
            governanceFocus: 'LOW',
            vocabulary: 'outcome_driven'
        },
        AGENCY: {
            technicalDepth: 'MEDIUM',
            outcomeFocus: 'HIGH',
            architectureDetail: 'MEDIUM',
            whiteLabelFocus: 'HIGH',
            governanceFocus: 'MEDIUM',
            vocabulary: 'partnership'
        },
        ENTERPRISE: {
            technicalDepth: 'MEDIUM',
            outcomeFocus: 'HIGH',
            architectureDetail: 'HIGH',
            whiteLabelFocus: 'MEDIUM',
            governanceFocus: 'HIGH',
            vocabulary: 'compliance_and_sla'
        }
    };

    /**
     * Infer persona profile from message context
     */
    static inferProfile(text, history = []) {
        const clean = (text || '').trim().toLowerCase();

        if (/api|webhook|endpoint|payload|jwt|bearer|fsm|esm|async|latency|pm2/i.test(clean)) {
            return { archetype: 'DEVELOPER', ...this.ARCHETYPES.DEVELOPER };
        }
        if (/klien\s*kami|agensi|white\s*label|reseller|buat\s*brand\s*sendiri/i.test(clean)) {
            return { archetype: 'AGENCY', ...this.ARCHETYPES.AGENCY };
        }
        if (/sla|audit|iso|rbac|compliance|kontrak|perusahaan|legal/i.test(clean)) {
            return { archetype: 'ENTERPRISE', ...this.ARCHETYPES.ENTERPRISE };
        }
        // Default to UMKM / Operator focus
        return { archetype: 'UMKM', ...this.ARCHETYPES.UMKM };
    }

    /**
     * Adapt explanation based on persona profile
     */
    static formatExplanation(concept, archetype) {
        if (concept === 'APPROVAL_QUEUE') {
            switch (archetype) {
                case 'DEVELOPER':
                    return 'Sistem menggunakan event-driven approval queue sebelum state mutation dieksekusi. Perubahan harga atau refund menahan token hingga ditandatangani Bos via WhatsApp webhook.';
                case 'UMKM':
                    return 'Kalau bot disuruh ubah harga atau balikin uang pelanggan, dia nggak akan langsung asal potong. Dia kirim kartu konfirmasi ke WA pribadi Mas dulu buat dipencet setuju. Jadi toko tetap aman.';
                case 'AGENCY':
                    return 'Setiap aksi berisiko tinggi memiliki approval gate berbasis peran, sehingga tim Anda atau klien Anda memegang kendali penuh tanpa takut bot melakukan kesalahan fatal.';
                case 'ENTERPRISE':
                    return 'Fitur Two-Man Rule dan Granular RBAC memastikan semua mutasi berisiko tinggi melewati approval gate yang tercatat dalam Decision Audit Trail yang immutable.';
            }
        }
        return null;
    }
}
