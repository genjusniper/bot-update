// src/observability/ReplayDebugger.mjs
import fs from 'fs';
import path from 'path';

export class ReplayDebugger {
  static eventStoreFile = path.join(process.cwd(), 'memory', 'event_store.jsonl');

  static _loadEvents() {
    if (!fs.existsSync(this.eventStoreFile)) return [];
    const lines = fs.readFileSync(this.eventStoreFile, 'utf8').split('\n').filter(Boolean);
    return lines.map(line => JSON.parse(line));
  }

  static replayEvent(eventId) {
    const events = this._loadEvents();
    const event = events.find(e => e.eventId === eventId);
    
    if (!event) {
      console.log(`❌ Event ID ${eventId} not found.`);
      return;
    }

    console.log(`\n==========================================`);
    console.log(`🔍 DETAILED EVENT REPLAY: ${event.eventId}`);
    console.log(`==========================================`);
    console.log(`Name:          ${event.name}`);
    console.log(`CorrelationId: ${event.correlationId}`);
    console.log(`CausationId:   ${event.causationId}`);
    console.log(`Timestamp:     ${new Date(event.timestamp).toLocaleString()}`);
    console.log(`Payload:\n`, JSON.stringify(event.payload, null, 2));
    console.log(`==========================================\n`);
  }

  static replayCorrelation(correlationId) {
    const events = this._loadEvents();
    const thread = events
      .filter(e => e.correlationId === correlationId)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (thread.length === 0) {
      console.log(`❌ No events found for Correlation ID ${correlationId}.`);
      return;
    }

    console.log(`\n========================================================================`);
    console.log(`⏪ CAUSATION CHAIN REPLAY: ${correlationId} (${thread.length} events)`);
    console.log(`========================================================================`);
    
    thread.forEach((e, idx) => {
      const time = new Date(e.timestamp).toLocaleTimeString();
      console.log(`[${idx + 1}] ${time} | ${e.name.padEnd(20)} | Event: ${e.eventId} | Parent: ${e.causationId}`);
      if (e.name === 'fsm.transition') {
         console.log(`    └─ FSM transition: ${e.payload.from} ➔ ${e.payload.to} (chatId: ${e.payload.chatId})`);
      } else if (e.name === 'message.received') {
         console.log(`    └─ Inbound Text: "${e.payload.text}" (senderId: ${e.payload.senderId})`);
      } else if (e.name === 'message.sent') {
         console.log(`    └─ Outbound Text: "${e.payload.text}"`);
      } else if (e.name === 'api_usage') {
         console.log(`    └─ API latency: ${e.payload.latencyMs}ms | Tokens: in ${e.payload.inputTokens} / out ${e.payload.outputTokens} | ${e.payload.status}`);
      }
    });
    console.log(`========================================================================\n`);
  }
}
