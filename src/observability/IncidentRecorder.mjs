import fs from 'fs';
import path from 'path';

export class IncidentRecorder {
  static logFile = path.join(process.cwd(), 'memory', 'incidents.jsonl');

  static record(incident) {
    try {
      const entry = {
        incidentId: 'inc_' + Date.now() + '_' + Math.floor(Math.random()*1000),
        timestamp: Date.now(),
        ...incident
      };
      
      // Sanitasi: Jangan log isi prompt, base64, atau token
      if (entry.payload) delete entry.payload.base64;
      if (entry.payload) delete entry.payload.inlineData;
      
      fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n');
      console.log(`[IncidentRecorder] 🚨 Incident ${entry.incidentId} logged (${entry.errorClass})`);
    } catch(e) {
      console.error('[IncidentRecorder] Failed to record incident:', e);
    }
  }
}
