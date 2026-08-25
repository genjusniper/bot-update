// src/topics/TopicMemoryGraph.mjs — STUB untuk backward compat
// Di-import oleh UniversalConversationOS yang masih pakai path lama

export class TopicMemoryGraph {
    static async getGraph(chatId) {
        return { topics: [], lastTopic: null };
    }
    static async updateTopic(chatId, topic, data) {
        // no-op stub
    }
}
