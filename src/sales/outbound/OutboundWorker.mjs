import fs from 'fs';
import path from 'path';

export class OutboundWorker {
    constructor(queuePath = './data/queues/outbound.json', workerId = 'worker-1') {
        this.queuePath = queuePath;
        this.workerId = workerId;
        this.killSwitch = false;
        
        const dir = path.dirname(this.queuePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    setKillSwitch(state) {
        this.killSwitch = state;
    }

    // Leases a job safely
    claimJob(jobId) {
        if (!fs.existsSync(this.queuePath)) return null;
        
        let queue = JSON.parse(fs.readFileSync(this.queuePath, 'utf-8'));
        const jobIndex = queue.findIndex(q => q.id === jobId);
        
        if (jobIndex === -1) return null; // Not found
        
        const job = queue[jobIndex];
        
        // Prevent race condition: if already claimed by someone else or is AMBIGUOUS
        if (job.status === 'CLAIMED' && job.claimedBy !== this.workerId) return null;
        if (job.status === 'AMBIGUOUS') return null; // Needs manual intervention
        
        job.status = 'CLAIMED';
        job.claimedBy = this.workerId;
        job.claimedAt = new Date().toISOString();
        
        fs.writeFileSync(this.queuePath, JSON.stringify(queue, null, 2));
        return job;
    }

    // Identifies crashes
    detectAmbiguousJobs() {
        if (!fs.existsSync(this.queuePath)) return [];
        let queue = JSON.parse(fs.readFileSync(this.queuePath, 'utf-8'));
        let modified = false;
        
        queue = queue.map(job => {
            // If it's been claimed for a long time (or we just restarted), it's ambiguous
            if (job.status === 'CLAIMED') {
                job.status = 'AMBIGUOUS';
                modified = true;
            }
            return job;
        });
        
        if (modified) {
            fs.writeFileSync(this.queuePath, JSON.stringify(queue, null, 2));
        }
        return queue.filter(q => q.status === 'AMBIGUOUS');
    }

    async processJob(jobId) {
        const job = this.claimJob(jobId);
        if (!job) throw new Error("Job unavailable or claimed by another worker");

        if (this.killSwitch) {
            throw new Error("KILL_SWITCH_ACTIVE: Outbound blocked.");
        }

        // Simulate external send
        // If crash happens here, status remains CLAIMED. On next boot, detectAmbiguousJobs turns it AMBIGUOUS.
        
        // Mark as sent
        let queue = JSON.parse(fs.readFileSync(this.queuePath, 'utf-8'));
        queue = queue.filter(q => q.id !== jobId);
        fs.writeFileSync(this.queuePath, JSON.stringify(queue, null, 2));
        
        return { success: true, jobId };
    }
}
