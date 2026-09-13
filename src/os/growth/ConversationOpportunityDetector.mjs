// src/os/growth/ConversationOpportunityDetector.mjs
// ============================================================================
// SALIM OS - CONVERSATION OPPORTUNITY DETECTOR
// Opportunity-aware classification: detects commercial interest without spamming
// ============================================================================

export class ConversationOpportunityDetector {
    /**
     * Evaluates incoming message for commercial / collaboration opportunities
     */
    static evaluate(text = '') {
        const lower = text.toLowerCase().trim();

        // 1. RENTAL / PRICING / BUYING SIGNALS (High Priority)
        if (/(?:bisa\s+)?(?:disewa|sewa|berlangganan|langganan|beli|order\s+bot|bikin\s+kayak\s+gini|jual\s+gak|biayanya\s+berapa|harganya\s+berapa)/i.test(lower)) {
            return {
                category: 'RENTAL_INTEREST',
                score: 0.95,
                posture: 'QUALIFY_AND_HANDOFF',
                actionable: true,
                intent: 'User tertarik menyewa / membeli sistem bot'
            };
        }

        // 2. COLLABORATION / AGENCY SIGNALS
        if (/(?:punya\s+agency|punya\s+klien|ada\s+projek|proyek|kolaborasi|kerjasama|bagi\s+hasil|white\s*label|partner)/i.test(lower)) {
            return {
                category: 'COLLAB_INTEREST',
                score: 0.90,
                posture: 'ENGAGE_COLLAB_DISCOVERY',
                actionable: true,
                intent: 'User menawarkan kolaborasi proyek atau agensi'
            };
        }

        // 3. USE-CASE FIT / APPLICABILITY TO USER'S BUSINESS
        if (/(?:buat|untuk)\s+(?:toko|bisnis|usaha|umkm|kantor|perusahaan|gudang|resto|warung|olshop)\s+(?:saya|aku|kami|gue)\s+(?:bisa|cocok|masuk)\s*(?:nggak|gak|ga)?/i.test(lower) ||
            /(?:bisa\s+buat|bisa\s+untuk)\s+(?:toko|bisnis|cs|admin|customer\s+service)/i.test(lower)) {
            return {
                category: 'BUYING_SIGNAL',
                score: 0.88,
                posture: 'ENGAGE_SOLUTION_DISCOVERY',
                actionable: true,
                intent: 'User menanyakan kecocokan bot untuk bisnis spesifiknya'
            };
        }

        // 4. OBJECTIONS / SKEPTICISM
        if (/(?:pasti\s+mahal|ribet\s+kayaknya|apa\s+bedanya\s+sama\s+bot\s+lain|takut\s+salah\s+jawab|ai\s+kan\s+suka\s+ngarang|aman\s+gak\s+datanya)/i.test(lower)) {
            return {
                category: 'OBJECTION',
                score: 0.75,
                posture: 'HANDLE_OBJECTION_WITH_VALUE',
                actionable: true,
                intent: 'User memiliki keraguan soal harga, keamanan, atau keakuratan'
            };
        }

        // 5. PRODUCT CAPABILITY INTEREST
        if (/(?:emang\s+)?(?:botmu|botnya|salim)\s+(?:bisa\s+apa\s+aja|fiturnya\s+apa|kemampuannya\s+apa|fungsinya\s+apa)/i.test(lower) ||
            /(?:bisa\s+ngapain\s+aja)/i.test(lower)) {
            return {
                category: 'PRODUCT_INTEREST',
                score: 0.70,
                posture: 'SHARE_STORY_AND_DEMO',
                actionable: true,
                intent: 'User penasaran dengan kapabilitas dan studi kasus sistem'
            };
        }

        // 6. TECHNICAL CURIOSITY
        if (/(?:bikin\s+sendiri|pakai\s+stack\s+apa|pakai\s+baileys|pakai\s+langchain|arsitekturnya\s+gimana|coding\s+sendiri)/i.test(lower)) {
            return {
                category: 'TECH_DISCUSSION',
                score: 0.60,
                posture: 'DEVELOPER_INSIGHT',
                actionable: true,
                intent: 'User berlatar belakang teknis yang mengagumi arsitektur'
            };
        }

        // 7. CASUAL DISCUSSION (General praise or chatter about AI)
        if (/(?:bot\s+sekarang\s+makin\s+(?:pinter|canggih)|keren\s+juga\s+botnya|ai\s+jaman\s+sekarang)/i.test(lower)) {
            return {
                category: 'CURIOSITY',
                score: 0.40,
                posture: 'CASUAL_THOUGHTFUL_REPLY',
                actionable: false,
                intent: 'Obrolan santai, belum ada sinyal kebutuhan bisnis'
            };
        }

        // 8. NOISE / UNRELATED
        return {
            category: 'NOISE',
            score: 0.05,
            posture: 'STAY_SILENT',
            actionable: false,
            intent: 'Obrolan tidak relevan dengan bot atau bisnis'
        };
    }
}
