// src/sales/ConsentOutreachGuard.mjs
// ConsentOutreachGuard — Layer penjaga sebelum pesan outreach dikirim
// Setiap outreach WAJIB melewati guard ini.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BlacklistManager, BlacklistReason } from './BlacklistManager.mjs';
import { LeadCRM } from './LeadCRM.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RATE_LOG_FILE = path.join(__dirname, '../../data/outreach_rate.json');

// Konfigurasi default (override via env)
const CONFIG = {
    maxPerHour:       parseInt(process.env.OUTREACH_MAX_PER_HOUR  || '10'),
    cooldownDays:     parseInt(process.env.OUTREACH_COOLDOWN_DAYS || '7'),
    senderPhone:      process.env.BOT_PHONE || 'bot',
};

export const GuardResult = {
    ALLOWED:         'ALLOWED',
    BLOCKED_BLACKLIST: 'BLOCKED_BLACKLIST',
    BLOCKED_RATE:    'BLOCKED_RATE',
    BLOCKED_COOLDOWN:'BLOCKED_COOLDOWN',
    BLOCKED_OPT_OUT: 'BLOCKED_OPT_OUT',
};

export class ConsentOutreachGuard {
    // ─────────────────────────────────────────────
    // PUBLIC: Cek apakah boleh outreach ke nomor ini
    // ─────────────────────────────────────────────
    static check(targetPhone) {
        // 1. Blacklist check
        if (BlacklistManager.isBlacklisted(targetPhone)) {
            const entry = BlacklistManager.get(targetPhone);
            return { allowed: false, result: GuardResult.BLOCKED_BLACKLIST, reason: `Blacklisted: ${entry.reason}` };
        }

        // 2. Rate limit check (per jam)
        const rateOk = this._checkRateLimit();
        if (!rateOk) {
            return { allowed: false, result: GuardResult.BLOCKED_RATE, reason: `Rate limit: max ${CONFIG.maxPerHour} pesan/jam` };
        }

        // 3. Cooldown check
        const lead = LeadCRM.load(targetPhone);
        if (lead?.lastContact) {
            const last = new Date(lead.lastContact);
            const diffDays = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays < CONFIG.cooldownDays) {
                const remaining = Math.ceil(CONFIG.cooldownDays - diffDays);
                return { allowed: false, result: GuardResult.BLOCKED_COOLDOWN, reason: `Cooldown: ${remaining} hari lagi` };
            }
        }

        return { allowed: true, result: GuardResult.ALLOWED, reason: 'OK' };
    }

    // ─────────────────────────────────────────────
    // PUBLIC: Catat outreach yang berhasil terkirim
    // ─────────────────────────────────────────────
    static recordSent(targetPhone) {
        this._incrementRateLog();
        console.log(`[OutreachGuard] 📤 Recorded outreach → ${targetPhone}`);
    }

    // ─────────────────────────────────────────────
    // PUBLIC: Proses pesan MASUK — cek opt-out
    // Panggil ini setiap kali ada reply dari lead
    // ─────────────────────────────────────────────
    static processIncoming(phone, text) {
        if (BlacklistManager.detectOptOut(text)) {
            BlacklistManager.add(phone, BlacklistReason.DO_NOT_CONTACT, `Opt-out: "${text.slice(0, 80)}"`);
            LeadCRM.updateStatus(phone, 'LOST', 'User meminta berhenti dihubungi');
            console.log(`[OutreachGuard] 🚫 Opt-out terdeteksi dari ${phone}: "${text.slice(0, 60)}"`);
            return { optOut: true, message: 'Nomor ditambahkan ke DO_NOT_CONTACT' };
        }
        return { optOut: false };
    }

    // ─────────────────────────────────────────────
    // PRIVATE: Rate limiting (in-memory + file log)
    // ─────────────────────────────────────────────
    static _loadRateLog() {
        try {
            const dir = path.dirname(RATE_LOG_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            if (!fs.existsSync(RATE_LOG_FILE)) return { timestamps: [] };
            return JSON.parse(fs.readFileSync(RATE_LOG_FILE, 'utf-8'));
        } catch { return { timestamps: [] }; }
    }

    static _saveRateLog(data) {
        const dir = path.dirname(RATE_LOG_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(RATE_LOG_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }

    static _checkRateLimit() {
        const log = this._loadRateLog();
        const oneHourAgo = Date.now() - 3600000;
        // Hapus yang sudah lebih dari 1 jam
        log.timestamps = (log.timestamps || []).filter(ts => ts > oneHourAgo);
        this._saveRateLog(log);
        return log.timestamps.length < CONFIG.maxPerHour;
    }

    static _incrementRateLog() {
        const log = this._loadRateLog();
        const oneHourAgo = Date.now() - 3600000;
        log.timestamps = (log.timestamps || []).filter(ts => ts > oneHourAgo);
        log.timestamps.push(Date.now());
        this._saveRateLog(log);
    }

    // ─────────────────────────────────────────────
    // PUBLIC: Status rate limit saat ini
    // ─────────────────────────────────────────────
    static getRateLimitStatus() {
        const log = this._loadRateLog();
        const oneHourAgo = Date.now() - 3600000;
        const recent = (log.timestamps || []).filter(ts => ts > oneHourAgo);
        return {
            sentThisHour: recent.length,
            maxPerHour: CONFIG.maxPerHour,
            remaining: Math.max(0, CONFIG.maxPerHour - recent.length),
            cooldownDays: CONFIG.cooldownDays,
        };
    }
}
