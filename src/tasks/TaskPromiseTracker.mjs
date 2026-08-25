// src/tasks/TaskPromiseTracker.mjs
// Conversational Task & Promise Extraction and Retrieval Engine

import fs from 'fs/promises';
import path from 'path';

export class TaskPromiseTracker {
    static getTaskFilePath(chatId) {
        const cleanId = chatId.replace(/[^a-zA-Z0-9_-]/g, '_');
        return path.resolve(process.cwd(), 'memory', `${cleanId}_tasks.json`);
    }

    static async loadTasks(chatId) {
        const filePath = this.getTaskFilePath(chatId);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    static async saveTasks(chatId, tasks) {
        const filePath = this.getTaskFilePath(chatId);
        try {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(tasks, null, 2), 'utf8');
        } catch (e) {
            console.error('[TaskPromiseTracker] ⚠️ Error saving tasks:', e.message);
        }
    }

    static detectAndExtractTask(message) {
        const text = (message || '').trim();

        // 1. Check for reminder / promise patterns
        const reminderMatch = text.match(/(ingetin|ingat|remind|tolong ingetin|besok ingetin|nanti ingetin|jadwalin)\s+(gue|gw|aku|saya)?\s*(buat|untuk|cek|beli|bikin|telepon|bayar|kirim)?\s*([^\.\n\?]+)/i);
        if (reminderMatch) {
            const taskContent = reminderMatch[0].trim();
            const timeHint = text.match(/(besok|nanti|malam ini|pagi ini|sore ini|minggu depan|lusa|jam \d{1,2})/i);
            
            return {
                isTask: true,
                type: 'CREATE',
                task: {
                    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    description: taskContent,
                    when: timeHint ? timeHint[0] : 'nanti',
                    status: 'PENDING',
                    createdAt: new Date().toISOString()
                }
            };
        }

        // 2. Check for task inquiry / review patterns
        if (text.match(/^(tugas|task|reminder|catatan|yang belum gue kerjain apa|ada janji apa|ada task apa|ingetan gue apa)/i)) {
            return { isTask: true, type: 'QUERY' };
        }

        // 3. Check for task completion patterns
        const doneMatch = text.match(/(task|tugas|reminder)\s+([a-zA-Z0-9_-]+)\s+(udah|selesai|done|kelar)/i)
            || text.match(/(udah|selesai|done|kelar)\s+(cek|bayar|beli|bikin|kirim)\s+([^\.\n\?]+)/i);
        if (doneMatch) {
            return { isTask: true, type: 'COMPLETE', hint: doneMatch[0] };
        }

        return { isTask: false };
    }

    static async handleTaskAction(chatId, actionResult) {
        if (!actionResult.isTask) return null;

        const tasks = await this.loadTasks(chatId);

        if (actionResult.type === 'CREATE') {
            tasks.push(actionResult.task);
            await this.saveTasks(chatId, tasks);
            console.log(`[TaskPromiseTracker] 📌 Created Task for ${chatId}: "${actionResult.task.description}"`);
            return {
                handled: true,
                response: `Siap bro, udah tak catat ya: "${actionResult.task.description}" (Jadwal: ${actionResult.task.when}). Nanti tak bantu ingetin! 📌`
            };
        }

        if (actionResult.type === 'QUERY') {
            const pendingTasks = tasks.filter(t => t.status === 'PENDING');
            if (pendingTasks.length === 0) {
                return {
                    handled: true,
                    response: "Gak ada catatan task / janji yang pending nih bro. Bersih semua, aman! 👍"
                };
            }
            const taskListStr = pendingTasks.map((t, idx) => `${idx + 1}. ${t.description} (${t.when})`).join('\n');
            return {
                handled: true,
                response: `📌 Ini daftar task / ingetan kamu yang masih pending:\n\n${taskListStr}\n\nKalo udah ada yang kelar, kabari aja ya bro!`
            };
        }

        if (actionResult.type === 'COMPLETE') {
            // Find most recent pending task matching hint
            const pending = tasks.find(t => t.status === 'PENDING');
            if (pending) {
                pending.status = 'COMPLETED';
                pending.completedAt = new Date().toISOString();
                await this.saveTasks(chatId, tasks);
                return {
                    handled: true,
                    response: `Mantap bro, task "${pending.description}" udah tak tandai SELESAI! ✅`
                };
            }
        }

        return null;
    }
}
