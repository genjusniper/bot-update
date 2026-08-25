// src/topics/TopicGraph.mjs
// Topic Graph & Semantic Associative Transitions

import fs from 'fs/promises';
import path from 'path';

const topicDir = path.resolve(process.cwd(), 'memory/topics');

export class TopicGraph {
    static semanticMap = {
        'kerja': ['bos', 'gaji', 'capek', 'proyek', 'kantor', 'ngopi'],
        'makanan': ['nasi goreng', 'mie', 'soto', 'bakso', 'penyetan', 'pedes', 'lapar'],
        'game': ['gta', 'roblox', 'mobile legends', 'steam', 'mabar', 'pc'],
        'coding': ['javascript', 'python', 'bug', 'deploy', 'github', 'server', 'termux'],
        'santai': ['nongkrong', 'tidur', 'rebahan', 'akhir pekan', 'ngopi', 'jalan']
    };

    static async getGraph(chatId) {
        await fs.mkdir(topicDir, { recursive: true });
        const filePath = path.join(topicDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return {
                currentTopic: 'general',
                relatedTopics: [],
                oldTopics: [],
                unfinishedTopics: [],
                topicHistory: []
            };
        }
    }

    static async updateTopic(chatId, message) {
        const graph = await this.getGraph(chatId);
        const lower = message.toLowerCase();

        let detected = null;
        for (const [topic, keywords] of Object.entries(this.semanticMap)) {
            if (lower.includes(topic) || keywords.some(kw => lower.includes(kw))) {
                detected = topic;
                break;
            }
        }

        if (detected && detected !== graph.currentTopic) {
            if (graph.currentTopic && graph.currentTopic !== 'general') {
                graph.oldTopics.push(graph.currentTopic);
                if (graph.oldTopics.length > 5) graph.oldTopics.shift();
            }
            graph.currentTopic = detected;
            graph.relatedTopics = this.semanticMap[detected] || [];
        }

        graph.topicHistory.push({ topic: graph.currentTopic, timestamp: Date.now() });
        if (graph.topicHistory.length > 10) graph.topicHistory.shift();

        await this.saveGraph(chatId, graph);
        return graph;
    }

    static async saveGraph(chatId, graph) {
        await fs.mkdir(topicDir, { recursive: true });
        const filePath = path.join(topicDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        await fs.writeFile(filePath, JSON.stringify(graph, null, 2), 'utf8');
    }

    static getTopicDirectives(graph) {
        if (!graph || graph.currentTopic === 'general') return '';
        return `=== TOPIK PERCAKAPAN ===
- Topik Aktif: "${graph.currentTopic}" (Topik Terkait: ${graph.relatedTopics.slice(0, 3).join(', ')})
${graph.oldTopics.length > 0 ? `- Topik Sebelumnya: "${graph.oldTopics[graph.oldTopics.length - 1]}"` : ''}`;
    }
}
