// src/core/control/GlobalCommandDetector.mjs
// Universal detector intercepting slash commands and natural language operational commands across all chats

import { AuthorityManager } from './AuthorityManager.mjs';

export class GlobalCommandDetector {
    static COMMAND_MAP = Object.freeze({
        '/ping': 'PING',
        '!ping': 'PING',
        'ping': 'PING',
        '/status': 'STATUS',
        '!status': 'STATUS',
        'status': 'STATUS',
        '/info': 'INFO',
        '!info': 'INFO',
        'info': 'INFO',
        '/health': 'HEALTH',
        '!health': 'HEALTH',
        'health': 'HEALTH',
        '/doctor': 'DOCTOR',
        '!doctor': 'DOCTOR',
        'doctor': 'DOCTOR',
        '/diagnosa': 'DOCTOR',
        '/diagnostics': 'DOCTOR',
        '/restart': 'RESTART',
        '!restart': 'RESTART',
        'restart': 'RESTART',
        '/reboot': 'RESTART',
        '/shutdown': 'SHUTDOWN',
        '!shutdown': 'SHUTDOWN',
        'shutdown': 'SHUTDOWN',
        '/matikan': 'SHUTDOWN',
        '/sleep': 'SHUTDOWN',
        'sleep': 'SHUTDOWN',
        '/wake': 'RESUME_AUTOMATION',
        'wake': 'RESUME_AUTOMATION',
        '/pause': 'PAUSE_AUTOMATION',
        'pause': 'PAUSE_AUTOMATION',
        '/resume': 'RESUME_AUTOMATION',
        'resume': 'RESUME_AUTOMATION',
        '/safe-mode': 'SAFE_MODE_ON',
        '/safemode': 'SAFE_MODE_ON',
        'safe mode': 'SAFE_MODE_ON',
        '/normal-mode': 'SAFE_MODE_OFF',
        'normal mode': 'SAFE_MODE_OFF',
        '/queue': 'QUEUE',
        'queue': 'QUEUE',
        '/jobs': 'QUEUE',
        'jobs': 'QUEUE',
        '/memory': 'MEMORY',
        'memory': 'MEMORY',
        '/ram': 'MEMORY',
        '/cpu': 'CPU',
        '/storage': 'STORAGE',
        'storage': 'STORAGE',
        '/connections': 'CONNECTIONS',
        'connections': 'CONNECTIONS',
        '/providers': 'PROVIDERS',
        'providers': 'PROVIDERS',
        '/models': 'MODELS',
        'models': 'MODELS',
        '/tools': 'TOOLS',
        'tools': 'TOOLS',
        '/version': 'VERSION',
        'version': 'VERSION',
        '/config': 'CONFIG',
        'config': 'CONFIG',
        '/backup': 'BACKUP',
        'backup': 'BACKUP',
        '/restore': 'RESTORE',
        'restore': 'RESTORE',
        '/update': 'UPDATE',
        'update': 'UPDATE',
        '/maintenance': 'MAINTENANCE',
        'maintenance': 'MAINTENANCE',
        '/logs': 'LOGS',
        'logs': 'LOGS',
        '/events': 'EVENTS',
        'events': 'EVENTS',
        '/uptime': 'UPTIME',
        '/capabilities': 'CAPABILITIES',
        '/goals': 'GOALS',
        '!goals': 'GOALS',
        '/roadmap': 'GOALS',
        '/open-loops': 'OPEN_LOOPS',
        '!open-loops': 'OPEN_LOOPS',
        '/help': 'HELP',
        '!help': 'HELP',
        'help': 'HELP',
        '/healp': 'HELP',
        'healp': 'HELP',
        '/menu': 'HELP',
        '!menu': 'HELP',
        'menu': 'HELP',
        '/list': 'HELP',
        '!list': 'HELP',
        'list': 'HELP',
        'bantuan': 'HELP'
    });

