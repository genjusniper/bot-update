export function analyzeTopicTracker(text = '', memory = {}) {
  const value = String(text || '').toLowerCase();

  const topics = {
    kerja: /\b(kerja|kantor|bos|shift|jualan|sales|target)\b/,
    cinta: /\b(cinta|sayang|pacar|pasangan|kangen|rindu|hubungan)\b/,
    keluarga: /\b(ayah|bapak|ibu|mama|keluarga|adik|kakak)\b/,
    perjalanan: /\b(jalan|wisata|bromo|gunung|hiking|mendaki|touring)\b/,
    teknologi: /\b(kode|coding|program|bot|ai|android|termux|website)\b/,
    bisnis: /\b(bisnis|usaha|jualan|produk|modal|untung|margin)\b/,
    gaming: /\b(game|gaming|roblox|ark|minecraft)\b/,
    trading: /\b(trading|forex|gold|xauusd|btc|crypto)\b/
  };

  const detected = Object.entries(topics)
    .filter(([, regex]) => regex.test(value))
    .map(([topic]) => topic);

  const previous = Array.isArray(memory.topics)
    ? memory.topics.slice(-5)
    : [];

  return {
    current: detected[0] || previous[previous.length - 1] || 'general',
    detected,
    previous
  };
}

export function analyzeEntities(text = '') {
  const value = String(text || '');

  const entities = [];

  const patterns = [
    /\b(?:nama|temanku|teman saya|teman gue|pacarku|pacar saya)\s+(?:adalah\s+)?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'-]{1,30})/i
  ];

  for (const regex of patterns) {
    const match = value.match(regex);

    if (match && match[1]) {
      entities.push({
        type: 'person',
        name: match[1].trim()
      });
    }
  }

  return entities;
}

// ============================================================
// V6.4 EPISODE MEMORY
// ============================================================

function createConversationEpisode({
  text = '',
  intent = {},
  topic = {},
  psychology = {}
} = {}) {
  const clean = String(text || '').trim();

  if (!clean) {
    return null;
  }

  return {
    text: clean.slice(0, 300),
    intent: intent?.intent || psychology?.intent || 'conversation',
    topic: topic?.current || 'general',
    mood: psychology?.mood || 'neutral',
    createdAt: Date.now()
  };
}

export function analyzeTopicIntelligenceV87({
  incomingText = "",
  topic = {},
  opportunity = {},
  previousReplies = []
} = {}) {
  const detected = Array.isArray(topic?.detected)
    ? topic.detected
    : [];

  const available = Array.isArray(opportunity?.topics)
    ? opportunity.topics
    : [];

  const topics = [...new Set([...detected, ...available])];

  return {
    currentTopic: topic?.current || "unknown",
    candidates: topics.slice(0, 5),
    topicChangeAllowed: topics.length > 0,
    requireBridge: true
  };
}

