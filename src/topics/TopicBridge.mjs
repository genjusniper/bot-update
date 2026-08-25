// src/topics/TopicBridge.mjs

export class TopicBridge {
    // Semantic association graph
    static associations = {
        'bot': ['termux', 'server', 'ai', 'ngoding', 'api', 'automation'],
        'termux': ['hp', 'linux', 'ssh', 'coding', 'server', 'batre'],
        'game': ['pc', 'gta', 'ark', 'roblox', 'steam', 'mabar'],
        'pc': ['gpu', 'ram', 'setup', 'blender', 'game', 'upgrade'],
        'kerjaan': ['kantor', 'capek', 'projek', 'boss', 'lembur', 'libur'],
        'ai': ['gemini', 'chatgpt', 'model', 'otomatisasi', 'bot']
    };

    static findBridge(currentTopic) {
        if (!currentTopic) return null;
        const related = this.associations[currentTopic.toLowerCase()];
        if (related && related.length > 0) {
            const pick = related[Math.floor(Math.random() * related.length)];
            return {
                from: currentTopic,
                to: pick,
                suggestion: `Bisa mengaitkan obrolan dari "${currentTopic}" ke topik terkait "${pick}" jika percakapan mulai melambat.`
            };
        }
        return null;
    }
}
