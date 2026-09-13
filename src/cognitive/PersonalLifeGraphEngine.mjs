// src/cognitive/PersonalLifeGraphEngine.mjs
// Entity & Relationship Knowledge Graph connecting People, Devices, Projects, and Open Loops for the Owner

import fs from 'fs';
import path from 'path';

export class PersonalLifeGraphEngine {
    static DATA_PATH = path.resolve(process.cwd(), 'data', 'personal_life_graph.json');
    static #graph = null;

    static DEFAULT_GRAPH = {
        owner: {
            name: "Agus Salim",
            aliases: ["agus", "mas agus", "bos"],
            location: "Semarang, Jawa Tengah",
            occupation: "Tech Builder & Creator"
        },
        people: {
            "novita": {
                id: "novita",
                name: "Novita",
                aliases: ["nov", "novita", "nopita"],
                relationship: "special / sensitive",
                policy: "SILENT",
                notes: "Prioritas tinggi, AI dilarang membalas otomatis (khusus manual Owner)"
            },
            "hanif": {
                id: "hanif",
                name: "Hanif",
                aliases: ["hanif", "nif"],
                relationship: "close friend",
                notes: "Teman akrab nongkrong & komputer/motor"
            },
            "cindy": {
                id: "cindy",
                name: "Cindy",
                aliases: ["cindy", "cin"],
                relationship: "friend",
                notes: "Teman ngobrol ramah & santai"
            }
        },
        devices: {
            "pc_desktop": {
                id: "pc_desktop",
                name: "PC Desktop",
                aliases: ["pc", "komputer", "laptop", "kompi"],
                status: "Troubled (BCD Boot Issue)",
                activeProblem: "BCD error booting Windows, butuh repair via CMD bootable USB",
                lastUpdated: Date.now()
            },
            "hp_termux": {
                id: "hp_termux",
                name: "HP Android (Termux)",
                aliases: ["hp", "termux", "server bot", "android"],
                status: "Operational / Running Salim OS V16",
                role: "Always-on Daemon"
            }
        },
        projects: {
            "salim_os": {
                id: "salim_os",
                name: "Salim OS / ARKA AI",
                aliases: ["arka", "salim", "bot", "salim os"],
                status: "V16 Autonomous Cognitive Evolution",
                milestone: "Situational & Graph Intelligence"
            }
        },
        open_loops: [
            {
                id: "loop_bcd_repair",
                title: "Perbaikan Boot BCD Windows",
                linkedDevice: "pc_desktop",
                status: "IN_PROGRESS",
                lastStep: "Perintah CMD bootable USB (bootrec /fixmbr & bootrec /rebuildbcd)",
                created: Date.now()
            }
        ]
    };

