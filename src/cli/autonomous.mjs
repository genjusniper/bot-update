// src/cli/autonomous.mjs
// V7 — Persistent Autonomous Task Runner CLI
import { TaskGraphEngine } from '../agent/TaskGraphEngine.mjs';
import { createAIGateway } from '../ai/index.mjs';
import dotenv from 'dotenv';
import { exec } from 'child_process';
dotenv.config();

const args = process.argv.slice(2);
const action = args[0]; // 'create' | 'run' | 'status'
const goalId = args[1] || 'default_goal';

if (!action || (action !== 'create' && action !== 'run' && action !== 'status')) {
  console.log(`\n==========================================`);
  console.log(`🚀 AUTONOMOUS TASK RUNNER (V7 DEVOPS)`);
  console.log(`==========================================`);
  console.log(`Usage:`);
  console.log(`  node src/cli/autonomous.mjs create <goalId>`);
  console.log(`  node src/cli/autonomous.mjs run <goalId>`);
  console.log(`  node src/cli/autonomous.mjs status <goalId>`);
  console.log(`==========================================\n`);
  process.exit(1);
}

TaskGraphEngine.init();

if (action === 'create') {
  // Define a sample devops graph
  const tasksList = [
    { id: 't_01', title: 'Verify health of current gateway keys', dependencies: [] },
    { id: 't_02', title: 'Run offline regression scorecard tests', dependencies: ['t_01'] },
    { id: 't_03', title: 'Log success scorecard metrics into database', dependencies: ['t_02'] }
  ];
  TaskGraphEngine.createGraph(goalId, tasksList);
  console.log(`✅ Created persistent task graph for goal "${goalId}"`);
}

if (action === 'status') {
  const status = TaskGraphEngine.getGraphStatus(goalId);
  console.log(`\n==========================================`);
  console.log(`📊 TASK GRAPH STATUS: ${goalId}`);
  console.log(`==========================================`);
  console.log(`Completion: ${status.percent}% (${status.completed}/${status.total} tasks completed)`);
  console.log(`Nodes:`);
  status.tasks.forEach(t => {
     console.log(`  - [${t.status.padEnd(11)}] ${t.id}: ${t.title} (Deps: ${t.dependencies.join(', ') || 'None'})`);
  });
  console.log(`==========================================\n`);
}

if (action === 'run') {
  console.log(`🤖 Starting Autonomous Task Execution for goal "${goalId}"...`);
  
  const executeNext = async () => {
    const task = TaskGraphEngine.getNextTask(goalId);
    if (!task) {
      const status = TaskGraphEngine.getGraphStatus(goalId);
      if (status.percent === 100) {
        console.log('🎉 Goal completed successfully!');
      } else {
        console.log('⏸️ No executable tasks found (blocked by failures or waiting).');
      }
      return;
    }
    
    console.log(`\n⚡ Executing Task ${task.id}: "${task.title}"`);
    TaskGraphEngine.updateTaskStatus(task.id, 'IN_PROGRESS');
    
    // Simulate/Execute the Task using DevOps Shell commands or AI helper
    let cmd = 'node src/eval/EvalEngine.mjs';
    if (task.id === 't_01') cmd = 'echo "Gateway verified."';
    if (task.id === 't_03') cmd = 'echo "Metrics logging completed."';

    exec(cmd, (err, stdout, stderr) => {
      const success = !err;
      const result = stdout || stderr || err?.message;
      console.log(result.trim());
      
      if (success) {
        TaskGraphEngine.updateTaskStatus(task.id, 'COMPLETED', result);
        executeNext(); // Run next node in the DAG
      } else {
        TaskGraphEngine.updateTaskStatus(task.id, 'FAILED', result);
        console.error(`❌ Task ${task.id} failed. Halting graph.`);
      }
    });
  };
  
  executeNext();
}
