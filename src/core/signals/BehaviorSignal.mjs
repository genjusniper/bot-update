// src/core/signals/BehaviorSignal.mjs
// Canonical, typed schema for all sensory observations across the OS

export const SIGNAL_SCHEMA_VERSION = '1.0.0';

export const DIMENSIONS = {
    INTENT: 'INTENT',
    EMOTIONAL_INTENSITY: 'EMOTIONAL_INTENSITY',
    EMOTION_VALENCE: 'EMOTION_VALENCE',
    HUMOR_PERMISSION: 'HUMOR_PERMISSION',
    CONVERSATION_STATE: 'CONVERSATION_STATE',
    TOPIC_CONTINUITY: 'TOPIC_CONTINUITY',
    RELATIONSHIP_TIER: 'RELATIONSHIP_TIER',
    TEMPERATURE: 'TEMPERATURE',
    URGENCY: 'URGENCY',
    CONFUSION: 'CONFUSION',
    QUESTION_PRESSURE: 'QUESTION_PRESSURE'
};

export class BehaviorSignal {
    /**
     * @param {Object} params
     * @param {string} params.dimension - One of DIMENSIONS
     * @param {*} params.value - Normalized scalar or categorical value
     * @param {number} [params.confidence=1.0] - Confidence score between 0.0 and 1.0
     * @param {number} [params.weight=1.0] - Priority weight of this observer
     * @param {string} params.source - Name of observer module producing the signal
     * @param {Object} [params.metadata={}] - Optional contextual facts
     * @param {number} [params.timestamp=Date.now()]
     */
    constructor({
        dimension,
        value,
        confidence = 1.0,
        weight = 1.0,
        source = 'unknown',
        metadata = {},
        timestamp = Date.now()
    }) {
        this.schemaVersion = SIGNAL_SCHEMA_VERSION;
        this.dimension = String(dimension || '').toUpperCase();
        this.value = value;
        this.confidence = Math.max(0.0, Math.min(1.0, Number(confidence) || 0.0));
        this.weight = Math.max(0.1, Math.min(5.0, Number(weight) || 1.0));
        this.source = String(source || 'unknown');
        this.metadata = metadata && typeof metadata === 'object' ? metadata : {};
        this.timestamp = Number(timestamp) || Date.now();

        this.validate();
    }

    validate() {
        if (!this.dimension || !DIMENSIONS[this.dimension]) {
            throw new Error(`[BehaviorSignal] Invalid or unknown dimension: "${this.dimension}"`);
        }
        if (this.value === undefined || this.value === null) {
            throw new Error(`[BehaviorSignal] Value cannot be null or undefined for dimension: "${this.dimension}"`);
        }
    }

    toJSON() {
        return {
            schemaVersion: this.schemaVersion,
            dimension: this.dimension,
            value: this.value,
            confidence: this.confidence,
            weight: this.weight,
            source: this.source,
            metadata: this.metadata,
            timestamp: this.timestamp
        };
    }
}
