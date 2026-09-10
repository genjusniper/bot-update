// src/core/world/WorldModelResolver.mjs
// Contextual world facts resolver feeding relevant ground truth into the simulation kernel

import { WorldEntityModel } from './WorldEntityModel.mjs';

export class WorldModelResolver {
    /**
     * Resolves relevant world context for an incoming interaction
     * @param {Object} params
     * @param {string} params.text
     * @param {Object} [params.fusedSnapshot={}]
     * @returns {Object} World context
     */
    static resolve({ text = '', fusedSnapshot = {} }) {
        const matchingEntities = WorldEntityModel.findEntities(text);

        return {
            ownerIdentity: `${WorldEntityModel.PEOPLE.AGUS.name} (${WorldEntityModel.PEOPLE.AGUS.role})`,
            location: WorldEntityModel.PEOPLE.AGUS.location,
            activeProjects: matchingEntities,
            immutableRules: WorldEntityModel.IMMUTABLE_RULES.slice(0, 2),
            directiveText: matchingEntities.length > 0
                ? `ENTITAS AKTIF: Terkait proyek ${matchingEntities.map(e => e.name).join(', ')}.`
                : 'FAKTA DUNIA: Basis pengetahuan personal Mas Agus (Semarang).'
        };
    }
}
