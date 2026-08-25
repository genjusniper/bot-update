// src/topics/TopicGraphEngine.mjs
// Topic Graph with Semantic Associative Bridges & Natural Continuity

import fs from 'fs/promises';
import path from 'path';

const graphDir = path.resolve(process.cwd(), 'memory/topics');

export class TopicGraphEngine {
    static topicNetwork = {
        'kerja': {
            subtopics: ['bos', 'target', 'gaji', 'teman kantor', 'lembur', 'capek'],
            bridges: { 'capek': 'istirahat', 'gaji': 'belanja', 'lembur': 'makanan' }
        },
        'kuliah': {
            subtopics: ['tugas', 'dosen', 'skripsi', 'teman', 'jadwal'],
            bridges: { 'tugas': 'pusing', 'skripsi': 'kelulusan' }
        },
        'game': {
            subtopics: ['gta', 'ark', 'roblox', 'mobile legends', 'steam', 'pc', 'gpu'],
            bridges: { 'pc': 'spesifikasi', 'steam': 'diskon' }
        },
        'makanan': {
            subtopics: ['nasi goreng', 'mie', 'soto', 'bakso', 'penyetan', 'kopi', 'martabak'],
            bridges: { 'martabak': 'diet', 'kopi': 'nongkrong' }
        },
        'rencana': {
            subtopics: ['project', 'liburan', 'bisnis', 'nabung', 'interview'],
            bridges: { 'project': 'coding', 'interview': 'kerja' }
        }
    };

    static async getGraph(chatId) {
        await fs.mkdir(graphDir, { recursive: true });
        const filePath = path.join(graphDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return {
                currentTopic: 'general',
                currentSubtopic: null,
                activeBridges: [],
                topicHistory: []
            };
        }
    }

    static async updateGraph(chatId, message) {
        const graph = await this.getGraph(chatId);
        const lower = (message || '').toLowerCase();

        let matchedTopic = null;
        let matchedSubtopic = null;

        for (const [topic, data] of Object.entries(this.topicNetwork)) {
            if (lower.includes(topic)) {
                matchedTopic = topic;
            }
            for (const sub of data.subtopics) {
                if (lower.includes(sub)) {
                    matchedTopic = topic;
                    matchedSubtopic = sub;
                    break;
                }
            }
            if (matchedTopic) break;
        }

        if (matchedTopic) {
            graph.currentTopic = matchedTopic;
            graph.currentSubtopic = matchedSubtopic;
            const bridges = this.topicNetwork[matchedTopic]?.bridges || {};
            graph.activeBridges = matchedSubtopic && bridges[matchedSubtopic] ? [bridges[matchedSubtopic]] : [];
            graph.topicHistory.push({ topic: matchedTopic, subtopic: matchedSubtopic, timestamp: Date.now() });
            if (graph.topicHistory.length > 8) graph.topicHistory.shift();
        }

        await fs.mkdir(graphDir, { recursive: true });
        const filePath = path.join(graphDir, `${chatId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        await fs.writeFile(filePath, JSON.stringify(graph, null, 2), 'utf8');

        return graph;
    }

    static formatDirectives(graph) {
        if (!graph || graph.currentTopic === 'general') return '';
        let str = `=== TOPIK PERCAKAPAN (TOPIC CONTINUITY) ===\n- Topik Utama: "${graph.currentTopic}"`;
        if (graph.currentSubtopic) str += ` (Subtopik: "${graph.currentSubtopic}")`;
        if (graph.activeBridges && graph.activeBridges.length > 0) {
            str += `\n- Jembatan Asosiasi Alami: Bisa mengalir ke topik "${graph.activeBridges[0]}" jika obrolan mereda.`;
        }
        return str;
    }
}
