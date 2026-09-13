import fs from 'fs';
import path from 'path';

const ALLOWED_TRANSITIONS = {
    NONE: ["DISCOVERED"],
    DISCOVERED: ["VERIFIED", "INVALID"],
    VERIFIED: ["QUALIFIED", "INVALID"],
    QUALIFIED: ["CONTACTED", "LOST"],
    CONTACTED: ["RESPONDED", "NOT_INTERESTED", "OPT_OUT"],
    RESPONDED: ["QUOTED", "NOT_INTERESTED", "OPT_OUT"],
    QUOTED: ["ORDERED", "LOST"],
    ORDERED: ["REPEAT_ORDER"],
    REPEAT_ORDER: [],
    // Negative states can potentially be reactivated later, but for now we consider them terminal 
    // unless explicitly handled by a reactivation event.
    INVALID: [],
    LOST: [],
    NOT_INTERESTED: [],
    OPT_OUT: []
};

export class EventLedger {
    constructor(ledgerPath = './data/ledger/events.jsonl', statePath = './data/ledger/state.json') {
        this.ledgerPath = ledgerPath;
        this.statePath = statePath;
        
        const dir = path.dirname(this.ledgerPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Load or initialize state index
        this.stateIndex = {};
        if (fs.existsSync(this.statePath)) {
            try {
                this.stateIndex = JSON.parse(fs.readFileSync(this.statePath, 'utf-8'));
            } catch (e) {
                console.warn("[Ledger] Corrupt state file. Reconstructing from ledger...");
                this.reconstructState();
            }
        } else {
            this.reconstructState();
        }
    }

    reconstructState() {
        this.stateIndex = {};
        if (!fs.existsSync(this.ledgerPath)) return;
        
        const lines = fs.readFileSync(this.ledgerPath, 'utf-8').split('\\n').filter(Boolean);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            try {
                const event = JSON.parse(line);
                if (!this.stateIndex[event.leadId]) {
                    this.stateIndex[event.leadId] = { state: "NONE", history: [], processedCorrelations: [] };
                }
                
                if (event.eventType === 'STATE_TRANSITION') {
                    this.stateIndex[event.leadId].state = event.payload.newState;
                }
                this.stateIndex[event.leadId].history.push(event.eventId);
                if (event.correlationId) {
                    this.stateIndex[event.leadId].processedCorrelations.push(event.correlationId);
                }
            } catch (e) {
                // DO NOT SILENTLY SKIP
                throw new Error(`CORRUPT_TAIL_DETECTED at line ${i + 1}: ${line}`);
            }
        }
        this.saveStateIndex();
    }

    saveStateIndex() {
        fs.writeFileSync(this.statePath, JSON.stringify(this.stateIndex, null, 2));
    }

    getLeadState(leadId) {
        return this.stateIndex[leadId] ? this.stateIndex[leadId].state : "NONE";
    }

    async logEvent(correlationId, leadId, eventType, payload = {}) {
        // Idempotency check: prevent duplicate events with same correlationId
        if (this.stateIndex[leadId] && this.stateIndex[leadId].processedCorrelations) {
            if (this.stateIndex[leadId].processedCorrelations.includes(correlationId)) {
                return null; // Already processed this correlation for this lead
            }
        }

        const event = {
            eventId: `evt-${Date.now()}-${Math.floor(Math.random()*10000)}`,
            correlationId,
            leadId,
            timestamp: new Date().toISOString(),
            eventType,
            payload
        };
        
        // Append to immutable log
        const line = JSON.stringify(event) + '\\n';
        fs.appendFileSync(this.ledgerPath, line);
        
        // Update state index metadata
        if (!this.stateIndex[leadId]) {
            this.stateIndex[leadId] = { state: "NONE", history: [], processedCorrelations: [] };
        }
        this.stateIndex[leadId].history.push(event.eventId);
        this.stateIndex[leadId].processedCorrelations.push(correlationId);
        
        this.saveStateIndex();
        return event;
    }

    async transitionState(correlationId, leadId, newState, terminalReason = null) {
        const currentState = this.getLeadState(leadId);
        
        if (!ALLOWED_TRANSITIONS[currentState] || !ALLOWED_TRANSITIONS[currentState].includes(newState)) {
            throw new Error(`Invalid transition: ${currentState} -> ${newState}`);
        }

        const payload = { oldState: currentState, newState };
        if (terminalReason) {
            payload.terminalReason = terminalReason;
        }

        const event = await this.logEvent(correlationId, leadId, 'STATE_TRANSITION', payload);
        if (event) {
            this.stateIndex[leadId].state = newState;
            this.saveStateIndex();
        }
        return event;
    }
}
