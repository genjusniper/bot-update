// src/cli/replay.mjs
import { ReplayDebugger } from '../observability/ReplayDebugger.mjs';

const args = process.argv.slice(2);
const mode = args[0];
const id = args[1];

if (!mode || !id || (mode !== '--event' && mode !== '--correlation')) {
  console.log(`\n==========================================`);
  console.log(`⏪ DETERMINISTIC EVENT BUS REPLAY CLI`);
  console.log(`==========================================`);
  console.log(`Usage:`);
  console.log(`  node src/cli/replay.mjs --event <eventId>`);
  console.log(`  node src/cli/replay.mjs --correlation <correlationId>`);
  console.log(`==========================================\n`);
  process.exit(1);
}

if (mode === '--event') {
  ReplayDebugger.replayEvent(id);
} else if (mode === '--correlation') {
  ReplayDebugger.replayCorrelation(id);
}
