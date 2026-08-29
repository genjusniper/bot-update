// src/sales/SalesCommandOS.mjs
// SalesCommandOS — Operator control Sales OS via WhatsApp command

import { LeadCRM } from './LeadCRM.mjs';
import { LeadDiscoveryAgent } from './LeadDiscoveryAgent.mjs';
import { FollowUpEngine } from './FollowUpEngine.mjs';
import { SalesAnalyticsEngine } from './SalesAnalyticsEngine.mjs';
import { BlacklistManager, BlacklistReason } from './BlacklistManager.mjs';
import { ConsentOutreachGuard } from './ConsentOutreachGuard.mjs';

// Nomor operator yang diizinkan (dari env)
const OPERATOR_PHONES = (process.env.OPERATOR_PHONE || '').split(',').map(p => p.trim()).filter(Boolean);

export class SalesCommandOS {
    /**
     * Cek apakah chatId ini adalah nomor operator
     */
    static isOperator(phone) {
        if (!phone) return false;
        const normalized = phone.replace('@s.whatsapp.net', '');
        return OPERATOR_PHONES.some(op => op.replace('@s.whatsapp.net', '') === normalized);
    }

    /**
     * Parse & jalankan command dari operator
     * @param {string} text - pesan dari operator
     * @param {Function} sendMessageFn - async (phone, msg) => void
     * @param {string} operatorPhone - nomor operator untuk membalas
     * @returns {Object} { handled, response }
     */
    static async execute(text, sendMessageFn, operatorPhone) {
        const lower = (text || '').trim().toLowerCase();

        // ── 1. LAPORAN SALES ─────────────────────────────────────
        if (lower.match(/^laporan|^report|^rekap|^rangkuman/)) {
            const report = SalesAnalyticsEngine.formatReport();
            await sendMessageFn(operatorPhone, report);
            return { handled: true, response: report };
        }

        // ── 2. CARI LEAD ─────────────────────────────────────────
        const searchMatch = lower.match(/^cari\s+(\d+)?\s*(katering|warung|lead|bisnis)?\s*(?:daerah|di|area)?\s*(.+)/i);
        if (searchMatch) {
            const maxLeads = parseInt(searchMatch[1]) || 20;
            const city = searchMatch[3]?.trim() || 'Surabaya';
            const reply = `🔍 Mencari hingga ${maxLeads} lead di ${city}...\nHasilnya akan dikirim setelah selesai.`;
            await sendMessageFn(operatorPhone, reply);

            // Jalankan di background
            LeadDiscoveryAgent.discover({ city, maxLeads }).then(async (leads) => {
                const summary = [
                    `✅ Discovery selesai untuk *${city}*`,
                    `Ditemukan: *${leads.length} lead* yang lolos kualifikasi`,
                    ...leads.slice(0, 5).map((l, i) => `${i + 1}. ${l.businessName} (${l.score}) — ${l.location}`),
                    leads.length > 5 ? `... dan ${leads.length - 5} lead lainnya` : '',
                ].filter(Boolean).join('\n');
                await sendMessageFn(operatorPhone, summary);
            }).catch(e => sendMessageFn(operatorPhone, `❌ Discovery error: ${e.message}`));

            return { handled: true, response: reply };
        }

        // ── 3. FOLLOW-UP SEMUA ───────────────────────────────────
        if (lower.match(/^follow.?up|^followup/)) {
            const dueLeads = LeadCRM.getDueFollowUps();
            if (dueLeads.length === 0) {
                const reply = '✅ Tidak ada lead yang perlu di-follow-up sekarang.';
                await sendMessageFn(operatorPhone, reply);
                return { handled: true, response: reply };
            }
            const reply = `📤 Menjalankan follow-up ke *${dueLeads.length} lead*...`;
            await sendMessageFn(operatorPhone, reply);
            FollowUpEngine.runDueFollowUps(sendMessageFn).then(sent => {
                sendMessageFn(operatorPhone, `✅ Follow-up selesai. Terkirim ke: ${sent.length} lead.`);
            });
            return { handled: true, response: reply };
        }

        // ── 4. BLACKLIST NOMOR ───────────────────────────────────
        const blMatch = lower.match(/^blacklist\s+(\d{9,13})/);
        if (blMatch) {
            const phone = `62${blMatch[1].replace(/^0/, '')}@s.whatsapp.net`;
            BlacklistManager.add(phone, BlacklistReason.DO_NOT_CONTACT, 'Diblacklist oleh operator');
            const reply = `🚫 Nomor ${blMatch[1]} ditambahkan ke blacklist permanen.`;
            await sendMessageFn(operatorPhone, reply);
            return { handled: true, response: reply };
        }

        // ── 5. STATUS LEAD ───────────────────────────────────────
        const statusMatch = lower.match(/^status\s+(\d{9,13})/);
        if (statusMatch) {
            const phone = `62${statusMatch[1].replace(/^0/, '')}@s.whatsapp.net`;
            const lead = LeadCRM.load(phone);
            if (!lead) {
                const reply = `❓ Lead ${statusMatch[1]} tidak ditemukan di CRM.`;
                await sendMessageFn(operatorPhone, reply);
                return { handled: true, response: reply };
            }
            const reply = [
                `📋 *Status Lead: ${lead.businessName}*`,
                `Status : ${lead.status}`,
                `Skor   : ${lead.score}`,
                `Lokasi : ${lead.location || '-'}`,
                `Follow-up: ${lead.followUpCount || 0}x`,
                `Kontak terakhir: ${lead.lastContact ? new Date(lead.lastContact).toLocaleDateString('id-ID') : '-'}`,
            ].join('\n');
            await sendMessageFn(operatorPhone, reply);
            return { handled: true, response: reply };
        }

        // ── 6. RATE LIMIT STATUS ─────────────────────────────────
        if (lower.match(/^rate|^limit|^quota/)) {
            const status = ConsentOutreachGuard.getRateLimitStatus();
            const reply = `📊 *Rate Limit Status*\nTerkirim jam ini: ${status.sentThisHour}/${status.maxPerHour}\nSisa: ${status.remaining}\nCooldown: ${status.cooldownDays} hari`;
            await sendMessageFn(operatorPhone, reply);
            return { handled: true, response: reply };
        }

        // ── 7. HELP ──────────────────────────────────────────────
        if (lower.match(/^help|^bantuan|^\?$/)) {
            const reply = [
                `🤖 *Sales Command OS — Perintah yang tersedia:*`,
                ``,
                `\`laporan\` — Laporan funnel hari ini`,
                `\`cari 30 katering daerah Semarang\` — Cari lead baru`,
                `\`follow up\` — Jalankan follow-up yang jatuh tempo`,
                `\`blacklist 08123xxx\` — Blacklist nomor`,
                `\`status 08123xxx\` — Cek status lead`,
                `\`rate\` — Cek sisa kuota outreach`,
            ].join('\n');
            await sendMessageFn(operatorPhone, reply);
            return { handled: true, response: reply };
        }

        return { handled: false, response: null };
    }
}
