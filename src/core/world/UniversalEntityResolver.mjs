// src/core/world/UniversalEntityResolver.mjs
// Extracts and resolves universal real-world entities (Person, Project, Company, Place, Event, Device, Topic, Goal)

import { WorldEntityModel } from './WorldEntityModel.mjs';
import { PersonEntityResolver } from '../identity/PersonEntityResolver.mjs';

export class UniversalEntityResolver {
    // Universal Knowledge Base Seeds
    static PLACES = Object.freeze({
        SEMARANG: { id: 'place_semarang', name: 'Semarang', aliases: ['semarang', 'smg'], type: 'CITY', context: 'Base location of Mas Agus' },
        JAKARTA: { id: 'place_jakarta', name: 'Jakarta', aliases: ['jakarta', 'jkt'], type: 'CITY', context: 'Capital / Client hub' }
    });

    static DEVICES = Object.freeze({
        TERMUX: { id: 'dev_termux', name: 'Termux Android', aliases: ['termux', 'android', 'hp'], type: 'DEVICE', context: '24/7 Production daemon host' },
        LAPTOP: { id: 'dev_laptop', name: 'Windows Laptop', aliases: ['laptop', 'pc', 'komputer', 'notebook'], type: 'DEVICE', context: 'Development and coding environment' }
    });

    static COMPANIES = Object.freeze({
        GOOGLE: { id: 'org_google', name: 'Google', aliases: ['google', 'deepmind'], type: 'ORGANIZATION', context: 'DeepMind, Gemini models provider' },
        GROQ: { id: 'org_groq', name: 'Groq', aliases: ['groq'], type: 'ORGANIZATION', context: 'High-speed LLaMA inference provider' }
    });

    /**
     * Extracts all entities found in a given text
     * @param {string} text 
     * @returns {{ people: Object[], projects: Object[], places: Object[], devices: Object[], companies: Object[] }}
     */
    static resolveEntities(text = '') {
        if (!text) return { people: [], projects: [], places: [], devices: [], companies: [] };

        const lower = text.toLowerCase();

        // 1. People
        const people = PersonEntityResolver.extractMentions(text);

        // 2. Projects (from WorldEntityModel)
        const projects = WorldEntityModel.findEntities(text);

        // 3. Places
        const places = [];
        for (const [key, place] of Object.entries(this.PLACES)) {
            if (place.aliases.some(a => lower.includes(a))) {
                places.push(place);
            }
        }

        // 4. Devices
        const devices = [];
        for (const [key, dev] of Object.entries(this.DEVICES)) {
            if (dev.aliases.some(a => lower.includes(a))) {
                devices.push(dev);
            }
        }

        // 5. Companies / Orgs
        const companies = [];
        for (const [key, org] of Object.entries(this.COMPANIES)) {
            if (org.aliases.some(a => lower.includes(a))) {
                companies.push(org);
            }
        }

        return {
            people,
            projects,
            places,
            devices,
            companies
        };
    }
}
