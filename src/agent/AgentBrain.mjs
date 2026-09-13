// src/agent/AgentBrain.mjs
// AgentBrain: Context-Aware Autonomous Tool Dispatcher & Query Reformulator

import { WebSearchTool } from '../tools/web/WebSearchTool.mjs';

export class AgentBrain {
    static taskMemory = new Map(); // chatId -> currentActiveTask

    /**
     * Extracts concrete topic / subject from previous turns in conversation memory
     */
    static extractContextualTopic(history = []) {
        if (!Array.isArray(history) || history.length === 0) return null;

        const recentUserMsgs = history
            .filter(m => {
                const text = m.text || m.content || '';
                const isUser = m.role === 'user' || m.fromUser === true || m.fromMe === false || (!m.role && !m.fromMe);
                return isUser && text.length > 6;
            })
            .slice(-5)
            .reverse();

        for (const msg of recentUserMsgs) {
            const t = (msg.text || msg.content || '').trim();
            // Skip pure conversational banter or complaints
            if (!t.match(/^(bisa gak|oke|iya|lah makanya|serius gak|kenapa|mana|halo|oi|tes|kok gitu|beneran|lah kok|jangan sembarangan)$/i)) {
                let cleaned = t.replace(/^(eh|oi|bos|bang|bro|gan|kak|nana)\s*/i, '').trim();
                cleaned = cleaned.replace(/^(mau tanya info|mau tanya|tanya info|tolong cari|info|cari|apakah bisa|apakah)\s*(tentang|soal)?\s*/i, '').trim();
                return cleaned;
            }
        }
        return null;
    }

    interpret(text, history = []) {
        return AgentBrain.interpret(text, history);
    }

    static interpret(text, history = []) {
        const lower = (text || '').trim().toLowerCase();
        let cleanText = text.replace(/^(oi|oy|eh|bro|bos|bang|nana|kak|gan|gaes|guys)\b\s*/gi, '').trim();
        const cleanLower = cleanText.toLowerCase();

        // 1. Response Mode Engine
        let responseMode = 'NORMAL';
        if (cleanLower.match(/(berapa|kapan|siapa|jam berapa|di mana|dimana|mana)/i)) {
            responseMode = 'QUICK';
        } else if (cleanLower.match(/(kenapa|mengapa|jelasin|jelaskan|gimana caranya|bagaimana)/i)) {
            responseMode = 'DETAILED';
        }

        // 2. Natural Command Interpreter for Web Search & Information Retrieval
        let intent = 'NONE';
        let action = null;
        let query = null;

        const isSearchTrigger = Boolean(
            cleanLower.match(/\b(carikan data yang real|carikan data|cari data|carikan info|cariin info|carikan|cariin|rekomendasi|tolong cari|coba cari|cek harga|info tentang|infonya dong|cek jalur|cek info|lokasi|tempat|alamat|dimana|di mana|google maps|maps|cari di google|googling)\b/i) ||
            cleanLower.startsWith('cari ') ||
            cleanLower.startsWith('info ') ||
            cleanLower.startsWith('lokasi ')
        );

        if (isSearchTrigger) {
            intent = 'SEARCH';
            action = 'WEB_SEARCH';
            
            let rawQuery = cleanText;
            const match = cleanText.match(/\b(carikan data yang real|carikan data|cari data|carikan info|cariin info|carikan|cariin|rekomendasi|tolong cari|coba cari|cek harga|info tentang|infonya dong|cek jalur|cek info|lokasi|tempat|alamat|dimana|di mana|google maps|maps|cari di google|googling)\b\s*(dong|sih|deh)?\s*(tentang|soal|ke)?\s*/i);
            if (match) {
                const triggerEnd = match.index + match[0].length;
                rawQuery = cleanText.slice(triggerEnd).trim();
            }

            rawQuery = rawQuery.replace(/\s*(dong|sih|deh)$/i, '').trim();

            // Check if extracted query is too generic / anaphoric (e.g. "data yang real", "infonya", "itu", etc.)
            const isGenericQuery = rawQuery.length < 5 || Boolean(rawQuery.match(/^(data|real|yang real|data yang real|infonya|info|itu|yang tadi|jalurnya|dong|bisa gak|beneran|ada gak|gimana)$/i));

            if (isGenericQuery) {
                const contextTopic = this.extractContextualTopic(history);
                if (contextTopic) {
                    console.log(`[AgentBrain] 🧠 Contextual Query Reformulated from history: "${contextTopic}"`);
                    query = contextTopic;
                } else {
                    query = rawQuery || text;
                }
            } else {
                query = rawQuery;
            }
        } else if (cleanLower.match(/(ingetin|ingatkan|setel alarm|ingat)/i)) {
            intent = 'REMINDER';
            action = 'SET_ALERT';
            query = cleanText.replace(/^(tolong|coba)?\s*(dong|sih|deh)?\s*(ingetin|ingatkan|setel alarm|ingat)\s*(dong|sih|deh)?\s*/gi, '').trim();
        } else if (cleanLower.match(/(bikinin|buatkan file|tulis)/i)) {
            intent = 'FILE';
            action = 'WRITE_FILE';
            query = cleanText.replace(/^(tolong|coba)?\s*(dong|sih|deh)?\s*(bikinin|buatkan file|tulis)\s*(dong|sih|deh)?\s*/gi, '').trim();
        } else if (cleanLower.match(/(lanjutin|lanjut)/i)) {
            intent = 'RESUME_TASK';
            action = 'RESUME';
        }

        return {
            intent,
            action,
            query,
            originalText: text,
            responseMode
        };
    }

    static async execute(chatId, command) {
        if (command.intent === 'SEARCH' && command.query) {
            console.log(`[AgentBrain] 🌐 Executing WEB_SEARCH for query: "${command.query}"`);
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

            const snippets = (searchRes.results || []).map((r, i) => `[Sumber #${i+1}: ${r.title || 'Google'}]\n${r.snippet}${r.link ? `\nLink: ${r.link}` : ''}`).join('\n\n');
            
            return {
                task,
                success: true,
                context: `=== DATA RESMI & HASIL PENCARIAN GOOGLE (SUMBER VALID) ===\nTopik: "${command.query}"\nSumber: ${searchRes.source || 'google'}\n\n${snippets}\n==========================================================\nPANDUAN FAKTA & LINK:\n1. Gunakan informasi valid di atas untuk menjawab secara akurat, objektif, dan jujur.\n2. PENTING: Sertakan link sumber / link Google Maps yang tersedia di atas secara rapi di dalam pesan WhatsApp agar user bisa langsung klik!`
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
