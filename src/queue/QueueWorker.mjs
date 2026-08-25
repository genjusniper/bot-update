// src/queue/QueueWorker.mjs — RESILIENT AUTONOMOUS QUEUE WORKER
import { JobQueue } from './JobQueue.mjs';
import { ConversationFSM, FSMEventBus } from '../conversation/ConversationFSM.mjs';

export class QueueWorker {
  static active = false;
  static acceptJobs = true;
  static activeCount = 0;
  static activeJobs = new Map();
  static heartbeatTimer = null;
  static messageProcessor = null;

  static start(messageProcessor) {
    this.messageProcessor = messageProcessor;
    this.acceptJobs = true;
    
    // Drain immediately on boot
    this.wakeUp();

    if (!this.heartbeatTimer) {
      this.heartbeatTimer = setInterval(() => {
        JobQueue.sweepStaleJobs();
        const now = Date.now();
        for (const [jobId, claimToken] of this.activeJobs.entries()) {
           JobQueue.extendLease(jobId, claimToken, 90000);
        }
        // Periodic autonomous wake-up ensures zero dropped jobs
        this.wakeUp();
      }, 5000); // Check every 5 seconds!
    }
  }

  static stop() {
    this.acceptJobs = false;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    console.log('[QueueWorker] 🛑 Draining mode: Stopped accepting new jobs.');
  }

  static getActiveCount() {
    return this.activeCount;
  }

  static async wakeUp() {
    if (this.active || !this.acceptJobs) return;
    this.active = true;
    
    try {
      while (this.acceptJobs) {
        const job = JobQueue.claim(90000);
        if (!job) break;
        
        this.activeCount++;
        this.activeJobs.set(job.id, job.claimToken);
        
        // Execute synchronously or handle per-job
        await this.processJob(job).finally(() => {
          this.activeCount--;
          this.activeJobs.delete(job.id);
        });
      }
    } catch(e) {
      console.error('[QueueWorker] Error in worker loop:', e);
    } finally {
      this.active = false;
    }
  }

  static async processJob(job) {
    try {
      if (this.messageProcessor) {
        await this.messageProcessor(job);
      }
    } catch (e) {
      console.error(`[Worker] Job ${job.id} failed:`, e);
      JobQueue.fail(job.id, job.claimToken, e.message);
      
      const state = ConversationFSM.getState(job.chatId);
      if (state.current !== 'IDLE') state.current = 'IDLE'; 
    }
  }
}

FSMEventBus.on('message.queued', () => QueueWorker.wakeUp());
FSMEventBus.on('state.idle', () => QueueWorker.wakeUp());
