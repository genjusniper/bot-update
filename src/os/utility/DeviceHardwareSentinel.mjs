// src/os/utility/DeviceHardwareSentinel.mjs
// ============================================================================
// SALIM OS - DEVICE HARDWARE SENTINEL
// Monitors Termux battery, temperature, charging status, and disk storage
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class DeviceHardwareSentinel {
    /**
     * Queries Android battery status via Termux API
     */
    static async getBatteryStatus() {
        try {
            const { stdout } = await execAsync('termux-battery-status', { timeout: 3000 });
            const data = JSON.parse(stdout);
            return {
                available: true,
                percentage: data.percentage,
                status: data.status, // CHARGING / DISCHARGING
                health: data.health, // GOOD
                temperature: data.temperature, // Celsius
                plugged: data.plugged // PLUGGED_AC, etc.
            };
        } catch {
            return { available: false };
        }
    }

    /**
     * Queries disk space
     */
    static async getDiskUsage() {
        try {
            const { stdout } = await execAsync('df -h /data', { timeout: 3000 });
            const lines = stdout.trim().split('\n');
            if (lines.length > 1) {
                const parts = lines[1].split(/\s+/);
                return {
                    size: parts[1],
                    used: parts[2],
                    available: parts[3],
                    usePercent: parts[4]
                };
            }
        } catch {
            // Fallback
        }
        return { size: 'Unknown', used: 'Unknown', available: 'Unknown', usePercent: 'Unknown' };
    }

    /**
     * Builds comprehensive device diagnostic report
     */
    static async getDiagnosticReport() {
        const [battery, disk] = await Promise.all([
            this.getBatteryStatus(),
            this.getDiskUsage()
        ]);

        let battStr = '';
        if (battery.available) {
            const icon = battery.status === 'CHARGING' ? '⚡' : (battery.percentage <= 20 ? '🪫' : '🔋');
            battStr = `${icon} *Baterai:* ${battery.percentage}% (${battery.status})\n` +
                      `🌡️ *Suhu Baterai:* ${battery.temperature}°C\n` +
                      `❤️ *Kesehatan:* ${battery.health}\n`;
        } else {
            battStr = `🔋 *Baterai:* Mode Standar (Termux:API tidak terpasang)\n`;
        }

        const memUsage = process.memoryUsage();
        const rssMB = (memUsage.rss / 1024 / 1024).toFixed(1);
        const heapMB = (memUsage.heapUsed / 1024 / 1024).toFixed(1);

        const uptimeHours = (process.uptime() / 3600).toFixed(1);

        return (
            `📱 *TERMINAL SENTINEL SALIM OS*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            battStr +
            `💾 *Penyimpanan Internal:* ${disk.used} terpakai / ${disk.available} sisa (${disk.usePercent})\n` +
            `🧠 *RAM Node.js:* RSS ${rssMB} MB (Heap: ${heapMB} MB)\n` +
            `⏱️ *Uptime Bot:* ${uptimeHours} Jam aktif tanpa henti\n` +
            `🛡️ *Status OS:* Stabil & Terlindungi PM2\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            (battery.percentage <= 20 && battery.status !== 'CHARGING' 
                ? `⚠️ *Peringatan:* Baterai HP tinggal ${battery.percentage}%. Segera colok charger biar bot gak mati, Gus!\n` 
                : `_Kondisi perangkat aman dan prima untuk memproses pesan._`)
        );
    }
}
