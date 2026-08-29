// src/sales/ProductionReplayEvaluator.mjs
// ProductionReplayEvaluator — Evaluasi percakapan nyata turn demi turn
// Metrik paling berharga: berapa kali AI melakukan sesuatu yang
// manusia sales tidak akan lakukan.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ObjectionIntelligence } from './ObjectionIntelligence.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPLAY_DIR = path.join(__dirname, '../../data/replays');

// Rubrik evaluasi per dimensi (0–10)
const RUBRIC = {
    naturalness:    { weight: 0.20, desc: 'Respons terasa natural / manusiawi' },
    intentAccuracy: { weight: 0.25, desc: 'Bot memahami niat user dengan benar' },
    overtalk:       { weight: 0.15, desc: 'Bot tidak terlalu panjang/bertele-tele' },
    repetition:     { weight: 0.10, desc: 'Bot tidak mengulang pesan yang sama' },
    wrongRec:       { weight: 0.15, desc: 'Rekomendasi/penawaran tepat konteks' },
    handoffTiming:  { weight: 0.15, desc: 'Handoff dilakukan di waktu yang tepat' },
};

export class ProductionReplayEvaluator {
    /**
     * Evaluasi satu percakapan
     * @param {Array} turns - [{ speaker: 'user'|'bot', text: string, timestamp? }]
     * @param {Object} metadata - { leadType, expectedOutcome }
     * @returns {Object} { scores, totalScore, flags, humanWouldntDo, report }
     */
    static evaluate(turns, metadata = {}) {
        if (!turns || turns.length === 0) return { totalScore: 0, flags: [], humanWouldntDo: [] };

        const scores = {};
        const flags = [];
        const humanWouldntDo = [];

        const botTurns = turns.filter(t => t.speaker === 'bot');
        const userTurns = turns.filter(t => t.speaker === 'user');

        // ── 1. Naturalness ────────────────────────────────────────
        let naturalScore = 8;
        const spamSignals = ['segera', 'jangan lewatkan', 'stok terbatas', 'promo'];
        botTurns.forEach(t => {
            if (spamSignals.some(s => t.text.toLowerCase().includes(s))) {
                naturalScore -= 2;
                flags.push(`SPAM_PHRASE: "${t.text.slice(0, 50)}..."`);
                humanWouldntDo.push('Menggunakan frasa promosi seperti brosur — manusia sales tidak akan berbicara seperti ini');
            }
        });
        scores.naturalness = Math.max(0, naturalScore);

        // ── 2. Intent Accuracy ────────────────────────────────────
        let intentScore = 8;
        userTurns.forEach((userTurn, i) => {
            if (!turns[i + 1] || turns[i + 1].speaker !== 'bot') return;
            const botReply = turns[i + 1].text.toLowerCase();
            const userText = userTurn.text.toLowerCase();

            // Objeksi tidak direspon dengan strategi yang tepat
            if (ObjectionIntelligence.isObjection(userText)) {
                const type = ObjectionIntelligence.classify(userText);
                if (type === 'PRICE' && botReply.includes('harga')) {
                    // bagus, merespon harga
                } else if (!botReply.includes('coba') && !botReply.includes('trial') && !botReply.includes('sample') && !botReply.includes('kualitas')) {
                    intentScore -= 1.5;
                    flags.push(`POOR_OBJECTION_HANDLING: ${type}`);
                }
            }
        });
        scores.intentAccuracy = Math.max(0, intentScore);

        // ── 3. Overtalk ───────────────────────────────────────────
        let overtalkScore = 10;
        botTurns.forEach(t => {
            const wordCount = t.text.split(/\s+/).length;
            if (wordCount > 80) {
                overtalkScore -= 3;
                flags.push(`OVERTALK: ${wordCount} kata`);
                humanWouldntDo.push('Mengirim pesan > 80 kata dalam satu turn — terlalu panjang untuk WA');
            } else if (wordCount > 50) {
                overtalkScore -= 1;
            }
        });
        scores.overtalk = Math.max(0, overtalkScore);

        // ── 4. Repetition ─────────────────────────────────────────
        let repScore = 10;
        const seenPhrases = new Set();
        botTurns.forEach(t => {
            const key = t.text.toLowerCase().slice(0, 40);
            if (seenPhrases.has(key)) {
                repScore -= 3;
                flags.push(`REPETITIVE_MESSAGE: "${key}..."`);
                humanWouldntDo.push('Mengirim pesan yang hampir sama berulang kali');
            }
            seenPhrases.add(key);
        });
        scores.repetition = Math.max(0, repScore);

        // ── 5. Wrong Recommendation ───────────────────────────────
        let wrongRecScore = 8;
        // Cek apakah bot menawarkan B2B ke lead WARUNG kecil atau trial ke lead CATERING besar
        if (metadata.leadType === 'WARUNG' && botTurns.some(t => t.text.includes('100 liter') || t.text.includes('B2B'))) {
            wrongRecScore -= 3;
            flags.push('WRONG_OFFER_SIZE: B2B offer ke warung kecil');
            humanWouldntDo.push('Menawarkan kontrak B2B ke warung kecil — terlalu agresif dan tidak relevan');
        }
        scores.wrongRec = Math.max(0, wrongRecScore);

        // ── 6. Handoff Timing ─────────────────────────────────────
        let handoffScore = 8;
        const hasHighValueSignal = turns.some(t => /\b(\d{2,})\s*(liter|L)\b/i.test(t.text) && parseInt(t.text.match(/(\d+)/)?.[1]) >= 50);
        const handoffDone = botTurns.some(t => t.text.includes('tim kami') || t.text.includes('hubungi langsung') || t.text.includes('Mas Agus'));
        if (hasHighValueSignal && !handoffDone) {
            handoffScore -= 3;
            flags.push('MISSED_HANDOFF: High value order not escalated');
            humanWouldntDo.push('Mencoba menutup sendiri order besar tanpa eskalasi ke manusia');
        }
        scores.handoffTiming = handoffScore;

        // ── Kalkulasi total score ─────────────────────────────────
        const totalScore = Object.entries(RUBRIC).reduce((sum, [key, rubric]) => {
            return sum + (scores[key] || 0) * rubric.weight;
        }, 0);

        const report = this._formatReport({ turns, scores, totalScore, flags, humanWouldntDo, metadata });
        return { scores, totalScore: +totalScore.toFixed(2), flags, humanWouldntDo, report };
    }

