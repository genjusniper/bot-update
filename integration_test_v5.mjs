import { JobQueue } from './src/queue/JobQueue.mjs';

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runIntegrationTests() {
  console.log('🧪 MENJALANKAN V5 INTEGRATION TESTS (REAL SQLITE)...\n');
  JobQueue.init();

  const results = [];
  const logTest = (name, pass) => {
    results.push(`[TEST] ${name.padEnd(30, ' ')} ${pass ? '✅ PASS' : '❌ FAIL'}`);
  };

  // TEST A: Restart Recovery
  JobQueue.enqueue('evt_test_a', 'corr_a', 'chat_a', { data: 1 });
  const jobA = JobQueue.claim(2000); 
  let passedA = (jobA !== null);
  
  await wait(2200); 
  JobQueue.sweepStaleJobs();
  
  const jobA_recovered = JobQueue.claim(2000);
  passedA = passedA && (jobA_recovered && jobA_recovered.id === jobA.id && jobA_recovered.attempts === 1);
  logTest('Restart Recovery', passedA);
  
  if (jobA_recovered) JobQueue.complete(jobA_recovered.id, jobA_recovered.claimToken);

  // TEST B: Stale Lease & DLQ
  JobQueue.enqueue('evt_test_b', 'corr_b', 'chat_b', { data: 2 });
  
  const jobB1 = JobQueue.claim(100);
  await wait(150);
  JobQueue.sweepStaleJobs();
  
  const jobB2 = JobQueue.claim(100);
  await wait(150);
  JobQueue.sweepStaleJobs();
  
  const jobB3 = JobQueue.claim(100);
  await wait(150);
  JobQueue.sweepStaleJobs(); 
  
  const dlqJob = JobQueue.db.prepare("SELECT * FROM jobs WHERE eventId = 'evt_test_b'").get();
  logTest('DLQ Transition (Max Retry)', dlqJob && dlqJob.status === 'DEAD_LETTER');

  // TEST C: Zombie Worker Protection
  JobQueue.enqueue('evt_test_z', 'corr_z', 'chat_z', { data: 3 });
  
  const jobZ_A = JobQueue.claim(100); 
  await wait(150);
  JobQueue.sweepStaleJobs(); 
  
  const jobZ_B = JobQueue.claim(5000);
  
  const completeSuccess = JobQueue.complete(jobZ_A.id, jobZ_A.claimToken);
  logTest('Zombie Worker Rejection', completeSuccess === false);
  
  const completeB = JobQueue.complete(jobZ_B.id, jobZ_B.claimToken);
  logTest('Valid Worker Success', completeB === true);

  // TEST D: Heartbeat (Lease Extension)
  JobQueue.enqueue('evt_test_hb', 'corr_hb', 'chat_hb', { data: 4 });
  const jobHB = JobQueue.claim(500); 
  
  await wait(200);
  const hbSuccess = JobQueue.extendLease(jobHB.id, jobHB.claimToken, 1000); 
  
  await wait(500); 
  JobQueue.sweepStaleJobs();
  
  const hbJobCurrent = JobQueue.db.prepare("SELECT status FROM jobs WHERE id = ?").get(jobHB.id);
  logTest('Heartbeat Lease Extension', hbSuccess && hbJobCurrent.status === 'PROCESSING');
  
  JobQueue.complete(jobHB.id, jobHB.claimToken);

  console.log(results.join('\n'));
}

runIntegrationTests().catch(console.error);