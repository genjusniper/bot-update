// src/core/autonomy/EventScheduler.mjs
// Autonomous task and reminder event scheduler

export class EventScheduler {
    static #events = new Map(); // eventId -> EventRecord

    /**
     * Schedules a future event or reminder
     * @param {Object} event
     * @returns {Object} Scheduled EventRecord
     */
    static scheduleEvent({ eventId, targetJid, triggerTime, description, actionType = 'REMINDER', payload = {} }) {
        if (!targetJid || !triggerTime) {
            throw new Error('Event requires targetJid and triggerTime');
        }

        const id = eventId || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const record = {
            eventId: id,
            targetJid,
            triggerTime,
            description: description || 'Scheduled Event',
            actionType,
            payload,
            status: 'SCHEDULED',
            createdAt: Date.now()
        };

        this.#events.set(id, record);
        return record;
    }

    /**
     * Polls and extracts all due events
     * @param {number} [currentTime=Date.now()]
     * @returns {Object[]} Due events that transitioned to TRIGGERED
     */
    static getDueEvents(currentTime = Date.now()) {
        const due = [];
        for (const [id, evt] of this.#events.entries()) {
            if (evt.status === 'SCHEDULED' && currentTime >= evt.triggerTime) {
                evt.status = 'TRIGGERED';
                evt.triggeredAt = currentTime;
                due.push(evt);
            }
        }
        return due;
    }

    /**
     * Cancels a scheduled event
     * @param {string} eventId
     * @returns {boolean}
     */
    static cancelEvent(eventId) {
        const evt = this.#events.get(eventId);
        if (evt && evt.status === 'SCHEDULED') {
            evt.status = 'CANCELLED';
            return true;
        }
        return false;
    }

    /**
     * Resets event store for testing
     */
    static reset() {
        this.#events.clear();
    }
}
