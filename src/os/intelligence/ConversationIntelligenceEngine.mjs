/**
 * ConversationIntelligenceEngine.mjs
 * 
 * Analyzes conversational context beyond surface keywords:
 * - Intent & Seriousness (0.0 to 1.0)
 * - Stage (AWARENESS, PROBLEM_DISCOVERY, SOLUTION_EXPLORATION, EVALUATION, COMMERCIAL_NEGOTIATION, RETENTION)
 * - Need, Pain Points, Objections, Emotional Tone, Buying Signals
 * - Latent unspoken need & Confidence level
 */

export class ConversationIntelligenceEngine {
    static STAGES = {
        AWARENESS: 'AWARENESS',
        PROBLEM_DISCOVERY: 'PROBLEM_DISCOVERY',
        SOLUTION_EXPLORATION: 'SOLUTION_EXPLORATION',
        EVALUATION: 'EVALUATION',
        COMMERCIAL_NEGOTIATION: 'COMMERCIAL_NEGOTIATION',
        RETENTION: 'RETENTION'
    };

    static INTENTS = {
        RENTAL_INTEREST: 'RENTAL_INTEREST',
        COLLAB_INTEREST: 'COLLAB_INTEREST',
        PRODUCT_INQUIRY: 'PRODUCT_INQUIRY',
        TECHNICAL_ARCHITECTURE: 'TECHNICAL_ARCHITECTURE',
        OBJECTION_PRICING: 'OBJECTION_PRICING',
        OBJECTION_RELIABILITY: 'OBJECTION_RELIABILITY',
        OBJECTION_SECURITY: 'OBJECTION_SECURITY',
        HUMAN_HANDOFF_REQUEST: 'HUMAN_HANDOFF_REQUEST',
        PASSIVE_CLOSING: 'PASSIVE_CLOSING',
        CASUAL_CHAT: 'CASUAL_CHAT'
    };

    /**
     * Analyze message text and conversation history
     */
    static analyze(text, history = []) {
        const clean = (text || '').trim().toLowerCase();
        
        // 1. Detect Emotional Tone
        const emotionalTone = this._detectTone(clean);

        // 2. Detect Pain Points
        const painPoints = this._detectPainPoints(clean);

        // 3. Detect Objections
        const objections = this._detectObjections(clean);

        // 4. Detect Buying Signals
        const buyingSignals = this._detectBuyingSignals(clean);

        // 5. Determine Need
        const need = this._detectNeed(clean, painPoints);

        // 6. Determine Intent & Seriousness
        const { intent, seriousness } = this._detectIntentAndSeriousness(clean, buyingSignals, objections);

        // 7. Determine Conversation Stage
        const stage = this._determineStage(clean, intent, buyingSignals, history);

        // 8. Unspoken Latent Need / Context
        const latentUnspokenNeed = this._deduceLatentNeed(stage, objections, painPoints);

        // 9. Overall Confidence
        const confidence = this._calculateConfidence(clean, intent, painPoints, buyingSignals);

        return {
            intent,
            seriousness,
            stage,
            need,
            painPoints,
            objections,
            emotionalTone,
            buyingSignals,
            latentUnspokenNeed,
            confidence
        };
    }

    static _detectTone(clean) {
        if (/frustasi|capek|pusing|boncos|ribet|lelet|berantakan|kacau|error mulu/i.test(clean)) return 'FRUSTRATED';
        if (/penasaran|kok bisa|gimana caranya|emang beneran|arsitekturnya/i.test(clean)) return 'CURIOUS';
        if (/ragu|beneran gak|takut salah|takut halusinasi|aman gak/i.test(clean)) return 'SKEPTICAL';
        if (/tertarik|minat|butuh banget|mau pasang|kapan bisa mulai/i.test(clean)) return 'EAGER';
        if (/wkwk|hehe|lucu|coba tes|iseng/i.test(clean)) return 'PLAYFUL';
        return 'NEUTRAL';
    }

    static _detectPainPoints(clean) {
        const points = [];
        if (/slow\s*respon|balas\s*lama|chat\s*numpuk|nggak\s*kebalas|overload|capek\s*balas/i.test(clean)) {
            points.push('customer_response_delay');
        }
        if (/admin\s*mahal|gaji\s*admin|shift\s*malam|pegawai\s*keluar|turnover/i.test(clean)) {
            points.push('admin_labor_cost');
        }
        if (/halusinasi|jawaban\s*ngaco|salah\s*jawab|takut\s*rusak\s*brand|salah\s*harga/i.test(clean)) {
            points.push('ai_hallucination_fear');
        }
        if (/data\s*bocor|aman\s*nggak|privasi|enkripsi|database/i.test(clean)) {
            points.push('data_security_privacy');
        }
        if (/stok\s*selisih|pesanan\s*nyasar|rekap\s*manual|excel\s*berantakan/i.test(clean)) {
            points.push('manual_operations_bottleneck');
        }
        return points;
    }

