// src/core/fabric/WorldModel2.mjs
// World Model 2.0: Observation -> Evidence -> Entity Resolution -> Temporal -> Conflict Check -> State

import { UniversalCognitiveGraph } from './UniversalCognitiveGraph.mjs';
import { RealityGroundingEngine } from './RealityGroundingEngine.mjs';
import { UniversalEntityResolver } from '../world/UniversalEntityResolver.mjs';
import { TemporalIntelligence } from '../memory/TemporalIntelligence.mjs';
import { EvidenceEngine } from '../memory/EvidenceEngine.mjs';
import { PersistentWorldModel } from '../world/PersistentWorldModel.mjs';
import { TemporalEntityEngine } from '../world/TemporalEntityEngine.mjs';

export class WorldModel2 {
    /**
     * Ingests an observation and links all resolved entities into the cognitive graph
     * @param {Object} params
     * @param {string} params.text
     * @param {string} params.senderId
     * @param {string} params.chatId
     * @returns {Object} World State Snapshot
     */
    static ingest({ text = '', senderId = '', chatId = '' }) {
        // 1. Reality Grounding
        const grounding = RealityGroundingEngine.evaluate({ text, source: 'USER' });

        // 2. Entity Resolution via Persistent World Model
        const worldEntities = PersistentWorldModel.resolveEntities(text);
        const legacyEntities = UniversalEntityResolver.resolveEntities(text);

        // 3. Temporal Anchoring via High-Fidelity Temporal Engine
        const temporalHighFi = TemporalEntityEngine.resolve(text);
        const legacyTemporal = TemporalIntelligence.parse(text);

        // 4. Compact Reasoning Prompt Injection
        const contextInjection = PersistentWorldModel.getContextInjection(text);

        // 5. Link into Universal Cognitive Graph
        const obsId = `obs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        UniversalCognitiveGraph.addNode({
            id: obsId,
            type: 'OBSERVATION',
            label: text.slice(0, 40),
            properties: { text, grounding, temporal: temporalHighFi }
        });

        // Link legacy + persistent people
        for (const p of (worldEntities.people || [])) {
            UniversalCognitiveGraph.addNode({ id: p.id, type: 'PERSON', label: p.canonicalName });
            UniversalCognitiveGraph.addEdge({ from: obsId, to: p.id, relation: 'MENTIONS_PERSON' });
        }

        // Link projects
        for (const proj of (worldEntities.projects || [])) {
            UniversalCognitiveGraph.addNode({ id: proj.id, type: 'PROJECT', label: proj.name });
            UniversalCognitiveGraph.addEdge({ from: obsId, to: proj.id, relation: 'RELATES_TO_PROJECT' });
        }

        // Link devices
        for (const dev of (legacyEntities.devices || [])) {
            UniversalCognitiveGraph.addNode({ id: dev.id, type: 'DEVICE', label: dev.name });
            UniversalCognitiveGraph.addEdge({ from: obsId, to: dev.id, relation: 'OPERATES_ON_DEVICE' });
        }

        return {
            obsId,
            grounding,
            entities: {
                ...legacyEntities,
                persistentPeople: worldEntities.people,
                persistentProjects: worldEntities.projects,
                persistentGoals: worldEntities.goals,
                persistentCommitments: worldEntities.commitments
            },
            temporal: temporalHighFi,
            legacyTemporal,
            contextInjection,
            graphNodesLinked: 1 + (worldEntities.people.length || 0) + (worldEntities.projects.length || 0) + (legacyEntities.devices?.length || 0)
        };
    }
}

