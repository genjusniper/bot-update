import fs from 'fs';
import path from 'path';

export class LeadStorage {
    constructor(dbPath = './scratch/data/queues/leads.json') {
        this.dbPath = path.resolve(dbPath);
        this._ensureDbExists();
    }

    _ensureDbExists() {
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (!fs.existsSync(this.dbPath)) fs.writeFileSync(this.dbPath, JSON.stringify({}, null, 2));
    }

    _read() {
        return JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
    }

    _write(data) {
        fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
    }

    saveLead(leadData) {
        const db = this._read();
        db[leadData.id] = {
            ...leadData,
            updatedAt: Date.now()
        };
        this._write(db);
        return true;
    }

    getLead(leadId) {
        const db = this._read();
        return db[leadId] || null;
    }

    getAllPending() {
        const db = this._read();
        return Object.values(db).filter(l => l.status === 'PENDING_APPROVAL');
    }
}
