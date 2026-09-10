// src/cognitive/MissionDAGTracker.mjs
// Directed Acyclic Graph (DAG) tracker for multi-step technical missions

import fs from 'fs';
import path from 'path';

export class MissionDAGTracker {
    static DATA_PATH = path.resolve(process.cwd(), 'data', 'active_missions.json');
    static #missions = null;

    static DEFAULT_MISSIONS = {
        activeMissionId: "mission_bcd_repair",
        missions: {
            "mission_bcd_repair": {
                id: "mission_bcd_repair",
                title: "Perbaikan Boot BCD Windows 10/11",
                currentStepIndex: 1,
                steps: [
                    {
                        index: 0,
                        title: "Masuk Windows Recovery via Bootable USB",
                        commandOrAction: "Colok flashdisk bootable, nyalakan PC tekan F12/F8 pilih USB, masuk Repair your computer -> Troubleshoot -> Advanced Options -> Command Prompt",
                        status: "COMPLETED"
                    },
                    {
                        index: 1,
                        title: "Eksekusi Rekonstruksi MBR & BCD",
                        commandOrAction: "Ketik di CMD berturut-turut:\n1. `bootrec /fixmbr` (Enter)\n2. `bootrec /fixboot` (Enter)\n3. `bootrec /rebuildbcd` (Enter)\nJika muncul 'Add installation to boot list?', tekan `Y` lalu Enter.",
                        status: "IN_PROGRESS"
                    },
                    {
                        index: 2,
                        title: "Verifikasi Partisi Aktif via Diskpart (Jika BCD gagal)",
                        commandOrAction: "Ketik `diskpart` -> `list disk` -> `select disk 0` -> `list partition` -> cek partisi System Reserved/EFI",
                        status: "PENDING"
                    },
                    {
                        index: 3,
                        title: "Reboot & Testing Boot Normal",
                        commandOrAction: "Cabut flashdisk, ketik `exit`, lalu klik 'Continue to Windows 10/11'",
                        status: "PENDING"
                    }
                ],
                updatedAt: Date.now()
            }
        }
    };

    static init() {
        if (this.#missions) return;
        try {
            const dir = path.dirname(this.DATA_PATH);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            if (fs.existsSync(this.DATA_PATH)) {
                this.#missions = JSON.parse(fs.readFileSync(this.DATA_PATH, 'utf8'));
            } else {
                this.#missions = { ...this.DEFAULT_MISSIONS };
                this.save();
            }
        } catch (e) {
            this.#missions = { ...this.DEFAULT_MISSIONS };
        }
    }

    static save() {
        try {
            const dir = path.dirname(this.DATA_PATH);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.DATA_PATH, JSON.stringify(this.#missions, null, 2), 'utf8');
        } catch (e) {}
    }

    static getActiveMission() {
        this.init();
        const activeId = this.#missions.activeMissionId;
        return activeId ? this.#missions.missions[activeId] : null;
    }

    /**
     * Checks if input is a progression trigger like "lanjut", "next", "langkah berikutnya"
     */
    static isResumeCommand(text = '') {
        const lower = String(text || '').trim().toLowerCase();
        return (
            lower === 'lanjut' || 
            lower === 'next' || 
            lower === 'lanjutkan' || 
            lower === 'terus' || 
            lower === 'langkah berikutnya' || 
            lower === 'step berikutnya' ||
            lower === 'misi' ||
            lower === 'status misi'
        );
    }

    /**
     * Advances to next step or returns current step details
     */
    static handleProgression(advance = false) {
        this.init();
        const mission = this.getActiveMission();
        if (!mission) {
            return {
                handled: true,
                response: "Belum ada misi aktif yang sedang berjalan, bos. Mau mulai misi baru?"
            };
        }

        if (advance) {
            if (mission.currentStepIndex < mission.steps.length - 1) {
                mission.steps[mission.currentStepIndex].status = "COMPLETED";
                mission.currentStepIndex++;
                mission.steps[mission.currentStepIndex].status = "IN_PROGRESS";
                mission.updatedAt = Date.now();
                this.save();
            } else {
                mission.steps[mission.currentStepIndex].status = "COMPLETED";
                mission.updatedAt = Date.now();
                this.save();
                return {
                    handled: true,
                    response: `🎉 *MISI SELESAI: ${mission.title}*\nSemua ${mission.steps.length} langkah telah selesai dikerjakan! Mantap bos.`
                };
            }
        }

        const step = mission.steps[mission.currentStepIndex];
        let out = `🧩 *MISI AKTIF:* ${mission.title}\n`;
        out += `📌 *Langkah ${step.index + 1}/${mission.steps.length}:* *${step.title}*\n────────────────────────\n`;
        out += `${step.commandOrAction}\n────────────────────────\n`;
        out += `_Ketik *lanjut* jika sudah selesai menjalankan langkah ini._`;

        return { handled: true, response: out };
    }
}
