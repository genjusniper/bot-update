// src/sales/OutboundQueueManager.mjs

import fs from 'fs/promises';
import path from 'path';

export class OutboundQueueManager {
    static getQueueFilePath() {
        return path.join(process.cwd(), 'data', 'queues', 'outbound.json');
    }

    static async _ensureDir() {
        const dir = path.dirname(this.getQueueFilePath());
        await fs.mkdir(dir, { recursive: true });
    }

    static async _loadQueue() {
        await this._ensureDir();
        try {
            const raw = await fs.readFile(this.getQueueFilePath(), 'utf8');
            return JSON.parse(raw);
        } catch (e) {
            return {}; // Format: { "campaign_id:phone": { jobData } }
        }
    }

    static async _saveQueue(queueData) {
        await this._ensureDir();
        await fs.writeFile(this.getQueueFilePath(), JSON.stringify(queueData, null, 2));
    }

    /**
     * Enqueue a new message job.
     * Enforces Idempotency using `campaignId:phone`.
     */
    static async enqueue(campaignId, phone, metadata = {}) {
        const queue = await this._loadQueue();
        const idempotencyKey = `${campaignId}:${phone}`;

        if (queue[idempotencyKey]) {
            console.log(`[Queue] ⚠️ Job ${idempotencyKey} sudah ada di antrian. (Idempotent Skip)`);
            return queue[idempotencyKey]; // Kembalikan job lama, jangan duplikasi
        }

        const newJob = {
            idempotency_key: idempotencyKey,
            campaign_id: campaignId,
            phone: phone,
            state: 'PENDING',
            score: metadata.score || 0,
            reason: metadata.reason || 'Unknown',
            draft_message: metadata.draft_message || null,
            attempt_count: 0,
            created_at: Date.now(),
            updated_at: Date.now(),
            history: [{ state: 'PENDING', timestamp: Date.now() }]
        };

        queue[idempotencyKey] = newJob;
        await this._saveQueue(queue);
        console.log(`[Queue] ✅ Job ${idempotencyKey} berhasil masuk antrian (PENDING).`);
        return newJob;
    }

    /**
     * Ambil job berikutnya yang PENDING atau RETRY.
     * Mengubah state menjadi CLAIMED (Locking).
     */
    static _isClaiming = false; // Mutex untuk mencegah Race Condition

    /**
     * WORKER: Mengambil 1 job dari antrian (FIFO) yang PENDING/RETRY
     * Menerapkan Mutex untuk mencegah Double-Claim jika ada concurrent call
     */
    static async claimNext(campaignId = null) {
        if (this._isClaiming) return null; // Jika sedang ada yang klaim, return null
        this._isClaiming = true;
        
        try {
            const queue = await this._loadQueue();
            let targetJobKey = null;

            // Cari PENDING atau RETRY dengan skor tertinggi (Priority)
            const eligibleJobs = Object.values(queue)
                .filter(j => (!campaignId || j.campaign_id === campaignId) && (j.state === 'PENDING' || j.state === 'RETRY'))
                .sort((a, b) => b.score - a.score);

            if (eligibleJobs.length > 0) {
                targetJobKey = eligibleJobs[0].idempotency_key;
            }

            if (!targetJobKey) return null;

            // Locking (State = CLAIMED)
            queue[targetJobKey].state = 'CLAIMED';
            queue[targetJobKey].updated_at = Date.now();
            queue[targetJobKey].attempt_count = (queue[targetJobKey].attempt_count || 0) + 1;
            queue[targetJobKey].history.push({ state: 'CLAIMED', timestamp: Date.now() });

            await this._saveQueue(queue);
            return queue[targetJobKey];
        } finally {
            this._isClaiming = false; // Lepaskan Mutex
        }
    }

    /**
     * Update state pekerjaan (SENDING, SENT, FAILED, dll)
     */
    static async updateState(idempotencyKey, newState, extraMeta = {}) {
        const queue = await this._loadQueue();
        if (!queue[idempotencyKey]) return false;

        const job = queue[idempotencyKey];
        job.state = newState;
        job.updated_at = Date.now();
        if (newState === 'SENDING') job.attempt_count += 1;
        
        job.history.push({ state: newState, timestamp: Date.now(), ...extraMeta });

        await this._saveQueue(queue);
        return job;
    }

    /**
     * PHASE B: Crash Recovery
     * Dijalankan saat bot baru menyala untuk mendeteksi job yang menggantung (stuck).
     */
    static async recoverCrash() {
        const queue = await this._loadQueue();
        let modified = false;

        for (const [key, job] of Object.entries(queue)) {
            if (job.state === 'CLAIMED') {
                // Crash sebelum sempat mulai mengirim -> Aman untuk di-retry
                job.state = 'PENDING';
                job.history.push({ state: 'PENDING_RECOVERED', timestamp: Date.now() });
                modified = true;
                console.log(`[QueueRecovery] ♻️ Job ${key} dikembalikan dari CLAIMED ke PENDING (Aman).`);
            } else if (job.state === 'SENDING') {
                // FATAL: Crash saat pengiriman sedang berlangsung.
                // Kita TIDAK TAHU apakah Baileys berhasil mengirimkannya atau tidak sebelum crash.
                // Mencegah RETRY BUTA yang mengakibatkan SPAM ganda.
                job.state = 'AMBIGUOUS_CRASH';
                job.history.push({ state: 'AMBIGUOUS_CRASH', timestamp: Date.now() });
                modified = true;
                console.log(`[QueueRecovery] ⚠️ Job ${key} diubah ke AMBIGUOUS_CRASH. Membutuhkan rekonsiliasi manual!`);
            }
        }

        if (modified) await this._saveQueue(queue);
        else console.log('[QueueRecovery] ✅ Tidak ada job yang nyangkut. Clean state.');
    }
}