    static _detectObjections(clean) {
        const obj = [];
        if (/mahal|budget\s*minim|kemahalan|biaya\s*berapa|ada\s*gratisan|harga\s*pelajar/i.test(clean)) {
            obj.push('price_uncertainty');
        }
        if (/salah\s*jawab|jawaban\s*ngawur|gimana\s*kalau\s*halusinasi|bisa\s*dipercaya\s*gak/i.test(clean)) {
            obj.push('reliability_trust');
        }
        if (/susah\s*setup|harus\s*coding|ribet\s*setting|ga\s*bisa\s*teknis/i.test(clean)) {
            obj.push('technical_complexity');
        }
        return obj;
    }

    static _detectBuyingSignals(clean) {
        const signals = [];
        if (/bisa\s*custom|bisa\s*disesuaikan|bisa\s*koneksi\s*ke|integrasi/i.test(clean)) {
            signals.push('asks_about_customization');
        }
        if (/berapa\s*sewa|biaya|sewa|pricelist|paket\s*apa\s*aja|tarif|harga|budget/i.test(clean)) {
            signals.push('asks_about_price');
        }
        if (/ada\s*demo|bisa\s*coba\s*dulu|trial|tester/i.test(clean)) {
            signals.push('requests_demo_trial');
        }
        if (/kontak\s*owner|nomor\s*mas\s*agus|mau\s*ngobrol\s*sama\s*yang\s*bikin/i.test(clean)) {
            signals.push('requests_direct_contact');
        }
        return signals;
    }

    static _detectNeed(clean, painPoints) {
        if (painPoints.includes('customer_response_delay') || /toko\s*online|cs\s*otomatis|balas\s*wa/i.test(clean)) {
            return 'automated_customer_support';
        }
        if (painPoints.includes('manual_operations_bottleneck') || /integrasi\s*stok|rekap\s*order|operasional/i.test(clean)) {
            return 'business_operations_automation';
        }
        if (/buat\s*klien|reseller|white\s*label|agensi/i.test(clean)) {
            return 'agency_client_deployment';
        }
        if (/arsitektur|flow|fsm|multi-tenant|prompt\s*injection/i.test(clean)) {
            return 'technical_architecture_evaluation';
        }
        return 'general_inquiry';
    }

    static _detectIntentAndSeriousness(clean, signals, objections) {
        if (/kontak\s*owner|bicara\s*ke\s*agus|nomor\s*wa\s*bos/i.test(clean)) {
            return { intent: this.INTENTS.HUMAN_HANDOFF_REQUEST, seriousness: 0.95 };
        }
        if (/sewa|langganan|pasang\s*di\s*toko|pakai\s*buat\s*bisnis/i.test(clean)) {
            const score = 0.75 + (signals.length * 0.08);
            return { intent: this.INTENTS.RENTAL_INTEREST, seriousness: Math.min(score, 0.98) };
        }
        if (/kolaborasi|partner|agensi|white\s*label|bikin\s*bareng/i.test(clean)) {
            return { intent: this.INTENTS.COLLAB_INTEREST, seriousness: 0.88 };
        }
        if (objections.length > 0) {
            return { intent: this.INTENTS.OBJECTION_PRICING, seriousness: 0.70 };
        }
        if (/bisa\s*(?:buat|dipakai|integrasi)|fiturnya\s*apa/i.test(clean)) {
            return { intent: this.INTENTS.PRODUCT_INQUIRY, seriousness: 0.65 };
        }
        if (/arsitektur|memory|engine|code|flow/i.test(clean)) {
            return { intent: this.INTENTS.TECHNICAL_ARCHITECTURE, seriousness: 0.75 };
        }
        if (/oke\s*makasih|siap\s*makasih|noted|nanti\s*dikabari/i.test(clean)) {
            return { intent: this.INTENTS.PASSIVE_CLOSING, seriousness: 0.20 };
        }
        return { intent: this.INTENTS.CASUAL_CHAT, seriousness: 0.40 };
    }

    static _determineStage(clean, intent, signals, history) {
        if (intent === this.INTENTS.HUMAN_HANDOFF_REQUEST || signals.includes('requests_direct_contact')) {
            return this.STAGES.COMMERCIAL_NEGOTIATION;
        }
        if (signals.includes('requests_demo_trial')) {
            return this.STAGES.EVALUATION;
        }
        if (signals.includes('asks_about_price') || signals.includes('asks_about_customization')) {
            return this.STAGES.SOLUTION_EXPLORATION;
        }
        if (/masalah|capek|pusing|butuh/i.test(clean)) {
            return this.STAGES.PROBLEM_DISCOVERY;
        }
        return this.STAGES.AWARENESS;
    }

    static _deduceLatentNeed(stage, objections, painPoints) {
        if (objections.includes('reliability_trust')) {
            return 'needs_proof_of_anti_hallucination_safeguards';
        }
        if (objections.includes('price_uncertainty')) {
            return 'needs_roi_justification_before_price_quote';
        }
        if (painPoints.includes('customer_response_delay')) {
            return 'wants_peace_of_mind_when_sleeping_or_offline';
        }
        return 'needs_clear_scope_before_commitment';
    }

    static _calculateConfidence(clean, intent, painPoints, buyingSignals) {
        let score = 0.50;
        if (clean.length > 20) score += 0.15;
        if (painPoints.length > 0) score += 0.15;
        if (buyingSignals.length > 0) score += 0.15;
        if (intent !== this.INTENTS.CASUAL_CHAT) score += 0.05;
        return Math.min(score, 0.98);
    }
}
