// src/communication/TopicMemoryGraph.mjs
import fs from 'fs/promises';
import path from 'path';

const storageDir = path.resolve(process.cwd(), 'memory/topics');

export class TopicMemoryGraph {
    static async getGraph(chatId) {
        await fs.mkdir(storageDir, { recursive: true });
        const filePath = path.join(storageDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}_topics.json`);
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch {
            return {
                activeTopic: null,
                topics: {} // { [topicName]: { lastMentioned, interest, openLoops: [], lastOutcome: "" } }
            };
        }
    }

    static async updateTopic(chatId, topicName, loopOrOutcome = {}) {
        const graph = await this.getGraph(chatId);
        graph.activeTopic = topicName;

        if (!graph.topics[topicName]) {
            graph.topics[topicName] = {
                topic: topicName,
                firstDiscussed: Date.now(),
                lastMentioned: Date.now(),
                interest: 0.8,
                openLoops: [],
                lastOutcome: ''
            };
        }

        const t = graph.topics[topicName];
        t.lastMentioned = Date.now();

        if (loopOrOutcome.openLoop && !t.openLoops.includes(loopOrOutcome.openLoop)) {
            t.openLoops.push(loopOrOutcome.openLoop);
        }
        if (loopOrOutcome.resolvedLoop) {
            t.openLoops = t.openLoops.filter(l => l !== loopOrOutcome.resolvedLoop);
        }
        if (loopOrOutcome.lastOutcome) {
            t.lastOutcome = loopOrOutcome.lastOutcome;
        }

        const filePath = path.join(storageDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}_topics.json`);
        await fs.writeFile(filePath, JSON.stringify(graph, null, 2), 'utf8');
        return graph;
    }

    static getRelevantOpenLoops(graph) {
        let loops = [];
        for (const [name, data] of Object.entries(graph.topics || {})) {
            if (data.openLoops && data.openLoops.length > 0) {
                loops.push({
                    topic: name,
                    openLoops: data.openLoops,
                    lastOutcome: data.lastOutcome
                });
            }
        }
        return loops;
    }
}
