// src/cli/cockpit.mjs
// V7.5 — Human Authority Console (The Cockpit)
import { ProposalEngine } from '../agent/ProposalEngine.mjs';
import { TaskGraphEngine } from '../agent/TaskGraphEngine.mjs';
import { JobQueue } from '../queue/JobQueue.mjs';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const command = args[0];
const param = args[1];

if (!command || (command !== '--status' && command !== '--approve' && command !== '--reject' && command !== '--reset-queue')) {
  console.log(`\n========================================================================`);
  console.log(`🎛️  HUMAN AUTHORITY CONSOLE (THE COCKPIT)`);
  console.log(`========================================================================`);
  console.log(`Usage:`);
  console.log(`  node src/cli/cockpit.mjs --status             - View system status dashboard`);
  console.log(`  node src/cli/cockpit.mjs --approve <propId>   - Force approve a pending proposal`);
  console.log(`  node src/cli/cockpit.mjs --reject <propId>    - Force reject a pending proposal`);
  console.log(`  node src/cli/cockpit.mjs --reset-queue        - Force clear SQLite queue leases`);
  console.log(`========================================================================\n`);
  process.exit(1);
}

// Ensure database initialization
try { JobQueue.init(); } catch(e){}

if (command === '--status') {
  console.log(`\n========================================================================`);
  console.log(`🛸 WA-BOT CONTROL CENTER STATUS DASHBOARD`);
  console.log(`========================================================================`);

  // 1. Queue Status
  try {
    const row = JobQueue.db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'QUEUED'").get();
    const active = JobQueue.db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'PROCESSING'").get();
    console.log(`📥 SQLite Job Queue:`);
    console.log(`   ├─ Pending Jobs:  ${row ? row.count : 0}`);
    console.log(`   └─ Active Leases: ${active ? active.count : 0}`);
  } catch(e) {
    console.log('❌ Failed to fetch Job Queue status.');
  }

  // 2. Pending Proposals
  console.log(`\n💡 Outstanding Proposals (Human-in-the-Loop): `);
  const proposals = ProposalEngine._loadProposals();
  const pending = proposals.filter(p => p.status === 'PENDING');
  if (pending.length === 0) {
    console.log('   └─ No pending proposals.');
  } else {
    pending.forEach(p => {
      console.log(`   ├─ [${p.proposalId}] Chat: ${p.chatId} | Tool: ${p.tool} | Args: ${p.args}`);
    });
  }

  // 3. FSM Recent Audit (Last 5 transitions)
  console.log(`\n🔄 Recent FSM Transitions:`);
  const auditFile = path.join(process.cwd(), 'memory', 'fsm_audit.jsonl');
  if (fs.existsSync(auditFile)) {
    const lines = fs.readFileSync(auditFile, 'utf8').split('\n').filter(Boolean).slice(-5);
    lines.forEach(line => {
      const entry = JSON.parse(line);
      console.log(`   ├─ ${new Date(entry.timestamp).toLocaleTimeString()} | Chat: ${entry.chatId.padEnd(20)} | ${entry.from} ➔ ${entry.to}`);
    });
  } else {
     console.log('   └─ No FSM transitions logged yet.');
  }

  // 4. API Latency and Usage (Last 5 events)
  console.log(`\n📊 Recent API Telemetry (metrics.jsonl):`);
  const metricsFile = path.join(process.cwd(), 'memory', 'metrics.jsonl');
  if (fs.existsSync(metricsFile)) {
     const lines = fs.readFileSync(metricsFile, 'utf8').split('\n').filter(Boolean).slice(-5);
     lines.forEach(line => {
       const entry = JSON.parse(line);
       if (entry.type === 'api_usage') {
         console.log(`   ├─ ${entry.provider.padEnd(10)} | Latency: ${entry.latencyMs}ms | Tokens: in ${entry.inputTokens} / out ${entry.outputTokens} | ${entry.status}`);
       } else if (entry.type === 'job_processing') {
         console.log(`   ├─ Job Process | Latency: ${entry.latencyMs}ms | Status: ${entry.status}`);
       }
     });
  } else {
     console.log('   └─ No metrics logged yet.');
  }
  console.log(`========================================================================\n`);
}

if (command === '--approve') {
  if (!param) {
    console.error('❌ Error: Proposal ID required.');
    process.exit(1);
  }
  const ok = ProposalEngine.updateStatus(param, 'APPROVED');
  if (ok) {
     console.log(`✅ Proposal ${param} approved successfully.`);
  } else {
     console.error(`❌ Proposal ${param} not found.`);
  }
}

if (command === '--reject') {
  if (!param) {
    console.error('❌ Error: Proposal ID required.');
    process.exit(1);
  }
  const ok = ProposalEngine.updateStatus(param, 'REJECTED');
  if (ok) {
     console.log(`❌ Proposal ${param} rejected.`);
  } else {
     console.error(`❌ Proposal ${param} not found.`);
  }
}

if (command === '--reset-queue') {
  try {
     JobQueue.db.prepare("UPDATE jobs SET status = 'QUEUED', lease_token = NULL, lease_expires_at = 0 WHERE status = 'PROCESSING'").run();
     console.log('✅ SQLite job leases reset. Pending jobs returned to QUEUED state.');
  } catch(e) {
     console.error('❌ Failed to reset queue:', e.message);
  }
}
