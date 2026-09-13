// src/os/growth/AudiencePersonaEngine.mjs
// ============================================================================
// SALIM OS - AUDIENCE PERSONA ENGINE
// Adapts explanation style based on who is asking (Same Product, Different Story)
// ============================================================================

export class AudiencePersonaEngine {
    /**
     * Detects audience archetype from message history or text
     */
    static detectArchetype(text = '') {
        const lower = text.toLowerCase();

        // 1. Developer / Tech enthusiast
        if (/(?:api|code|coding|stack|framework|baileys|node|fsm|queue|database|backend|github|prompt|llm)/i.test(lower)) {
            return 'DEVELOPER';
        }

        // 2. Agency / Marketer
        if (/(?:agency|agensi|klien|client|proyek|project|white\s*label|reseller|paket\s+jasa|marketing)/i.test(lower)) {
            return 'AGENCY';
        }

        // 3. Enterprise / Corporate
        if (/(?:perusahaan|pt|cv|compliance|audit|keamanan\s+data|kebocoran|sla|sop|manajemen|otorisasi)/i.test(lower)) {
            return 'ENTERPRISE';
        }

        // 4. Default: UMKM / Online Shop / Business Owner
        return 'UMKM_OWNER';
    }

    /**
     * Generates persona explanation directive for the detected audience
     */
    static getExplanationGuidance(archetype) {
        switch (archetype) {
            case 'DEVELOPER':
                return {
                    focus: 'Arsitektur Engine, Finite State Machine (FSM), Queue & DLQ, Idempotency, Tool Registry, Epistemic Guardrail',
                    tone: 'Rekan engineer yang jujur, santai, apresiatif, fokus ke tantangan engineering riil',
                    exampleStory: 'Yang rumit bukan manggil API LLM-nya, tapi bikin event burst aggregator, isolation context, dan failover circuit breaker biar bot gak halusinasi atau looping.'
                };

            case 'AGENCY':
                return {
                    focus: 'Multi-Tenant Architecture, Client Isolation, White-Label Capabilities, Reliable Automation Backend',
                    tone: 'Mitra strategis teknologi, fokus ke kolaborasi win-win',
                    exampleStory: 'Klien agency biasanya butuh hasil yang stabil dan gak bikin malu di depan customer. Sistem ini didesain sebagai backend engine yang aman dan scalable.'
                };

            case 'ENTERPRISE':
                return {
                    focus: 'Granular RBAC Permissions, Approval Center (Human-in-the-loop), Immutable Decision Audit Trail, OWASP Data Isolation',
                    tone: 'Profesional, compliance-conscious, mengutamakan keamanan dan akuntabilitas bisnis',
                    exampleStory: 'Di level bisnis serius, AI tidak boleh punya kekuasaan absolut. AI mengusulkan, kebijakan sistem memvalidasi batas risiko, dan manusia memegang otorisasi akhir.'
                };

            case 'UMKM_OWNER':
            default:
                return {
                    focus: 'Menghemat waktu, jawab chat pelanggan 24 jam tanpa capek, cek stok otomatis, draf pesanan, laporan harian',
                    tone: 'Sahabat pengusaha yang membumi, bahasa sederhana tanpa istilah teknis rumit',
                    exampleStory: 'Biar kamu gak pusing jawab pertanyaan stok atau harga yang sama ratusan kali sehari, dan bisa fokus kembangin bisnis atau istirahat tenang.'
                };
        }
    }
}
