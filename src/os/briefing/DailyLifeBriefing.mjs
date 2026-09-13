// src/os/briefing/DailyLifeBriefing.mjs
// Automated Proactive Morning Briefing & Night Recap for Salim OS
// Dispatches daily intelligence directly to Owner's WhatsApp at 07:00 & 22:00 WIB

import { ShiftWorkTracker } from '../shift/ShiftWorkTracker.mjs';
import { NaturalReminderEngine } from '../reminders/NaturalReminderEngine.mjs';
import { VoiceSynthesizer } from '../../multimodal/VoiceSynthesizer.mjs';
import { WisdomSparringEngine } from '../growth/WisdomSparringEngine.mjs';
import { HabitTrackerEngine } from '../habits/HabitTrackerEngine.mjs';

export class DailyLifeBriefing {
    static cronInterval = null;
    static lastMorningDate = '';
    static lastNightDate = '';
    static waGateway = null;
    static ownerLid = '';

    /**
     * Generates Morning Briefing message
     */
    static generateMorningBriefing() {
        const now = new Date();
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        const dayName = dayNames[now.getDay()];
        const dateStr = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

        // 1. Shift info
        const todayShift = ShiftWorkTracker.getTodayShift();
        let shiftText = 'Belum ada catatan shift';
        let shiftTips = 'Jalani hari dengan santai tapi fokus!';

        if (todayShift) {
            if (todayShift.shift_type === 'PAGI') {
                shiftText = '🌅 *SHIFT PAGI* (07:00 - 15:00)';
                shiftTips = 'Jangan lupa sarapan dan bawa air minum cukup ya Bos!';
            } else if (todayShift.shift_type === 'SIANG') {
                shiftText = '☀️ *SHIFT SIANG* (15:00 - 23:00)';
                shiftTips = 'Pagi ini masih santai, bisa manfaatkan waktu sebelum berangkat siang nanti.';
            } else if (todayShift.shift_type === 'MALAM') {
                shiftText = '🌙 *SHIFT MALAM* (23:00 - 07:00)';
                shiftTips = 'Siapkan fisik dan sempatkan tidur siang agar fit nanti malam.';
            } else if (todayShift.shift_type === 'LIBUR') {
                shiftText = '🏖️ *LIBUR / OFF*';
                shiftTips = 'Nikmati hari libur, istirahat full atau eksplor hobi!';
            }
        }

        // 2. Active reminders for today
        const activeReminders = NaturalReminderEngine.listActiveReminders();
        let reminderText = 'Tidak ada agenda khusus hari ini.';
        if (activeReminders && activeReminders.length > 0) {
            reminderText = activeReminders.map(r => {
                const t = new Date(r.target_timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
                return `• *${t} WIB:* ${r.reminder_text}`;
            }).join('\n');
        }

        // 3. Daily Habit Targets
        let habitText = '';
        try {
            const hStats = HabitTrackerEngine.getBriefingStats(this.ownerLid || 'owner');
            if (hStats && hStats.total > 0) {
                habitText = `🔥 *Target Kebiasaan Hari Ini (${hStats.doneCount}/${hStats.total} Tuntas):*\n` +
                            hStats.pendingList.slice(0, 3).map(h => `• [ ] ${h}`).join('\n') + '\n\n';
            }
        } catch (e) {}

        // 4. Micro Wisdom for today
        const wisdom = WisdomSparringEngine.getDailyWisdom();

        return (
            `🌅 *SELAMAT PAGI, BOS AGUS!*\n` +
            `📅 *${dayName}, ${dateStr}*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `💼 *Jadwal Kerja Hari Ini:*\n${shiftText}\n\n` +
            `📌 *Agenda & Pengingat Hari Ini:*\n${reminderText}\n\n` +
            (habitText ? `${habitText}` : '') +
            `🧠 *Wawasan & Sudut Pandang Hari Ini (${wisdom.topic}):*\n_${wisdom.insight}_\n\n` +
            `💡 *Saran Salim OS:*\n_${shiftTips}_\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `_Ketik \`!shift\` untuk cek jadwal mingguan atau \`!vn\` untuk sapaan suara._`
        );
    }

    /**
     * Generates Night Recap message
     */
    static generateNightRecap() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const tomorrowShift = ShiftWorkTracker.getTomorrowShift();
        let tomorrowShiftText = 'Belum dicatat';
        let alertPagi = '';

        if (tomorrowShift) {
            if (tomorrowShift.shift_type === 'PAGI') {
                tomorrowShiftText = '🌅 *SHIFT PAGI* (07:00 - 15:00)';
                alertPagi = '\n⚠️ *PERINGATAN:* Besok shift pagi! Salim OS menyarankan tidur sebelum jam 23:00 agar bangun subuh segar.';
            } else if (tomorrowShift.shift_type === 'SIANG') {
                tomorrowShiftText = '☀️ *SHIFT SIANG* (15:00 - 23:00)';
            } else if (tomorrowShift.shift_type === 'MALAM') {
                tomorrowShiftText = '🌙 *SHIFT MALAM* (23:00 - 07:00)';
            } else if (tomorrowShift.shift_type === 'LIBUR') {
                tomorrowShiftText = '🏖️ *LIBUR / OFF*';
            }
        }

        let habitRecap = '';
        try {
            const hStats = HabitTrackerEngine.getBriefingStats(this.ownerLid || 'owner');
            if (hStats && hStats.total > 0) {
                habitRecap = `\n🔥 *Capaian Habit Hari Ini:* ${hStats.doneCount}/${hStats.total} tuntas\n` +
                             (hStats.doneCount === hStats.total ? '🎉 Semua habit hari ini selesai 100%! Mantap Bos!\n' : 'Tetap semangat, lanjutkan konsistensi besok!\n');
            }
        } catch (e) {}

        return (
            `🌙 *EVALUASI & NIGHT RECAP SALIM OS*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `Kerja keras hari ini selesai, waktunya istirahat dan pulihkan tenaga, Bos!\n\n` +
            `📅 *Jadwal Besok:* ${tomorrowShiftText}${alertPagi}\n` +
            habitRecap +
            `━━━━━━━━━━━━━━━━━━\n` +
            `_Selamat istirahat, Salim OS tetap berjaga di background._ 💤`
        );
    }

    /**
     * Starts the daily cron checker (ticking every 30s)
     */
    static startCron(waGateway, ownerLid) {
        this.waGateway = waGateway;
        this.ownerLid = ownerLid;

        if (this.cronInterval) clearInterval(this.cronInterval);

        this.cronInterval = setInterval(async () => {
            const now = new Date();
            const hour = now.getHours();
            const minute = now.getMinutes();
            const todayStr = ShiftWorkTracker.formatDateStr(now);

            // 1. Morning Briefing at 07:00 WIB
            if (hour === 7 && minute === 0 && this.lastMorningDate !== todayStr) {
                this.lastMorningDate = todayStr;
                await this.dispatchMorningBriefing();
            }

            // 2. Night Recap at 22:00 WIB
            if (hour === 22 && minute === 0 && this.lastNightDate !== todayStr) {
                this.lastNightDate = todayStr;
                await this.dispatchNightRecap();
            }
        }, 30000); // check every 30s

        console.log('[DailyBriefing] 🌅 Proactive briefing cron running (07:00 & 22:00 WIB checks)');
    }

    /**
     * Dispatches Morning Briefing to Owner
     */
    static async dispatchMorningBriefing(targetJid) {
        const dest = targetJid || this.ownerLid;
        if (!dest || !this.waGateway?.sock) return;

        const text = this.generateMorningBriefing();
        await this.waGateway.sock.sendMessage(dest, { text }).catch(e => console.error('[DailyBriefing] Error:', e.message));

        // Send short voice greeting
        try {
            const audio = await VoiceSynthesizer.synthesize('Selamat pagi Bos Agus! Semangat menjalani hari ini, Salim OS siap mendampingi.');
            if (audio) {
                await this.waGateway.sock.sendMessage(dest, {
                    audio,
                    mimetype: 'audio/mp4',
                    ptt: true
                });
            }
        } catch (e) {
            // non-fatal voice error
        }
        console.log(`[DailyBriefing] 🌅 Dispatched Morning Briefing to ${dest}`);
    }

    /**
     * Dispatches Night Recap to Owner
     */
    static async dispatchNightRecap(targetJid) {
        const dest = targetJid || this.ownerLid;
        if (!dest || !this.waGateway?.sock) return;

        const text = this.generateNightRecap();
        await this.waGateway.sock.sendMessage(dest, { text }).catch(e => console.error('[DailyBriefing] Error:', e.message));
        console.log(`[DailyBriefing] 🌙 Dispatched Night Recap to ${dest}`);
    }
}