    /**
     * Detects if an incoming message is an operational control command
     * @param {string} text - Message text
     * @returns {{ isControlCommand: boolean, intent: string|null, actionName: string|null, operationType: 'READ'|'MUTATING'|null, args: string[], rawText: string, confidence: number }}
     */
    static detect(text = '') {
        const raw = String(text || '').trim();
        if (!raw) {
            return { isControlCommand: false, intent: null, actionName: null, operationType: null, args: [], rawText: '', confidence: 0 };
        }

        const parts = raw.split(/\s+/);
        const trigger = parts[0].toLowerCase();
        const lower = raw.toLowerCase();

        // 1. Direct prefix matches (/ or !) or exact single word matches
        if (trigger in this.COMMAND_MAP && (raw.startsWith('/') || raw.startsWith('!') || parts.length <= 2)) {
            const intent = this.COMMAND_MAP[trigger];
            const operationType = AuthorityManager.MUTATING_COMMANDS.has(intent) ? 'MUTATING' : 'READ';
            return {
                isControlCommand: true,
                intent,
                actionName: intent,
                operationType,
                args: parts.slice(1),
                rawText: raw,
                confidence: 1.0
            };
        }

        // 2. Natural Language Patterns
        // RESTART: "restart arka", "mulai ulang bot", "reboot arka"
        if (/\b((tolong|coba|mohon)?\s*(restart|reboot|mulai ulang)(\s*(bot|arka|sistem))?(\s*sekarang)?)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'RESTART', actionName: 'RESTART', operationType: 'MUTATING', args: [], rawText: raw, confidence: 0.95 };
        }

