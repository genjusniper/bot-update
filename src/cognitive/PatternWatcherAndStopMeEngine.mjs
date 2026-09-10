// src/cognitive/PatternWatcherAndStopMeEngine.mjs
// Objective sparring partner & anti-sycophancy counterweight preventing unproductive loops

import fs from 'fs';
import path from 'path';

export class PatternWatcherAndStopMeEngine {
    static DATA_PATH = path.resolve(process.cwd(), 'data', 'owner_patterns.json');
    static #data = null;

    static init() {
        if (this.#data) return;
        try {
            const dir = path.dirname(this.DATA_PATH);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            if (fs.existsSync(this.DATA_PATH)) {
                this.#data = JSON.parse(fs.readFileSync(this.DATA_PATH, 'utf8'));
            } else {
                this.#data = {
                    project_switch_count: 0,
                    last_switched_time: 0,
                    active_open_projects: ["Salim OS V16", "Windows BCD Repair"],
                    historical_warnings: []
                };
                this.save();
            }
        } catch (e) {
            this.#data = { project_switch_count: 0, active_open_projects: [] };
        }
    }

    static save() {
        try {
            const dir = path.dirname(this.DATA_PATH);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.DATA_PATH, JSON.stringify(this.#data, null, 2), 'utf8');
        } catch (e) {}
    }

    /**
     * Checks if current input triggers a "STOP ME" counterweight
     * @param {string} text - Owner's input
     * @returns {{ shouldIntervene: boolean, warningMessage: string|null, reason: string|null }}
     */
    static check(text = '') {
        this.init();
        const raw = String(text || '').toLowerCase();

        // Pattern 1: Shiny Object Syndrome (ingin buka proyek baru saat proyek lama belum tuntas)
        const isNewProjectProposal = (
            raw.includes('bikin proyek baru') || 
            raw.includes('mau buat bot baru') || 
            raw.includes('gimana kalau kita bikin') || 
            raw.includes('ada ide baru lagi nih') ||
            (raw.includes('bikin') && raw.includes('baru lagi'))
        );

        const hasUnfinishedProjects = (this.#data.active_open_projects || []).length >= 2;

        if (isNewProjectProposal && hasUnfinishedProjects) {
            const projectsList = this.#data.active_open_projects.join(' & ');
            return {
                shouldIntervene: true,
                reason: 'SHINY_OBJECT_TRAP',
                warningMessage: `Tunggu sek bos ✋. Kita masih punya urusan belum tuntas: *${projectsList}*. Kalau buka proyek baru lagi sekarang, polanya mirip kemarin: proyek lama mandek di tengah jalan. Saran gue: tuntasin satu ini dulu, baru kita garap ide baru itu bareng. Gimana?`
            };
        }

        // Pattern 2: Overthinking / Rabbit Hole Trap late night
        const hour = new Date().getHours();
        const isLateNight = hour >= 23 || hour < 4;
        const isObsessiveResearch = (
            raw.includes('kenapa ya') && 
            (raw.includes('ngulik') || raw.includes('masih penasaran') || raw.includes('gak bisa tidur'))
        );

        if (isLateNight && isObsessiveResearch) {
            return {
                shouldIntervene: true,
                reason: 'LATE_NIGHT_RABBIT_HOLE',
                warningMessage: `Stop sek bos 🛑. Jam segini (jam ${hour}) otak udah gak seger buat debug hal rumit. Kalau dipaksain malah bikin pusing dan besok lemes. Catat pertanyaannya sekarang, besok pagi jam 8 kita bedah tuntas.`
            };
        }

        return { shouldIntervene: false, warningMessage: null, reason: null };
    }

    static recordNewProject(projectName) {
        this.init();
        if (projectName && !this.#data.active_open_projects.includes(projectName)) {
            this.#data.active_open_projects.push(projectName);
            this.#data.project_switch_count++;
            this.#data.last_switched_time = Date.now();
            this.save();
        }
    }

    static completeProject(projectName) {
        this.init();
        this.#data.active_open_projects = this.#data.active_open_projects.filter(p => !p.toLowerCase().includes(projectName.toLowerCase()));
        this.save();
    }
}
