// src/core/fabric/UniversalCognitiveGraph.mjs
// Interconnected Knowledge Graph connecting People, Projects, Goals, Decisions, and Lessons

export class UniversalCognitiveGraph {
    static #nodes = new Map(); // id -> Node
    static #edges = [];        // Array of { from, to, relation, weight, metadata }
    static #adjList = new Map(); // id -> Array of edge indices

    /**
     * Adds or updates a node in the graph
     * @param {Object} node - { id, type, properties, label }
     * @returns {Object} Node
     */
    static addNode({ id, type = 'ENTITY', properties = {}, label = '' }) {
        if (!id) throw new Error('Node requires an id');
        const node = {
            id: String(id).toLowerCase(),
            type: String(type).toUpperCase(),
            label: label || String(id),
            properties,
            updatedAt: Date.now()
        };
        this.#nodes.set(node.id, node);
        if (!this.#adjList.has(node.id)) {
            this.#adjList.set(node.id, []);
        }
        return node;
    }

    /**
     * Adds a directed relationship edge between two nodes
     * @param {Object} edge - { from, to, relation, weight, metadata }
     * @returns {Object} Edge
     */
    static addEdge({ from, to, relation = 'RELATES_TO', weight = 1.0, metadata = {} }) {
        const fromId = String(from).toLowerCase();
        const toId = String(to).toLowerCase();

        // Ensure nodes exist
        if (!this.#nodes.has(fromId)) this.addNode({ id: fromId, type: 'AUTO' });
        if (!this.#nodes.has(toId)) this.addNode({ id: toId, type: 'AUTO' });

        const edge = {
            from: fromId,
            to: toId,
            relation: String(relation).toUpperCase(),
            weight: Number(weight),
            metadata,
            timestamp: Date.now()
        };

        const edgeIdx = this.#edges.length;
        this.#edges.push(edge);
        this.#adjList.get(fromId).push(edgeIdx);

        return edge;
    }

    /**
     * Gets a node by id
     * @param {string} id
     * @returns {Object|null}
     */
    static getNode(id) {
        if (!id) return null;
        return this.#nodes.get(String(id).toLowerCase()) || null;
    }

    /**
     * Finds immediate neighbors of a node, optionally filtered by relation type
     * @param {string} id
     * @param {string} [relationType]
     * @returns {Object[]} Array of { node, relation, weight, direction }
     */
    static getNeighbors(id, relationType = null) {
        const nodeId = String(id).toLowerCase();
        if (!this.#nodes.has(nodeId)) return [];

        const neighbors = [];
        const edgeIndices = this.#adjList.get(nodeId) || [];

        for (const idx of edgeIndices) {
            const edge = this.#edges[idx];
            if (!relationType || edge.relation === String(relationType).toUpperCase()) {
                const targetNode = this.#nodes.get(edge.to);
                if (targetNode) {
                    neighbors.push({
                        node: targetNode,
                        relation: edge.relation,
                        weight: edge.weight,
                        direction: 'OUTGOING'
                    });
                }
            }
        }

        return neighbors;
    }

    /**
     * Retrieves an ego subgraph centered on a node up to depth
     * @param {string} centerId
     * @param {number} [depth=1]
     * @returns {{ nodes: Object[], edges: Object[] }}
     */
    static getSubgraph(centerId, depth = 1) {
        const start = String(centerId).toLowerCase();
        if (!this.#nodes.has(start)) return { nodes: [], edges: [] };

        const visitedNodes = new Set([start]);
        const includedEdges = [];
        let currentLevel = [start];

        for (let d = 0; d < depth; d++) {
            const nextLevel = [];
            for (const nid of currentLevel) {
                const edgeIndices = this.#adjList.get(nid) || [];
                for (const idx of edgeIndices) {
                    const edge = this.#edges[idx];
                    includedEdges.push(edge);
                    if (!visitedNodes.has(edge.to)) {
                        visitedNodes.add(edge.to);
                        nextLevel.push(edge.to);
                    }
                }
            }
            currentLevel = nextLevel;
            if (currentLevel.length === 0) break;
        }

        const nodes = Array.from(visitedNodes).map(id => this.#nodes.get(id)).filter(Boolean);
        return { nodes, edges: includedEdges };
    }

    /**
     * Finds nodes by type
     * @param {string} type
     * @returns {Object[]}
     */
    static findNodesByType(type) {
        if (!type) return [];
        const targetType = String(type).toUpperCase();
        return Array.from(this.#nodes.values()).filter(n => n.type === targetType);
    }

    /**
     * Gets all nodes
     * @returns {Object[]}
     */
    static getAllNodes() {
        return Array.from(this.#nodes.values());
    }

    /**
     * Gets all edges
     * @returns {Object[]}
     */
    static getAllEdges() {
        return [...this.#edges];
    }

    /**
     * Resets graph for testing
     */
    static reset() {
        this.#nodes.clear();
        this.#edges = [];
        this.#adjList.clear();
    }
}
