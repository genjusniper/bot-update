// src/eval/ReplayStudio.mjs
// Lightweight trace recorder and backward-compatible bridge for PersonalAIOS

import { BehavioralScorecard } from './ReplayLab2.mjs';

export class ReplayStudio {
    static #traces = new Map();
    static #maxTraces = 50;

    /**
     * Records an execution trace for later replay
     * @param {string} corrId
     * @param {Object} trace
     */
    static async recordTrace(corrId, trace = {}) {
        if (!corrId) return;

        if (this.#traces.size >= this.#maxTraces) {
            const oldestKey = this.#traces.keys().next().value;
            this.#traces.delete(oldestKey);
        }

        this.#traces.set(corrId, {
            corrId,
            timestamp: Date.now(),
            ...trace
        });
    }

    static getTrace(corrId) {
        return this.#traces.get(corrId) || null;
    }

    static listTraces() {
        return Array.from(this.#traces.values());
    }

    static clear() {
        this.#traces.clear();
    }
}

export { BehavioralScorecard };