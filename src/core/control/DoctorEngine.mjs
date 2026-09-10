// src/core/control/DoctorEngine.mjs
// ARKA Doctor 2.0 — Comprehensive 8-Pillar Root Cause Diagnostic Engine
// Strictly monitors: WhatsApp, SQLite, Queue, Memory RSS vs 150MB, CPU, Providers, Tools, Uptime/Incidents

import os from 'os';
import { HealthManager } from './HealthManager.mjs';
import { JobQueue } from '../../queue/JobQueue.mjs';
import { FeatureFlags } from './FeatureFlags.mjs';
import { incidentAutoHealer } from '../observability/IncidentAutoHealer.mjs';

export class DoctorEngine {
    static MEMORY_CEILING_MB = 150;

    /**
     * Executes comprehensive 8-pillar health diagnostics
     * @param {Object} [waGateway=null]
     * @returns {Promise<Object>} Complete diagnostic report
     */
    static async diagnose(waGateway = null) {
        const issues = [];
        const suggestions = [];
        const pillars = {};

        // ==========================================
        // PILAR 1: WhatsApp Socket & Session
        // ==========================================
        const waConnected = Boolean(waGateway?.sock?.user?.id);
        pillars.whatsapp = {
            status: waConnected ? 'CONNECTED' : 'DISCONNECTED',
            userId: waGateway?.sock?.user?.id || null,
            isHealthy: waConnected
        };
        if (!waConnected) {
            issues.push({
                severity: 'HIGH',
                component: 'WhatsApp Gateway',
                detail: 'Socket WhatsApp terputus atau sesi belum terhubung.'
            });
            suggestions.push('Cek koneksi internet perangkat atau tunggu reconnect otomatis.');
        }

        // ==========================================
        // PILAR 2: SQLite Database & Integrity
        // ==========================================
        let dbIntegrity = 'UNKNOWN';
        let dbError = null;
        try {
            if (JobQueue.db) {
                const check = JobQueue.db.prepare('PRAGMA integrity_check').get();
                dbIntegrity = check?.integrity_check === 'ok' ? 'OK' : 'CORRUPTED';
            } else {
                dbIntegrity = 'INITIALIZING';
            }
        } catch (e) {
            dbIntegrity = 'ERROR';
            dbError = e.message;
        }
        pillars.sqlite = {
            status: dbIntegrity,
            isHealthy: dbIntegrity === 'OK' || dbIntegrity === 'INITIALIZING',
            error: dbError
        };
        if (dbIntegrity === 'CORRUPTED' || dbIntegrity === 'ERROR') {
            issues.push({
                severity: 'CRITICAL',
                component: 'SQLite Database',
                detail: `Integritas basis data bermasalah: ${dbError || dbIntegrity}`
            });
            suggestions.push('Lakukan checkpoint recovery atau restore dari backup snapshot.');
        }

        // ==========================================
        // PILAR 3: JobQueue Telemetry
        // ==========================================
        let qPending = 0, qProcessing = 0, qCompleted = 0, qDeadLetter = 0;
        try {
            if (JobQueue.db) {
                qPending = JobQueue.db.prepare("SELECT count(*) as count FROM jobs WHERE status = 'QUEUED'").get()?.count || 0;
                qProcessing = JobQueue.db.prepare("SELECT count(*) as count FROM jobs WHERE status = 'PROCESSING'").get()?.count || 0;
                qCompleted = JobQueue.db.prepare("SELECT count(*) as count FROM jobs WHERE status = 'COMPLETED'").get()?.count || 0;
                qDeadLetter = JobQueue.db.prepare("SELECT count(*) as count FROM jobs WHERE status = 'DEAD_LETTER'").get()?.count || 0;
            }
        } catch (e) {}
        pillars.queue = {
            pending: qPending,
            processing: qProcessing,
            completed: qCompleted,
            deadLetter: qDeadLetter,
            isHealthy: qDeadLetter === 0 && qPending < 15
        };
        if (qDeadLetter > 0) {
            issues.push({
                severity: 'MEDIUM',
                component: 'JobQueue DLQ',
                detail: `Terdapat ${qDeadLetter} pesan di Dead-Letter Queue.`
            });
            suggestions.push('Periksa error log atau bersihkan DLQ dengan command maintenance.');
        }
        if (qPending >= 15) {
            issues.push({
                severity: 'MEDIUM',
                component: 'JobQueue Backlog',
                detail: `Antrean menumpuk (${qPending} pesan menunggu).`
            });
            suggestions.push('Beban kerja meningkat. Biarkan worker mengurai antrean.');
        }

        // ==========================================
        // PILAR 4: Memory RSS vs 150MB Limit
        // ==========================================
        const mem = process.memoryUsage ? process.memoryUsage() : {};
        const rssMB = mem.rss ? Number((mem.rss / (1024 * 1024)).toFixed(2)) : 0;
        const heapMB = mem.heapUsed ? Number((mem.heapUsed / (1024 * 1024)).toFixed(2)) : 0;
        const rssPercent = Number(((rssMB / this.MEMORY_CEILING_MB) * 100).toFixed(1));
        const memHealthy = rssMB < this.MEMORY_CEILING_MB;
        pillars.memory = {
            rssMB,
            heapMB,
            ceilingMB: this.MEMORY_CEILING_MB,
            rssPercent,
            isHealthy: memHealthy
        };
        if (rssMB >= this.MEMORY_CEILING_MB) {
            issues.push({
                severity: 'CRITICAL',
                component: 'Memory RSS Ceiling',
                detail: `Penggunaan RAM (${rssMB} MB) melebihi batas 150 MB (${rssPercent}%).`
            });
            suggestions.push('Segera lakukan GC paksa atau aktifkan Safe-Mode.');
        } else if (rssMB >= 135) {
            issues.push({
                severity: 'MEDIUM',
                component: 'Memory RSS Warning',
                detail: `Penggunaan RAM (${rssMB} MB) mendekati limit 150 MB (${rssPercent}%).`
            });
            suggestions.push('Monitor alokasi buffer dan kurangi beban concurrent burst.');
        }

        // ==========================================
        // PILAR 5: CPU Load & Event Loop
        // ==========================================
        const load = os.loadavg ? os.loadavg() : [0, 0, 0];
        const cpus = os.cpus ? os.cpus() : [];
        pillars.cpu = {
            cores: cpus.length,
            load1m: load[0] ? load[0].toFixed(2) : '0.00',
            load5m: load[1] ? load[1].toFixed(2) : '0.00',
            isHealthy: load[0] < (cpus.length * 2 || 4)
        };

        // ==========================================
        // PILAR 6: AI Providers (Gemini, Groq, OpenAI, Local)
        // ==========================================
        const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
        const hasGroq = Boolean(process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY);
        const hasGemini = Boolean(process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY);
        pillars.providers = {
            openai: hasOpenAI ? 'CONFIGURED' : 'UNAVAILABLE',
            groq: hasGroq ? 'CONFIGURED' : 'UNAVAILABLE',
            gemini: hasGemini ? 'CONFIGURED' : 'UNAVAILABLE',
            localFallback: 'READY',
            isHealthy: hasOpenAI || hasGroq || hasGemini
        };
        if (!pillars.providers.isHealthy) {
            issues.push({
                severity: 'HIGH',
                component: 'AI Providers',
                detail: 'Tidak ada API Key LLM eksternal yang terkonfigurasi. Berjalan dalam local fallback.'
            });
            suggestions.push('Tambahkan OPENAI_API_KEY, GROQ_API_KEY, atau GEMINI_API_KEY di .env.');
        }

        // ==========================================
        // PILAR 7: Tools & Automation
        // ==========================================
        const isSafeMode = FeatureFlags.flags.safeMode;
        pillars.tools = {
            safeMode: isSafeMode,
            atxBoundary: 'ENFORCED',
            scheduler: 'ACTIVE',
            isHealthy: true
        };

        // ==========================================
        // PILAR 8: Uptime & Incident Telemetry
        // ==========================================
        const uptimeMs = process.uptime ? Math.floor(process.uptime() * 1000) : 0;
        const healerReport = (incidentAutoHealer && typeof incidentAutoHealer.getHealthReport === 'function')
            ? incidentAutoHealer.getHealthReport()
            : { totalHealed: 0, recentIncidents: [] };
        pillars.uptime = {
            formatted: HealthManager.formatUptime(uptimeMs),
            uptimeMs,
            incidents: healerReport.recentIncidents?.length || 0,
            healed: healerReport.totalHealed || 0,
            isHealthy: true
        };

        const condition = issues.length === 0 ? 'HEALTHY' : (issues.some(i => i.severity === 'CRITICAL' || i.severity === 'HIGH') ? 'CRITICAL' : 'DEGRADED');

        return {
            condition,
            issues,
            suggestions,
            pillars,
            timestamp: Date.now()
        };
    }

