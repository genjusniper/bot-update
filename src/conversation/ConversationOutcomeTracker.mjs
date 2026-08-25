// src/conversation/ConversationOutcomeTracker.mjs
// Tracks conversational open-loops, commitments, and unresolved plans (e.g. ngopi, panjat, ngaji)
// Ensures follow-up messages like "Sido ora?" or "Jam piro?" immediately connect to the active plan!

import fs from 'fs/promises';
import path from 'path';

export class ConversationOutcomeTracker {
    static getFilePath(chatId) {
        const safeId = chatId.replace(/[^a-zA-Z0-9]/g, '_');
        return path.resolve(process.cwd(), 'memory', 'outcomes', `${safeId}.json`);
    }

    static async loadOutcome(chatId) {
        const filePath = this.getFilePath(chatId);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch {
            return {
                chatId,
                activeTopic: null,
                details: null,
                status: 'IDLE', // 'UNRESOLVED' | 'RESOLVED' | 'IDLE'
                lastUpdated: Date.now()
            };
        }
    }

    static async saveOutcome(chatId, outcome) {
        const filePath = this.getFilePath(chatId);
        try {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(outcome, null, 2), 'utf8');
        } catch (e) {
            console.error('[OutcomeTracker] ⚠️ Error saving outcome:', e.message);
        }
    }

    static async updateFromTurn(chatId, userMessage, assistantReply) {
        const userText = (userMessage || '').toLowerCase();
        const aiText = (assistantReply || '').toLowerCase();
        const combined = `${userText} ${aiText}`;

        const outcome = await this.loadOutcome(chatId);

        // 1. Detect planning / activity keywords (Jawa & Indo)
        const isPlanningIntent = Boolean(combined.match(/(ngopi|mangkat|panjat|climbing|camp|kemah|ngaji|ketemu|dolan|mampir|tuku|gas|sido|sidone|rencana|jam piro|jam berapa|kapan)/i));

        if (isPlanningIntent) {
            // Extract topic summary
            let topic = 'Rencana Kegiatan / Ketemuan';
            if (combined.includes('ngaji')) topic = 'Rencana Ngaji';
            else if (combined.includes('panjat') || combined.includes('climbing')) topic = 'Rencana Panjat Tebing / Climbing';
            else if (combined.includes('camp') || combined.includes('kemah')) topic = 'Rencana Camping';
            else if (combined.includes('ngopi')) topic = 'Rencana Ngopi';
            else if (combined.includes('dolan')) topic = 'Rencana Dolan / Main';

            // Check if resolved (both agreed with time/place) or unresolved
            const isResolved = Boolean(combined.match(/(oke jam|fix jam|deal|berangkat jam|siap meluncur|gas besok|gas sesuk|pokmen|beres)/i));

            outcome.activeTopic = topic;
            outcome.status = isResolved ? 'RESOLVED' : 'UNRESOLVED';
            outcome.details = userMessage.slice(0, 100);
            outcome.lastUpdated = Date.now();

            await this.saveOutcome(chatId, outcome);
            return outcome;
        }

        // If user says closing words and outcome was resolved, reset to IDLE
        if (userText.match(/^(oke|siap|yowes|noted|sip|bye)$/i) && outcome.status === 'RESOLVED') {
            outcome.status = 'IDLE';
            await this.saveOutcome(chatId, outcome);
        }

        return outcome;
    }

    static formatDirectives(outcome) {
        if (!outcome || outcome.status === 'IDLE' || !outcome.activeTopic) {
            return '';
        }

        const ageMinutes = Math.floor((Date.now() - (outcome.lastUpdated || Date.now())) / (60 * 1000));
        // If outcome is older than 24 hours, don't force it
        if (ageMinutes > 24 * 60) return '';

        if (outcome.status === 'UNRESOLVED') {
            return `=== PELACAK RENCANA & JANJI BELUM SELESAI (OUTCOME TRACKER) ===
- Topik Aktif: ${outcome.activeTopic}
- Status: BELUM FINAL / MENGAMBANG (UNRESOLVED)
- Konteks Terakhir: "${outcome.details || ''}" (${ageMinutes} menit yang lalu)
- PANDUAN: Jika user bertanya "Sido ora?", "Jam piro?", "Piye?", ini langsung merujuk pada topik "${outcome.activeTopic}" di atas! Tanggapi dengan nyambung, tegas, dan santai sebagai Mas Agus.
==============================================================`;
        }

        if (outcome.status === 'RESOLVED') {
            return `=== PELACAK RENCANA & JANJI (OUTCOME TRACKER) ===
- Topik: ${outcome.activeTopic} (STATUS: SUDAH SELESAI / FIX)
- Konteks: "${outcome.details || ''}"
==============================================================`;
        }

        return '';
    }
}
