// src/core/autonomy/ReminderSchedulerLoop.mjs
// Proactive reminder background worker and natural date-time reminder parser
import { EventScheduler } from './EventScheduler.mjs';

export class ReminderSchedulerLoop {
    static timer = null;
    static isStarted = false;

    /**
     * Starts the background interval to monitor due reminders and dispatch to WhatsApp
     * @param {Object} waGateway 
     */
    static start(waGateway) {
        if (this.isStarted) return;
        this.isStarted = true;

        console.log('[ReminderSchedulerLoop] ⏰ Background reminder monitor started (poll interval: 20s)');

        this.timer = setInterval(async () => {
            try {
                const dueEvents = EventScheduler.getDueEvents();
                if (dueEvents.length > 0 && waGateway?.sock) {
                    for (const evt of dueEvents) {
                        console.log('[ReminderSchedulerLoop] 🚀 Dispatching due reminder to ' + evt.targetJid + ': ' + evt.description);
                        const msg = '⏰ *PENGINGAT OTOMATIS (SALIM OS)*\n──────────────────\n' +
                                    '📌 *Catatan:* ' + evt.description + '\n' +
                                    '⏱️ *Dijadwalkan untuk:* ' + new Date(evt.triggerTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
                        
                        await waGateway.sock.sendMessage(evt.targetJid, { text: msg }).catch(() => {});
                    }
                }
            } catch (err) {
                console.warn('[ReminderSchedulerLoop] ⚠️ Poll error:', err.message);
            }
        }, 20000);
    }

    /**
     * Parses natural language reminder statements
     * Example: "ingatkan 15 menit lagi matikan kompor", "ingatkan jam 14.30 meeting zoom"
     * @param {string} text 
     * @param {string} targetJid 
     * @returns {{ handled: boolean, response?: string }}
     */
    static parseAndSchedule(text = '', targetJid = '') {
        const clean = (text || '').trim();
        const lower = clean.toLowerCase();

        const isReminderReq = /^(?:tolong\s+)?(?:ingatkan|ingetin|remind\s+me|pasang\s+alarm)\b/i.test(lower);
        if (!isReminderReq) return { handled: false };

        const now = Date.now();
        let triggerTime = null;
        let note = clean.replace(/^(?:tolong\s+)?(?:ingatkan|ingetin|remind\s+me|pasang\s+alarm)\s*(?:aku|gue|saya)?\s*/i, '').trim();

        // 1. Relative duration: "10 menit lagi", "2 jam lagi", "30 detik lagi"
        const relMatch = note.match(/^(\d+)\s*(menit|detik|jam|hari)\s*lagi\s*(.*)$/i);
        if (relMatch) {
            const count = parseInt(relMatch[1]);
            const unit = relMatch[2].toLowerCase();
            note = relMatch[3] || 'Pengingat';

            if (unit === 'detik') triggerTime = now + count * 1000;
            else if (unit === 'menit') triggerTime = now + count * 60 * 1000;
            else if (unit === 'jam') triggerTime = now + count * 3600 * 1000;
            else if (unit === 'hari') triggerTime = now + count * 86400 * 1000;
        }

        // 2. Specific clock time: "jam 14:30", "jam 14.00", "jam 2 siang", "jam 8 malam"
        if (!triggerTime) {
            const timeMatch = note.match(/^(?:nanti\s+)?jam\s*(\d{1,2})[\.:](\d{2})\s*(.*)$/i) ||
                              note.match(/^(?:nanti\s+)?jam\s*(\d{1,2})\s*(pagi|siang|sore|malam)?\s*(.*)$/i);
            if (timeMatch) {
                let hour = parseInt(timeMatch[1]);
                let minute = timeMatch[2] && !isNaN(parseInt(timeMatch[2])) ? parseInt(timeMatch[2]) : 0;
                const modifier = timeMatch[2] && isNaN(parseInt(timeMatch[2])) ? timeMatch[2].toLowerCase() : (timeMatch[3] && isNaN(parseInt(timeMatch[3])) ? timeMatch[3].toLowerCase() : '');
                
                if (modifier === 'siang' && hour < 12) hour += 12;
                if (modifier === 'sore' && hour < 12) hour += 12;
                if (modifier === 'malam' && hour < 12) hour += 12;

                const targetDate = new Date();
                targetDate.setHours(hour, minute, 0, 0);
                if (targetDate.getTime() <= now) {
                    // Passed for today, set for tomorrow
                    targetDate.setDate(targetDate.getDate() + 1);
                }
                triggerTime = targetDate.getTime();
                note = timeMatch[timeMatch.length - 1] || 'Pengingat';
            }
        }

        if (triggerTime && triggerTime > now) {
            note = note.replace(/^(buat|untuk|soal|tentang)\s+/i, '').trim() || 'Pengingat kamu';
            const evt = EventScheduler.scheduleEvent({
                targetJid,
                triggerTime,
                description: note
            });

            const timeStr = new Date(triggerTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            return {
                handled: true,
                response: '⏰ *PENGINGAT TERCATAT!*\n──────────────────\n' +
                          '📌 *Catatan:* ' + note + '\n' +
                          '⏱️ *Akan diingatkan jam:* ' + timeStr + ' WIB\n' +
                          '✅ Tenang Gus, nanti pasti tak ingetin pas waktunya!'
            };
        }

        return { handled: false };
    }
}