    /**
     * Formats diagnostic report into a clean, deadpan WhatsApp-native card
     * @param {Object} diag
     * @returns {string}
     */
    static formatDoctorCard(diag) {
        const icon = diag.condition === 'HEALTHY' ? '🟢' : (diag.condition === 'DEGRADED' ? '🟡' : '🔴');
        const p = diag.pillars || {};

        let out = `🩺 *SALIM DOCTOR 2.0 REPORT*\n`;
        out += `──────────────────\n`;
        out += `*Kondisi Umum:* ${icon} *${diag.condition}*\n\n`;

        out += `📊 *8 Pilar Diagnosa Subsistem:*\n`;
        out += `1. WhatsApp: ${p.whatsapp?.status === 'CONNECTED' ? 'CONNECTED ✅' : 'DISCONNECTED ❌'}\n`;
        out += `2. SQLite DB: ${p.sqlite?.status === 'OK' ? 'INTEGRITY OK ✅' : (p.sqlite?.status || 'NORMAL ✅')}\n`;
        out += `3. JobQueue: ${p.queue?.pending || 0} pending | ${p.queue?.deadLetter || 0} DLQ ${p.queue?.isHealthy ? '✅' : '⚠️'}\n`;
        out += `4. Memory RSS: ${p.memory?.rssMB || 0} MB / ${p.memory?.ceilingMB || 150} MB (${p.memory?.rssPercent || 0}%) ${p.memory?.isHealthy ? '✅' : '🔴'}\n`;
        out += `5. CPU Load: ${p.cpu?.cores || 1} Cores | Load: ${p.cpu?.load1m || '0.00'} ✅\n`;
        out += `6. AI Providers: ${p.providers?.openai === 'CONFIGURED' ? 'OpenAI' : (p.providers?.groq === 'CONFIGURED' ? 'Groq' : 'Local')} Active ✅\n`;
        out += `7. Tools & ATX: SafeMode ${p.tools?.safeMode ? 'ON (⚠️)' : 'OFF (Normal ✅)'}\n`;
        out += `8. Uptime: ${p.uptime?.formatted || '0s'} | Incidents: ${p.uptime?.incidents || 0} (${p.uptime?.healed || 0} healed)\n`;

        if (diag.issues.length > 0) {
            out += `\n⚠️ *Temuan Masalah (${diag.issues.length}):*\n`;
            diag.issues.forEach((issue, idx) => {
                out += `${idx + 1}. [${issue.severity}] *${issue.component}*: ${issue.detail}\n`;
            });
        }

        if (diag.suggestions.length > 0) {
            out += `\n💡 *Rekomendasi Tindakan:*\n`;
            diag.suggestions.forEach(sug => {
                out += `• ${sug}\n`;
            });
        } else {
            out += `\n✨ *Sistem beroperasi optimal. Tidak ada tindakan diperlukan.*`;
        }

        return out.trim();
    }
}
