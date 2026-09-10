// src/core/world/PersistentWorldModel.mjs
// Structured, dynamic personal knowledge graph for ARKA OS (People, Projects, Goals, Commitments, Preferences)
// Links seamlessly to UniversalCognitiveGraph and persists to data/persistent_world_model.json

import fs from 'fs';
import path from 'path';
import { UniversalCognitiveGraph } from '../fabric/UniversalCognitiveGraph.mjs';

const DEFAULT_DATA_PATH = path.resolve(process.cwd(), 'data/persistent_world_model.json');

const INITIAL_WORLD_STATE = {
    PEOPLE: {
        agus: {
            id: 'person_agus',
            canonicalName: 'Agus Salim',
            aliases: ['agus', 'mas agus', 'bos', 'owner'],
            role: 'Principal Architect & System Owner',
            relationship: 'SELF_OWNER',
            trustScore: 1.0,
            communicationStyle: 'Pragmatic, direct, Semarangan casual, anti-corporate fluff',
            activeProjects: ['proj_arka', 'proj_ev_tuner', 'proj_web'],
            notes: 'Creator and owner of ARKA Personal AI OS.',
            updatedAt: Date.now()
        },
        dito: {
            id: 'person_dito',
            canonicalName: 'Dito',
            aliases: ['dito', 'mas dito'],
            role: 'Close Friend & Collaborator',
            relationship: 'CLOSE_FRIEND',
            trustScore: 0.9,
            communicationStyle: 'Casual, santai, tech banter',
            activeProjects: ['proj_ev_tuner'],
            notes: 'Collaborates on technical projects & EV conversions.',
            updatedAt: Date.now()
        }
    },
    PROJECTS: {
        arka: {
            id: 'proj_arka',
            name: 'ARKA Personal AI OS',
            codeName: 'wa-bot-super',
            repo: 'https://github.com/genjusniper/wa-bot-super',
            status: 'ACTIVE_DEVELOPMENT',
            techStack: ['Node.js (ESM)', 'Baileys', 'SQLite', 'PM2', 'Termux Android'],
            activeProblems: ['Multimodal edge-cases', 'Context compression', 'Model routing optimization'],
            recentDecisions: ['Adopt Decoupled Intelligence & Personality Architecture', 'Implement Global Control Plane'],
            assignedPeople: ['person_agus'],
            updatedAt: Date.now()
        },
        ev_tuner: {
            id: 'proj_ev_tuner',
            name: 'EV Tuner & Telemetry',
            codeName: 'ev-tuner',
            repo: 'local-workspace',
            status: 'PLANNING',
            techStack: ['C++', 'CAN-Bus', 'ESP32', 'Python Telemetry'],
            activeProblems: ['Battery management system (BMS) communication protocol'],
            recentDecisions: ['Use ESP32-S3 for CAN-Bus sniffing'],
            assignedPeople: ['person_agus', 'person_dito'],
            updatedAt: Date.now()
        },
        website: {
            id: 'proj_web',
            name: 'Personal & Portfolio Website',
            codeName: 'personal-web',
            repo: 'github.com/genjusniper/web',
            status: 'MAINTENANCE',
            techStack: ['Next.js', 'TailwindCSS'],
            activeProblems: [],
            recentDecisions: [],
            assignedPeople: ['person_agus'],
            updatedAt: Date.now()
        }
    },
    GOALS: {
        goal_arka_os: {
            id: 'goal_arka_os',
            title: 'Build ARKA OS v1 - The Universal Personal AI Agent',
            projectRef: 'proj_arka',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            milestones: [
                { name: 'Phase 27 Universal WA Fabric', done: true },
                { name: 'Phase 28 Multimodal Fabric', done: true },
                { name: 'Phase 28A Global Control Plane', done: true },
                { name: 'Phase 29 Persistent World Model', done: true },
                { name: 'Phase 60 ARKA OS v1 Master Release', done: false }
            ],
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
    },
    COMMITMENTS: {
        com_check_ev: {
            id: 'com_check_ev',
            from: 'person_agus',
            to: 'person_dito',
            statement: 'Cek protokol CAN-Bus controller minggu depan',
            temporalRef: 'NEXT_WEEK',
            status: 'PENDING',
            createdAt: Date.now()
        }
    },
    PREFERENCES: {
        verbosity: 0.35,
        humorLevel: 0.40,
        directness: 0.90,
        defaultModelSpeed: 'FAST',
        quietHours: { enabled: true, start: '23:00', end: '06:00' },
        safeModeDefault: false
    }
};

export class PersistentWorldModel {
    static state = null;
    static dataFilePath = DEFAULT_DATA_PATH;

    static init(customPath = null) {
        if (customPath) this.dataFilePath = customPath;
        this.load();
        this.syncToCognitiveGraph();
        return this.state;
    }

    static load() {
        try {
            if (fs.existsSync(this.dataFilePath)) {
                const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
                this.state = JSON.parse(raw);
            } else {
                this.state = JSON.parse(JSON.stringify(INITIAL_WORLD_STATE));
                this.save();
            }
        } catch (err) {
            console.warn('[PersistentWorldModel] Warning: Failed to load world model, using initial state:', err.message);
            this.state = JSON.parse(JSON.stringify(INITIAL_WORLD_STATE));
        }
        return this.state;
    }

    static save() {
        if (!this.state) return;
        try {
            const dir = path.dirname(this.dataFilePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const tmpFile = this.dataFilePath + '.tmp_' + Date.now();
            fs.writeFileSync(tmpFile, JSON.stringify(this.state, null, 2), 'utf-8');
            fs.renameSync(tmpFile, this.dataFilePath);
        } catch (err) {
            console.error('[PersistentWorldModel] Error: Failed to save world model:', err.message);
        }
    }

    static syncToCognitiveGraph() {
        if (!this.state) this.load();

        for (const [key, p] of Object.entries(this.state.PEOPLE || {})) {
            UniversalCognitiveGraph.addNode({
                id: p.id,
                type: 'PERSON',
                label: p.canonicalName,
                properties: { role: p.role, relationship: p.relationship, trustScore: p.trustScore }
            });
        }

        for (const [key, proj] of Object.entries(this.state.PROJECTS || {})) {
            UniversalCognitiveGraph.addNode({
                id: proj.id,
                type: 'PROJECT',
                label: proj.name,
                properties: { status: proj.status, techStack: proj.techStack }
            });

            for (const personId of (proj.assignedPeople || [])) {
                UniversalCognitiveGraph.addEdge({
                    from: personId,
                    to: proj.id,
                    relation: 'CONTRIBUTES_TO'
                });
            }
        }

        for (const [key, g] of Object.entries(this.state.GOALS || {})) {
            UniversalCognitiveGraph.addNode({
                id: g.id,
                type: 'GOAL',
                label: g.title,
                properties: { status: g.status, priority: g.priority }
            });

            if (g.projectRef) {
                UniversalCognitiveGraph.addEdge({
                    from: g.id,
                    to: g.projectRef,
                    relation: 'BELONGS_TO_PROJECT'
                });
            }
        }
    }

    static setEntity(domain, key, data) {
        if (!this.state) this.load();
        if (!this.state[domain]) this.state[domain] = {};

        this.state[domain][key] = {
            ...(this.state[domain][key] || {}),
            ...data,
            updatedAt: Date.now()
        };

        this.save();
        this.syncToCognitiveGraph();
        return this.state[domain][key];
    }

    static getEntity(domain, key) {
        if (!this.state) this.load();
        return this.state[domain]?.[key] || null;
    }

    static resolveEntities(text = '') {
        if (!this.state) this.load();
        const lower = (text || '').toLowerCase();
        const matches = {
            people: [],
            projects: [],
            goals: [],
            commitments: []
        };

        for (const [key, p] of Object.entries(this.state.PEOPLE || {})) {
            const hit = (p.aliases || []).some(alias => lower.includes(alias.toLowerCase())) ||
                        lower.includes(p.canonicalName.toLowerCase());
            if (hit) matches.people.push(p);
        }

        for (const [key, proj] of Object.entries(this.state.PROJECTS || {})) {
            const hit = lower.includes(proj.name.toLowerCase()) ||
                        lower.includes(proj.codeName.toLowerCase()) ||
                        (key === 'arka' && (lower.includes('bot') || lower.includes('arka'))) ||
                        (key === 'ev_tuner' && (lower.includes('ev') || lower.includes('canbus') || lower.includes('can-bus') || lower.includes('tuner')));
            if (hit) matches.projects.push(proj);
        }

        for (const [key, g] of Object.entries(this.state.GOALS || {})) {
            if (lower.includes(g.title.toLowerCase()) || (g.projectRef && matches.projects.some(p => p.id === g.projectRef))) {
                matches.goals.push(g);
            }
        }

        for (const [key, c] of Object.entries(this.state.COMMITMENTS || {})) {
            if (c.status === 'PENDING' && (matches.people.some(p => p.id === c.to || p.id === c.from))) {
                matches.commitments.push(c);
            }
        }

        return matches;
    }

    static getContextInjection(text = '') {
        const resolved = this.resolveEntities(text);
        const parts = [];

        if (resolved.people.length > 0) {
            parts.push('[World:People] ' + resolved.people.map(p => p.canonicalName + ' (' + p.role + ', rel:' + p.relationship + ')').join('; '));
        }
        if (resolved.projects.length > 0) {
            parts.push('[World:Projects] ' + resolved.projects.map(pr => pr.name + ' (status:' + pr.status + ', stack:' + pr.techStack.slice(0, 3).join('/') + ')').join('; '));
        }
        if (resolved.goals.length > 0) {
            parts.push('[World:Goals] ' + resolved.goals.map(g => g.title + ' [' + g.status + ']').join('; '));
        }
        if (resolved.commitments.length > 0) {
            parts.push('[World:Commitments] ' + resolved.commitments.map(c => '"' + c.statement + '" (' + c.temporalRef + ')').join('; '));
        }

        return parts.join('\n');
    }
}
