
const { DatabaseSync } = require('node:sqlite');
try {
  const db = new DatabaseSync('/data/data/com.termux/files/home/wa-bot-v10/memory/queue_v5_test.sqlite');
  const jobs = db.prepare('SELECT id, status, attempts, lastError FROM jobs').all();
  console.log('JOBS:', JSON.stringify(jobs, null, 2));
} catch(e) { console.log('DB ERROR:', e.message); }
