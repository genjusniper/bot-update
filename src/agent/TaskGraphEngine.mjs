// src/agent/TaskGraphEngine.mjs
// V7 — Task Graph Persistence using native Node.js node:sqlite
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'memory', 'task_graph.db');
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

class TaskGraphManager {
  constructor() {
    this.db = null;
  }

  init() {
    if (this.db) return;
    this.db = new DatabaseSync(DB_PATH);
    
    // Create tasks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        goalId TEXT,
        title TEXT,
        status TEXT,
        dependencies TEXT,
        result TEXT,
        updatedAt INTEGER
      )
    `);
    console.log('📊 [TaskGraphEngine] Native node:sqlite Task Graph database initialized.');
  }

  createGraph(goalId, tasksList) {
    this.init();
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO tasks (id, goalId, title, status, dependencies, result, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    try {
      this.db.exec('BEGIN TRANSACTION');
      for (const t of tasksList) {
        const deps = JSON.stringify(t.dependencies || []);
        insert.run(t.id, goalId, t.title, 'PENDING', deps, '', Date.now());
      }
      this.db.exec('COMMIT');
      console.log(`📊 [TaskGraphEngine] Created Task Graph for Goal: ${goalId} with ${tasksList.length} nodes.`);
    } catch(e) {
      this.db.exec('ROLLBACK');
      console.error('❌ [TaskGraphEngine] Transaction failed:', e.message);
      throw e;
    }
  }

  getNextTask(goalId) {
    this.init();
    // 1. Get all tasks for this goal
    const tasks = this.db.prepare("SELECT * FROM tasks WHERE goalId = ?").all(goalId);
    if (tasks.length === 0) return null;

    // 2. Find pending tasks
    const pendingTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
    if (pendingTasks.length === 0) return null;

    // 3. Find the first task whose dependencies are all COMPLETED
    const completedIds = new Set(tasks.filter(t => t.status === 'COMPLETED').map(t => t.id));

    for (const t of pendingTasks) {
      const deps = JSON.parse(t.dependencies || '[]');
      const allDepsMet = deps.every(depId => completedIds.has(depId));
      if (allDepsMet) {
        return t;
      }
    }
    return null; // A waiting state or circular dependency
  }

  updateTaskStatus(id, status, result = '') {
    this.init();
    this.db.prepare(`
      UPDATE tasks 
      SET status = ?, result = ?, updatedAt = ?
      WHERE id = ?
    `).run(status, result, Date.now(), id);
    console.log(`📊 [TaskGraphEngine] Task ${id} updated to ${status}`);
  }

  getGraphStatus(goalId) {
    this.init();
    const tasks = this.db.prepare("SELECT * FROM tasks WHERE goalId = ?").all(goalId);
    if (tasks.length === 0) return { percent: 0, total: 0, completed: 0 };
    
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const total = tasks.length;
    const percent = Math.round((completed / total) * 100);
    
    return {
      goalId,
      percent,
      total,
      completed,
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        dependencies: JSON.parse(t.dependencies || '[]')
      }))
    };
  }
}

export const TaskGraphEngine = new TaskGraphManager();