    static init() {
        if (this.#graph) return;
        try {
            const dir = path.dirname(this.DATA_PATH);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            if (fs.existsSync(this.DATA_PATH)) {
                this.#graph = JSON.parse(fs.readFileSync(this.DATA_PATH, 'utf8'));
            } else {
                this.#graph = { ...this.DEFAULT_GRAPH };
                this.save();
            }
        } catch (e) {
            console.warn('[PersonalLifeGraph] ⚠️ Failed to load graph, using default:', e.message);
            this.#graph = { ...this.DEFAULT_GRAPH };
        }
    }

    static save() {
        try {
            const dir = path.dirname(this.DATA_PATH);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.DATA_PATH, JSON.stringify(this.#graph, null, 2), 'utf8');
        } catch (e) {
            console.error('[PersonalLifeGraph] ❌ Failed to save graph:', e.message);
        }
    }

    static resolveEntities(text = '') {
        this.init();
        const lower = String(text || '').toLowerCase();
        const matches = {
            people: [],
            devices: [],
            projects: [],
            activeLoops: []
        };

        for (const [id, p] of Object.entries(this.#graph.people || {})) {
            if (p.aliases.some(alias => lower.includes(alias))) {
                matches.people.push(p);
            }
        }

        for (const [id, d] of Object.entries(this.#graph.devices || {})) {
            if (d.aliases.some(alias => lower.includes(alias))) {
                matches.devices.push(d);
            }
        }

        for (const [id, prj] of Object.entries(this.#graph.projects || {})) {
            if (prj.aliases.some(alias => lower.includes(alias))) {
                matches.projects.push(prj);
            }
        }

        for (const loop of this.#graph.open_loops || []) {
            if (loop.status === 'IN_PROGRESS') {
                const isLinked = matches.devices.some(d => d.id === loop.linkedDevice);
                const isMentioned = lower.includes('bcd') || lower.includes('boot') || lower.includes('windows') || lower.includes('rusak') || lower.includes('benerin') || lower.includes('kemarin');
                if (isLinked || isMentioned) {
                    matches.activeLoops.push(loop);
                }
            }
        }

        return matches;
    }

    static updateDeviceStatus(deviceId, status, activeProblem = null) {
        this.init();
        if (this.#graph.devices[deviceId]) {
            this.#graph.devices[deviceId].status = status;
            if (activeProblem !== null) this.#graph.devices[deviceId].activeProblem = activeProblem;
            this.#graph.devices[deviceId].lastUpdated = Date.now();
            this.save();
        }
    }

    static formatContextDirective(text = '') {
        const matches = this.resolveEntities(text);
        const hasMatches = matches.people.length > 0 || matches.devices.length > 0 || matches.activeLoops.length > 0;
        
        if (!hasMatches) return '';

        let directive = `\n[PERSONAL LIFE GRAPH CONTEXT — RELASI & KONDISI NYATA BOS]:\n`;
        if (matches.devices.length > 0) {
            for (const d of matches.devices) {
                directive += `• Perangkat: ${d.name} | Status: ${d.status} (${d.activeProblem || 'Normal'})\n`;
            }
        }
        if (matches.activeLoops.length > 0) {
            for (const l of matches.activeLoops) {
                directive += `• Masalah Aktif: "${l.title}" | Status: ${l.status} | Langkah terakhir: ${l.lastStep}\n`;
            }
        }
        if (matches.people.length > 0) {
            for (const p of matches.people) {
                directive += `• Orang: ${p.name} (${p.relationship}) | Catatan: ${p.notes}\n`;
            }
        }
        directive += `ARAHAN GRAF: Sambungkan langsung percakapan Bos dengan entitas & masalah di atas jika relevan. Bos tidak perlu mengulang cerita dari nol!\n`;
        return directive;
    }

    /**
     * Extracts verified ground-truth fact strings for EpistemicPartitionEngine
     * @param {string} text
     * @returns {string[]} Array of verified fact strings
     */
    static getFacts(text = '') {
        const matches = this.resolveEntities(text);
        const facts = [
            `Owner: Agus Salim, domisili Semarang, Jawa Tengah.`,
            `HP Android (Termux): Operational daemon aktif menjalankan Salim OS V16.`
        ];

        for (const d of matches.devices) {
            facts.push(`Perangkat ${d.name} berstatus ${d.status}${d.activeProblem ? ` (${d.activeProblem})` : ''}.`);
        }

        for (const l of matches.activeLoops) {
            facts.push(`Masalah aktif "${l.title}" berstatus ${l.status} (langkah terakhir: ${l.lastStep}).`);
        }

        for (const p of matches.people) {
            facts.push(`Kontak ${p.name} (${p.relationship}): ${p.notes}.`);
        }

        // If specific devices weren't matched in text, always keep PC status available if user talks about tech/work
        if (matches.devices.length === 0) {
            const pc = this.#graph.devices?.pc_desktop;
            if (pc) {
                facts.push(`PC Desktop: ${pc.status} (${pc.activeProblem || 'normal'}).`);
            }
        }

        return facts;
    }
}
