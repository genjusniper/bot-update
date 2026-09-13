// src/os/intel/GroupChatSummarizer.mjs
// Executive Group Chat Summarizer for Salim OS
// Scans local SQLite raw ingress events and summarizes 50-100 group messages using Gemini Flash Lite

import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import { OwnerMentionResolver } from '../../security/copilot/OwnerMentionResolver.mjs';

export class GroupChatSummarizer {
    static db = null;
    static initialized = false;

    static init(dbPath) {
        if (this.initialized && this.db) return;
        const targetPath = dbPath || path.resolve(process.cwd(), 'memory', 'queue_v10.sqlite');
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        this.db = new DatabaseSync(targetPath);
        this.initialized = true;
    }

    /**
     * Resolves group subject and JID from name query or direct JID
     * @param {string} query 
     * @param {any} [waGateway]
     * @returns {Promise<{ jid: string, name: string } | null>}
     */
    static async resolveGroup(query, waGateway = null) {
        if (!query) return null;
        const cleanQuery = query.trim().toLowerCase();

        // 1. Direct JID
        if (cleanQuery.endsWith('@g.us')) {
            return { jid: cleanQuery, name: cleanQuery };
        }

        // 2. Lookup in personal_contact_policy.json
        try {
            const policyPath = path.resolve(process.cwd(), 'config', 'personal_contact_policy.json');
            if (fs.existsSync(policyPath)) {
                const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
                const groups = policy.groups || {};

                for (const [jid, data] of Object.entries(groups)) {
                    const gName = (data.name || '').toLowerCase();
                    if (gName.includes(cleanQuery) || cleanQuery.includes(gName)) {
                        return { jid, name: data.name || jid };
                    }
                }
            }
        } catch (e) {
            console.warn('[GroupSummarizer] ⚠️ Could not read policy:', e.message);
        }

        // 3. Lookup in waGateway socket if available
        if (waGateway?.sock?.groupFetchAllParticipating) {
            try {
                const participating = await waGateway.sock.groupFetchAllParticipating();
                for (const [jid, meta] of Object.entries(participating || {})) {
                    const subject = (meta.subject || '').toLowerCase();
                    if (subject.includes(cleanQuery) || cleanQuery.includes(subject)) {
                        return { jid, name: meta.subject || jid };
                    }
                }
            } catch (e) {
                // ignore
            }
        }

        return null;
    }

    /**
     * Summarizes recent messages from a group
     * @param {{ queryOrChatId: string, waGateway?: any, hoursAgo?: number, maxMessages?: number }} options
     * @returns {Promise<string>}
     */
    static async summarize({ queryOrChatId, waGateway = null, hoursAgo = 8, maxMessages = 80 }) {
        if (!this.initialized) this.init();

        const resolved = await this.resolveGroup(queryOrChatId, waGateway);
        if (!resolved) {
            return `❌ Grup *"${queryOrChatId}"* tidak ditemukan di daftar grup aktif. Pastikan nama grup sesuai (contoh: \`!rangkum PELETBENTO\` atau \`!rangkum GeForteX\`).`;
        }

        const since = Date.now() - (hoursAgo * 60 * 60 * 1000);
        const stmt = this.db.prepare(`
            SELECT sender_id, created_at, canonical_payload 
            FROM raw_ingress_events 
            WHERE chat_id = ? AND created_at >= ?
            ORDER BY id ASC
            LIMIT ?
        `);
        const rows = stmt.all(resolved.jid, since, maxMessages);

        if (!rows || rows.length < 3) {
            return `ℹ️ Obrolan di grup *${resolved.name}* masih relatif sepi dalam ${hoursAgo} jam terakhir (hanya ada ${rows ? rows.length : 0} pesan tercatat).`;
        }

        // Format message lines for Gemini
        const formattedLines = [];
        let ownerMentionCount = 0;

        for (const r of rows) {
            try {
                const payload = JSON.parse(r.canonical_payload);
                const text = (payload.text || '').trim();
                if (!text || text === '[Media/Foto/VN]') continue;

                const timeStr = new Date(r.created_at).toLocaleTimeString('id-ID', {
                    hour: '2-digit', minute: '2-digit', hour12: false
                });

                const isOwner = OwnerMentionResolver.isOwnerIdentifier(r.sender_id);
                const senderLabel = isOwner ? 'Bos Agus' : r.sender_id.split('@')[0];

                // Check if this message mentions owner
                if (text.toLowerCase().includes('agus') || text.toLowerCase().includes('gus') || text.toLowerCase().includes('salim') || r.canonical_payload.includes('232680004292808') || r.canonical_payload.includes('6285741318412')) {
                    ownerMentionCount++;
                }

                formattedLines.push(`[${timeStr}] ${senderLabel}: ${text}`);
            } catch (e) {
                // skip corrupt json
            }
        }

        if (formattedLines.length < 3) {
            return `ℹ️ Belum cukup percakapan teks yang bermakna di grup *${resolved.name}* untuk dirangkum.`;
        }

        const transcript = formattedLines.slice(-70).join('\n');
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return `⚠️ API Key Gemini belum terkonfigurasi. Tidak dapat memproses ringkasan AI.`;
        }

        const prompt = `Kamu adalah intelijen pribadi & asisten setia Bos Agus Salim.
Tugasmu: Rangkum percakapan grup WhatsApp berikut secara padat, tajam, dan informatif.

NAMA GRUP: ${resolved.name}
JUMLAH PESAN: ${formattedLines.length} pesan dalam ${hoursAgo} jam terakhir
MENTION NAMA BOS: ${ownerMentionCount > 0 ? `${ownerMentionCount} kali disebut` : 'Tidak ada'}

REKAMAN OBROLAN:
"""
${transcript}
"""

FORMAT OUTPUT WAJIB (Gunakan bahasa Indonesia santai, padat, gaya Co-Pilot cerdas):
📢 *RINGKASAN INTELIJEN GRUP: ${resolved.name}*
━━━━━━━━━━━━━━━━━━
📌 *Topik Utama:* (1-2 kalimat)
💬 *Poin-Poin Penting:*
• (Poin 1)
• (Poin 2)
• (Poin 3)
🔔 *Atensi untuk Bos:* (${ownerMentionCount > 0 ? 'Ada yang menyebut nama Bos / butuh respon' : 'Aman, tidak ada urusan mendesak yang mencari Bos'})
━━━━━━━━━━━━━━━━━━
_Rangkuman otomatis Salim OS._`;

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 600
                    }
                }),
                signal: AbortSignal.timeout(12000)
            });

            if (!res.ok) {
                throw new Error(`Gemini API returned ${res.status}`);
            }

            const data = await res.json();
            const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            return summary || '❌ Gagal menghasilkan ringkasan dari model AI.';
        } catch (err) {
            console.error('[GroupSummarizer] ❌ Summarization failed:', err.message);
            return `❌ Terjadi kendala saat merangkum obrolan: ${err.message}`;
        }
    }
}