    static _formatReport({ turns, scores, totalScore, flags, humanWouldntDo, metadata }) {
        const lines = [
            `=== PRODUCTION REPLAY EVALUATION ===`,
            `Lead Type: ${metadata.leadType || 'UNKNOWN'} | Turns: ${turns.length} (${turns.filter(t => t.speaker === 'bot').length} bot)`,
            `Total Score: ${totalScore.toFixed(1)}/10`,
            ``,
            `Dimension Scores:`,
            ...Object.entries(RUBRIC).map(([k, r]) => `  ${k.padEnd(15)} : ${(scores[k] || 0).toFixed(1)}/10  (${r.desc})`),
        ];
        if (flags.length > 0) {
            lines.push(`\nFlags (${flags.length}):`);
            flags.forEach(f => lines.push(`  ⚠️  ${f}`));
        }
        if (humanWouldntDo.length > 0) {
            lines.push(`\n🚨 "AI melakukan sesuatu yang manusia sales tidak akan lakukan" (${humanWouldntDo.length}):`);
            humanWouldntDo.forEach(h => lines.push(`  → ${h}`));
        }
        lines.push(`=====================================`);
        return lines.join('\n');
    }

    /**
     * Evaluasi batch percakapan dari file/folder
     */
    static evaluateBatch(conversations) {
        const results = conversations.map((conv, i) =>
            ({ id: i + 1, ...this.evaluate(conv.turns, conv.metadata) })
        );
        const avgScore = results.reduce((s, r) => s + r.totalScore, 0) / results.length;
        const totalHWD = results.reduce((s, r) => s + r.humanWouldntDo.length, 0);
        console.log(`\n[Replay] ${results.length} percakapan dievaluasi. Avg score: ${avgScore.toFixed(1)}/10. Total HWD issues: ${totalHWD}`);
        return { results, avgScore: +avgScore.toFixed(2), totalHumanWouldntDo: totalHWD };
    }
}
