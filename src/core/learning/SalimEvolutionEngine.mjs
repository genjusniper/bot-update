// src/core/learning/SalimEvolutionEngine.mjs
// Continuous Learning, Behavioral Evolution, and Self-Introspection Engine for SALIM OS

import { OutcomeLearningLoop } from './OutcomeLearningLoop.mjs';
import { DecisionOutcomeStore } from '../world/DecisionOutcomeStore.mjs';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data/bot_memory.db');
const outcomeStore = new DecisionOutcomeStore(dbPath);

export class SalimEvolutionEngine {
    static activePreferences = {
        verbosity: 'NORMAL', // 'ULTRA_SHORT' | 'NORMAL' | 'DETAILED'
        tone: 'NATURAL_SEMARANG_JAKSEL', // 'CASUAL' | 'RESPECTFUL' | 'DEADPAN'
        lastReinforcedAt: null
    };

    /**
     * Checks if the message is an introspection query
     * Example: "salim lo udah belajar apa aja", "apa yang lo pelajari", "evaluasi diri"
     * @param {string} text 
     * @returns {boolean}
     */
    static isIntrospectionQuery(text = '') {
        const lower = (text || '').trim().toLowerCase();
        return Boolean(
            lower.match(/^(?:salim\s+)?(?:lo|lu|kamu)?\s*(?:udah|sudah)?\s*(?:belajar|pelajari)\s*(?:apa|hal\s*apa)\s*(?:aja|saja)?\b/i) ||
            lower.match(/^(?:salim\s+)?(?:introspeksi|evaluasi\s*diri|rekap\s*pembelajaran|catatan\s*belajar)\b/i) ||
            lower === 'udah belajar apa aja' ||
            lower === 'lo belajar apa aja'
        );
    }

    /**
     * Inspects inbound message for feedback/correction and updates preference model
     * @param {string} text 
     * @param {string} senderJid 
     * @returns {{ handled: boolean, response?: string, lesson?: Object }}
     */
    static processFeedback(text = '', senderJid = '') {
        const lower = (text || '').trim().toLowerCase();

        // 1. Process via OutcomeLearningLoop
        const lesson = OutcomeLearningLoop.processOutcome({ userReactionText: text });

        if (lesson) {
            console.log('[SalimEvolution] 🧬 New lesson learned:', lesson.category, '->', lesson.directive);

            // Record to SQLite
            outcomeStore.recordDecision({
                decisionId: lesson.lessonId,
                contextSummary: 'User feedback: "' + text + '"',
                decisionMade: lesson.directive,
                rationale: 'Autonomous adaptation based on direct user guidance',
                outcome: 'PREFERENCE_UPDATED',
                lessonLearned: lesson.category + ': ' + lesson.directive
            });

            // Update active in-memory preference
            if (lesson.directive === 'CLAMP_TO_ULTRA_SHORT') {
                this.activePreferences.verbosity = 'ULTRA_SHORT';
                return {
                    handled: true,
                    lesson,
                    response: '💡 *Noted Gus!* Gaya bicara gue udah disetel *lebih padat & singkat*. Ke depan bakal langsung to-the-point tanpa basa-basi.'
                };
            } else if (lesson.directive === 'PERMIT_EXPANDED') {
                this.activePreferences.verbosity = 'DETAILED';
                return {
                    handled: true,
                    lesson,
                    response: '💡 *Siap Gus!* Kalau lo butuh penjelasan mendalam, gue bakal urai lebih komprehensif.'
                };
            } else if (lesson.directive === 'INCREASE_CASUAL_DIALECT') {
                this.activePreferences.tone = 'CASUAL_SEMARANG';
                return {
                    handled: true,
                    lesson,
                    response: '💡 *Sip wae Gus!* Tak buat santai poll koyo biasane, ora kaku-kaku meneh.'
                };
            } else if (lesson.directive === 'REINFORCE_CURRENT_STRATEGY') {
                this.activePreferences.lastReinforcedAt = Date.now();
                return {
                    handled: true,
                    lesson,
                    response: '⚡ *Mantap Gus!* Pola respon ini bakal gue pertahankan buat obrolan kita seterusnya.'
                };
            }
        }

        return { handled: false };
    }

    /**
     * Formats self-introspection report based on real recorded lessons
     * @returns {string}
     */
    static formatIntrospectionReport() {
        const lessons = OutcomeLearningLoop.getLessons();
        const dbDecisions = outcomeStore.getRecentDecisions(5);

        let out = '🪞 *SALIM OS — INTROSPEKSI & REKAP PEMBELAJARAN*\n──────────────────────────────\n';
        out += '🧠 *Preferensi Aktif Saat Ini:*\n';
        out += '• *Verbosity:* ' + (this.activePreferences.verbosity === 'ULTRA_SHORT' ? 'Super Singkat (1-2 bubble)' : 'Normal Seimbang') + '\n';
        out += '• *Gaya Bahasa:* ' + this.activePreferences.tone + ' (Deadpan santai)\n';
        out += '• *Status Konstitusi:* Terkunci (Agus Salim Persona)\n\n';

        out += '📚 *Pelajaran & Koreksi yang Gue Rekam:*\n';
        if (lessons.length === 0 && dbDecisions.length === 0) {
            out += '• Belum ada koreksi khusus dari lo. Sistem saat ini berjalan dalam parameter baseline yang stabil.';
        } else {
            const items = lessons.length > 0 ? lessons.slice(-4) : dbDecisions.slice(-4);
            for (const item of items) {
                const dateStr = new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                const desc = item.directive || item.lesson_learned || 'Adaptasi perilaku';
                out += '• [' + dateStr + '] ' + desc + '\n';
            }
        }

        out += '\n──────────────────────────────\n';
        out += '_Gue terus beradaptasi dari setiap feedback yang lo kasih, Gus!_ 🚀';
        return out.trim();
    }

    /**
     * Returns prompt injection string representing learned preferences
     * @returns {string}
     */
    static getActiveDirectivesPrompt() {
        let p = '\n=== SALIM EVOLVED PREFERENCES ===\n';
        if (this.activePreferences.verbosity === 'ULTRA_SHORT') {
            p += '- STRICT VERBOSITY CLAMP: Jawab super singkat (3-8 kata saja), langsung ke inti tanpa salam atau pembuka!\n';
        } else if (this.activePreferences.verbosity === 'DETAILED') {
            p += '- EXPANDED DEPTH: Berikan uraian yang terstruktur dan detail.\n';
        }
        if (this.activePreferences.tone === 'CASUAL_SEMARANG') {
            p += '- CASUAL DIALECT: Sisipkan celetukan Jawa Semarangan santai (lha piye, santai wae, rasah neko-neko).\n';
        }
        p += '=================================\n';
        return p;
    }
}