        // SHUTDOWN / MATIKAN: "matikan bot", "turn off bot", "matikan arka"
        if (/\b((tolong|coba|mohon)?\s*(matikan|shutdown|turn off|stop)(\s*(bot|arka|sistem))?(\s*sekarang)?)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'SHUTDOWN', actionName: 'SHUTDOWN', operationType: 'MUTATING', args: [], rawText: raw, confidence: 0.95 };
        }

        // RESUME / HIDUPKAN KEMBALI / AKTIFKAN LAGI
        if (/\b((hidupkan|aktifkan|nyalakan)\s*(kembali|lagi)(\s*(bot|arka|sistem))?|bangun arka)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'RESUME_AUTOMATION', actionName: 'RESUME_AUTOMATION', operationType: 'MUTATING', args: [], rawText: raw, confidence: 0.95 };
        }

        // STATUS: "arka status", "cek kondisi sistem", "gimana status bot"
        if (/\b(cek status|status bot|arka status|gimana status bot|info sistem|status server|cek kondisi sistem)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'STATUS', actionName: 'STATUS', operationType: 'READ', args: [], rawText: raw, confidence: 0.95 };
        }

        // HEALTH: "cek kondisi", "cek kesehatan"
        if (/\b(cek (kondisi|kesehatan)|kondisi (sistem|bot)|health check|cek kesehatan bot)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'HEALTH', actionName: 'HEALTH', operationType: 'READ', args: [], rawText: raw, confidence: 0.95 };
        }

        // CEK CPU / RAM / MEMORY
        if (/\b(cek (cpu|prosesor)|penggunaan cpu)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'CPU', actionName: 'CPU', operationType: 'READ', args: [], rawText: raw, confidence: 0.95 };
        }
        if (/\b(cek (memory|memori|ram)|penggunaan (memory|memori|ram)|memory usage|ram usage)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'MEMORY', actionName: 'MEMORY', operationType: 'READ', args: [], rawText: raw, confidence: 0.95 };
        }

        // CEK STORAGE
        if (/\b(cek (storage|penyimpanan|disk|memori internal)|kapasitas disk)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'STORAGE', actionName: 'STORAGE', operationType: 'READ', args: [], rawText: raw, confidence: 0.95 };
        }

        // CEK WHATSAPP / CONNECTIONS
        if (/\b(cek (whatsapp|koneksi wa|socket wa)|status whatsapp)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'CONNECTIONS', actionName: 'CONNECTIONS', operationType: 'READ', args: [], rawText: raw, confidence: 0.95 };
        }

        // CEK PROVIDERS / MODELS: "cek provider yang mati", "cek provider", "status model"
        if (/\b(cek provider( yang mati)?|status provider|cek model|model aktif)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'PROVIDERS', actionName: 'PROVIDERS', operationType: 'READ', args: [], rawText: raw, confidence: 0.95 };
        }

        // CEK QUEUE: "cek queue", "cek antrean"
        if (/\b((ada )?berapa (job|tugas|pesan) yang (ngantri|antre)|cek (queue|antrean)|status antrean|queue status)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'QUEUE', actionName: 'QUEUE', operationType: 'READ', args: [], rawText: raw, confidence: 0.95 };
        }

        // CEK ERROR TERAKHIR / KENAPA ERROR: "arka kenapa error?", "cek error terakhir", "log error"
        if (/\b(arka kenapa error|kenapa error|cek error terakhir|log error|error terakhir)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'LAST_ERROR', actionName: 'LAST_ERROR', operationType: 'READ', args: [], rawText: raw, confidence: 0.95 };
        }

        // SAFE MODE
        if (/\b((matikan|disable|nonaktifkan|keluar)\s*safe[\s-]mode|mode normal)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'SAFE_MODE_OFF', actionName: 'SAFE_MODE_OFF', operationType: 'MUTATING', args: ['off'], rawText: raw, confidence: 0.95 };
        }
        if (/\b((aktifkan|enable|nyalakan|masuk)?\s*safe[\s-]mode|mode darurat)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'SAFE_MODE_ON', actionName: 'SAFE_MODE_ON', operationType: 'MUTATING', args: ['on'], rawText: raw, confidence: 0.90 };
        }

        // AUTOMATION TOGGLE: PAUSE / RESUME
        if (/\b((pause|jeda|hentikan sementara)\s*automasi|pause automation)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'PAUSE_AUTOMATION', actionName: 'PAUSE_AUTOMATION', operationType: 'MUTATING', args: [], rawText: raw, confidence: 0.95 };
        }
        if (/\b((resume|lanjutkan|hidupkan lagi)\s*automasi|resume automation)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'RESUME_AUTOMATION', actionName: 'RESUME_AUTOMATION', operationType: 'MUTATING', args: [], rawText: raw, confidence: 0.95 };
        }

        // DOCTOR / DIAGNOSTICS: "doctor", "diagnosa bot", "troubleshoot"
        if (/\b(doctor|diagnosa (bot|sistem)?|cek masalah (bot|sistem)|troubleshoot)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'DOCTOR', actionName: 'DOCTOR', operationType: 'READ', args: [], rawText: raw, confidence: 0.95 };
        }

        // MAINTENANCE / CLEAN CACHE
        if (/\b(maintenance|bersihkan cache|prune storage|jalankan maintenance)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'MAINTENANCE', actionName: 'MAINTENANCE', operationType: 'MUTATING', args: [], rawText: raw, confidence: 0.95 };
        }

        // GOALS & ROADMAP
        if (/\b(status goal|roadmap|goal kita|progress goal|roadmap arka|pr kita apa)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'GOALS', actionName: 'GOALS', operationType: 'READ', args: [], rawText: raw, confidence: 0.95 };
        }

        // OPEN LOOPS
        if (/\b(open loops|open loop|utang janji|pending janji|komitmen aktif)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'OPEN_LOOPS', actionName: 'OPEN_LOOPS', operationType: 'READ', args: [], rawText: raw, confidence: 0.95 };
        }

        // HELP & MENU & LIST
        if (/^(help|menu|list|healp|bantuan|fitur|perintah)(\s*(bot|arka|salim|list)?)?$/i.test(lower) || /\b(menu bot|list fitur|daftar fitur|menu bantuan|daftar perintah|menu list|list menu)\b/i.test(lower)) {
            return { isControlCommand: true, intent: 'HELP', actionName: 'HELP', operationType: 'READ', args: [], rawText: raw, confidence: 1.0 };
        }

        return { isControlCommand: false, intent: null, actionName: null, operationType: null, args: [], rawText: raw, confidence: 0 };
    }
}

