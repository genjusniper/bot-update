// index_v5.mjs
// V5.8 — Lightweight Bootloader for Decoupled Services
import dotenv from 'dotenv';
dotenv.config();

import { JobQueue } from './src/queue/JobQueue.mjs';
import { QueueWorker } from './src/queue/QueueWorker.mjs';
import { createAIGateway } from './src/ai/index.mjs';
import { WhatsAppGateway } from './src/gateway/WhatsAppGateway.mjs';
import { Orchestrator } from './src/orchestrator/Orchestrator.mjs';

let isShuttingDown = false;
let waGateway = null;
let orchestrator = null;

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n🚨 [Bootloader] Received ${signal}. Draining services...`);
  
  if (orchestrator) orchestrator.shutdown();
  
  const gracePeriodMs = 12000;
  const start = Date.now();
  
  console.log(`⏳ [Bootloader] Waiting up to ${gracePeriodMs/1000}s for in-flight jobs...`);
  while (QueueWorker.getActiveCount() > 0 && (Date.now() - start < gracePeriodMs)) {
    await new Promise(r => setTimeout(r, 500));
  }
  
  const remaining = QueueWorker.getActiveCount();
  if (remaining > 0) {
    console.log(`⚠️ [Bootloader] Grace period ended. ${remaining} jobs left in-flight.`);
  } else {
    console.log(`✅ [Bootloader] All jobs finished safely.`);
  }

  if (waGateway) {
    console.log(`🔌 [Bootloader] Closing WhatsApp connection...`);
    waGateway.shutdown();
  }
  
  console.log(`🛑 [Bootloader] Process stopped cleanly.`);
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

async function boot() {
  console.log('🚀 Booting WA Bot V5 STAGING (Decoupled Orchestrator)...');
  
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
     console.error('❌ GEMINI_API_KEY tidak ditemukan di environment.');
  }

  // Initialize DB queue
  JobQueue.init();
  
  // Create Gateway and Orchestrator
  const aiGateway = createAIGateway(geminiKey);
  waGateway = new WhatsAppGateway('auth-v5-test');
  orchestrator = new Orchestrator(aiGateway, waGateway);

  // Start Gateway
  await waGateway.connect();
  
  // Start Orchestrator
  orchestrator.start();
}

boot().catch(console.error);

process.on('uncaughtException', err => {
  console.error('🚨 uncaughtException:', err);
  if (!isShuttingDown) gracefulShutdown('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', err => {
  console.error('🚨 unhandledRejection:', err);
});
