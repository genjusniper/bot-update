// src/agent/AgentBrain.mjs
// AgentBrain: The agentic execution subsystem (CommandInterpreter, ToolRouter, TaskStateMemory, ExecutionEngine)

import { WebSearchTool } from '../tools/web/WebSearchTool.mjs';

export class AgentBrain {
    static taskMemory = new Map(); // chatId -> currentActiveTask

    static interpret(text) {
        const lower = (text || '').trim().toLowerCase();

        // 1. Natural Command Interpreter
        let intent = 'NONE';
        let action = null;
        let query = null;

        if (lower.match(/(carikan|cariin|rekomendasi|cek harga|info tentang)/i)) {
            intent = 'SEARCH';
            action = 'WEB_SEARCH';
            query = text.replace(/^(tolong|coba)?\s*(carikan|cariin|rekomendasi|tolong cari|coba cari|cek harga|info tentang)\s*/gi, '').trim();
        } else if (lower.match(/(ingetin|ingatkan|setel alarm|ingat)/i)) {
            intent = 'REMINDER';
            action = 'SET_ALERT';
            query = text.replace(/^(tolong|coba)?\s*(ingetin|ingatkan|setel alarm|ingat)\s*/gi, '').trim();
        } else if (lower.match(/(bikinin|buatkan file|tulis)/i)) {
            intent = 'FILE';
            action = 'WRITE_FILE';
            query = text.replace(/^(tolong|coba)?\s*(bikinin|buatkan file|tulis)\s*/gi, '').trim();
        } else if (lower.match(/(lanjutin|lanjut)/i)) {
            intent = 'RESUME_TASK';
            action = 'RESUME';
        }

        return {
            intent,
            action,
            query,
            originalText: text
        };
    }

    static async execute(chatId, command) {
        // 2. Tool Router & Execution
        if (command.intent === 'SEARCH') {
            console.log(`[AgentBrain] 🌐 Routing to WEB_SEARCH: "${command.query}"`);
            const task = {
                id: Date.now().toString(),
                status: 'RUNNING',
                intent: 'SEARCH',
                query: command.query
            };
            this.taskMemory.set(chatId, task);

            const searchRes = await WebSearchTool.execute({ query: command.query });
            task.status = 'COMPLETED';
            task.result = searchRes;

            const snippets = (searchRes.results || []).map((r, i) => `[Hasil #${i+1}] ${r.snippet}`).join('\n');
            return {
                task,
                success: true,
                context: `=== HASIL PENCARIAN LIVE ===\n${snippets}\n============================`
            };
        }

        if (command.intent === 'RESUME_TASK') {
            const previousTask = this.taskMemory.get(chatId);
            if (previousTask && previousTask.status === 'COMPLETED') {
                console.log(`[AgentBrain] 🔄 Resuming previous task: "${previousTask.query}"`);
                return {
                    task: previousTask,
                    success: true,
                    context: `=== LANJUTAN TASK SEBELUMNYA (${previousTask.query}) ===\nSistem mengingat detail pencarian terakhir tentang ini.`
                };
            }
            return { success: false, context: 'Tidak ada task aktif yang bisa dilanjutkan.' };
        }

        return { success: false, context: '' };
    }
}
