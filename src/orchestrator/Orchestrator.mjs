// src/orchestrator/Orchestrator.mjs
import { JobQueue } from '../queue/JobQueue.mjs';
import { QueueWorker } from '../queue/QueueWorker.mjs';
import { ConversationFSM, FSMEventBus } from '../conversation/ConversationFSM.mjs';
import { AgentV2 } from '../agent/AgentV2.mjs';
import { EventBus } from '../event/EventBus.mjs';
import { IncidentRecorder } from '../observability/IncidentRecorder.mjs';
import { MemoryManager } from '../memory/MemoryManager.mjs';

export class Orchestrator {
  constructor(aiGateway, waGateway) {
    this.aiGateway = aiGateway;
    this.waGateway = waGateway;
    this.isShuttingDown = false;
  }

  start() {
    console.log('🏁 [Orchestrator] Starting processing queues...');
    
    // Subscribe to incoming messages from EventBus
    EventBus.subscribe('whatsapp.message.received', (event) => {
      const { unifiedMsg, rawKey, rawMessage, correlationId, eventId } = event.payload;
      
      // Enqueue to JobQueue
      JobQueue.enqueue(eventId, correlationId, unifiedMsg.chatId, {
        unifiedMsg,
        rawKey,
        rawMessage
      });
      
      if (!this.isShuttingDown) {
        FSMEventBus.emit('message.queued');
      }
    });

    // Start QueueWorker
    QueueWorker.start(async (job) => {
      const processStart = Date.now();
      const { chatId, payload, claimToken } = job;
      const { unifiedMsg, rawKey } = payload;
      
      const fsmCtx = { correlationId: job.correlationId, eventId: job.eventId };
      ConversationFSM.transition(chatId, 'RECEIVING', fsmCtx);
      ConversationFSM.transition(chatId, 'AGGREGATING', fsmCtx);
      
      // BURST AGGREGATION
      const extraJobs = JobQueue.claimPending(chatId, claimToken);
      let combinedText = unifiedMsg.text;
      if (extraJobs.length > 0) {
          console.log(`[Orchestrator] 📦 Pulled ${extraJobs.length} pending messages for ${chatId}`);
          for (const ex of extraJobs) {
              combinedText += '\n' + ex.payload.unifiedMsg.text;
          }
          unifiedMsg.text = combinedText;
          const lastEx = extraJobs[extraJobs.length - 1];
          payload.rawKey = lastEx.payload.rawKey;
          payload.rawMessage = lastEx.payload.rawMessage;
          fsmCtx.generationId = lastEx.eventId;
      } else {
          fsmCtx.generationId = job.eventId;
      }
      
      // Emit message.received event to the EventBus
      EventBus.publish('message.received', {
         chatId,
         senderId: unifiedMsg.senderId,
         text: combinedText,
         type: unifiedMsg.type
      }, job.correlationId, job.eventId);

      ConversationFSM.transition(chatId, 'THINKING', fsmCtx);
      
      const memoryManager = new MemoryManager(this.aiGateway);
      const memory = await memoryManager.loadMemory(chatId);
      const masterAgent = new AgentV2(this.aiGateway); 
      
      try {
        const agentResult = await masterAgent.processMessage(chatId, combinedText, memory, unifiedMsg);
        
        const currentState = ConversationFSM.getState(chatId);
        if (currentState.generationId !== job.eventId) {
           console.log(`[Orchestrator] ⚠️ Stale Generation Dropped for ${chatId}`);
           return; 
        }
        
        if (agentResult.action === 'reply' && agentResult.chunks && agentResult.chunks.length > 0 && agentResult.chunks[0] !== 'error euy') {
          ConversationFSM.transition(chatId, 'RESPONDING', fsmCtx);
          for (const bubble of agentResult.chunks) {
            if (this.isShuttingDown) break; 
            await this.waGateway.sendPresenceUpdate('composing', chatId);
            await new Promise(r => setTimeout(r, 1000));
            
            const sendOptions = agentResult.should_quote ? { quoted: { key: rawKey, message: payload.rawMessage } } : {};
            await this.waGateway.sendMessage(chatId, bubble, sendOptions);
            
            EventBus.publish('message.sent', {
              chatId,
              text: bubble
            }, job.correlationId, job.eventId);
          }
          
          // V6.2 Memory OS: Record Conversation and Extract Memory
          await memoryManager.recordConversation(chatId, combinedText, agentResult.chunks.join(' | '));
          setImmediate(async () => {
            try {
              await memoryManager.extractMemory(chatId, combinedText);
              await memoryManager.runSafetySweep(chatId);
            } catch(e) {
              console.error('[Orchestrator] Async Memory processing failed:', e.message);
            }
          });
        } else {
          console.warn(`[Orchestrator] ⚠️ No valid response generated. Triggering RECOVERY.`);
          ConversationFSM.recover(chatId, "Empty or invalid response from Agent");
        }
      } catch(err) {
        console.error(`[Orchestrator] Agent Error on job ${job.id}:`, err);
        IncidentRecorder.record({
          correlationId: job.correlationId,
          eventId: job.eventId,
          errorClass: err.name || 'Error',
          errorMessage: err.message,
          fsmState: ConversationFSM.getState(chatId)?.state || 'UNKNOWN',
          retryCount: job.retryCount || 0
        });
        
        const latencyMs = Date.now() - processStart;
        EventBus.publish('job_processing', {
          chatId,
          latencyMs,
          queueDepth: 0,
          status: 'FAILED',
          error: err.message
        }, job.correlationId, job.eventId);

        if (extraJobs && extraJobs.length > 0) {
          for (const ex of extraJobs) JobQueue.fail(ex.id, claimToken, err.message);
        }
        ConversationFSM.recover(chatId, err.message);
        throw err;
      }
      
      const completed = JobQueue.complete(job.id, claimToken);
      if (extraJobs && extraJobs.length > 0) {
        for (const ex of extraJobs) JobQueue.complete(ex.id, claimToken);
      }
      if (completed) {
        try { if (ConversationFSM.getState(chatId) !== 'IDLE') ConversationFSM.transition(chatId, 'IDLE', fsmCtx); } catch(e){}
        
        const latencyMs = Date.now() - processStart;
        let queueDepth = 0;
        try {
          const row = JobQueue.db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'QUEUED'").get();
          queueDepth = row ? row.count : 0;
        } catch(e) {}
        
        EventBus.publish('job_processing', {
          chatId,
          latencyMs,
          queueDepth,
          status: 'SUCCESS'
        }, job.correlationId, job.eventId);
      }
    });
  }

  shutdown() {
    this.isShuttingDown = true;
    QueueWorker.stop();
  }
}