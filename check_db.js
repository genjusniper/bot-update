
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
try {
  const db = new DatabaseSync(path.join(process.cwd(), 'memory', 'queue_v5_test.sqlite'));
  const jobs = db.prepare('SELECT id, status, attempts, lastError, createdAt FROM jobs ORDER BY id DESC LIMIT 15').all();
  console.log('--- RECENT 15 JOBS ---');
  console.table(jobs);
} catch (e) {
  console.log('DB Check Error:', e.message);
}
