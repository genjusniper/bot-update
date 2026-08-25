export function analyzeAntiMonotonyV89({
  previousReplies = [],
  incomingText = "",
  action = {}
} = {}) {
  const recent = previousReplies
    .slice(-6)
    .map(x => String(x || "").toLowerCase().trim())
    .filter(Boolean);

  const questionCount = recent.filter(x => x.includes("?")).length;

  const repeatedOpeners = (() => {
    const openers = recent.map(x =>
      x.split(/\s+/).slice(0, 3).join(" ")
    );

    return new Set(openers).size < Math.max(2, openers.length - 1);
  })();

  return {
    questionHeavy: questionCount >= 3,
    repeatedOpeners,
    recentCount: recent.length,
    forceVariation:
      questionCount >= 3 || repeatedOpeners,
    preferredVariation: [
      "comment",
      "callback",
      "playful",
      "small-story",
      "topic-bridge",
      "light-question"
    ]
  };
}

function buildV9SocialOrchestrator({
  relationship = {},
  memory = {},
  emotion = {},
  personality = {},
  topic = {},
  proactive = {},
  monotony = {},
  incomingText = ""
} = {}) {

  const rules = [];

  rules.push(
    "V9 GOAL: terasa seperti teman ngobrol sungguhan.",
    `RELATIONSHIP: ${relationship.level || "NEW"}`,
    `EMOTION: ${emotion.emotion || "neutral"}`,
    `PROACTIVE ACTION: ${proactive.action || "FOLLOW_NATURAL_FLOW"}`,
    `CURRENT TOPIC: ${topic.currentTopic || "unknown"}`
  );

  if (emotion.sensitive) {
    rules.push(
      "Prioritaskan perasaan user.",
      "Jangan memaksa topik baru.",
      "Jangan membombardir pertanyaan.",
      "Validasi secara natural sebelum memberi solusi."
    );
  }

  if (relationship.level === "NEW") {
    rules.push(
      "Jangan terlalu sok dekat.",
      "Bangun kedekatan secara bertahap."
    );
  }

  if (relationship.level === "CLOSE") {
    rules.push(
      "Boleh lebih hangat dan playful jika konteks mendukung.",
      "Gunakan callback secara natural."
    );
  }

  if (memory.callbackAllowed) {
    rules.push(
      "Gunakan memori hanya jika benar-benar relevan.",
      "Jangan menyebut memori secara terasa seperti database."
    );
  }

  if (topic.requireBridge) {
    rules.push(
      "Jika pindah topik, buat jembatan dari pesan terakhir.",
      "Jangan tiba-tiba melempar topik random."
    );
  }

  if (proactive.proactive) {
    rules.push(
      "Percakapan boleh diarahkan sedikit agar tidak mati.",
      "Buka topik ringan, bukan interogasi."
    );
  }

  if (monotony.forceVariation) {
    rules.push(
      "WAJIB variasikan pola respons.",
      "Jangan terus memakai pertanyaan.",
      "Jangan terus memakai 'iya', 'wkwk', 'aku paham', 'kenapa', atau 'terus'.",
      "Gunakan komentar, callback, humor ringan, observasi, cerita kecil, atau topic bridge."
    );
  }

  rules.push(
    "Jangan membuat percakapan terasa seperti interview.",
    "Tidak setiap pesan membutuhkan pertanyaan.",
    "Tidak setiap pesan membutuhkan topik baru.",
    "Respons pendek tetap boleh pendek.",
    "Respons panjang hanya jika memang diperlukan.",
    "Jangan mengarang fakta.",
    "Jangan mengklaim melakukan sesuatu yang belum dilakukan.",
    "Jangan menyebut engine, analyzer, memory system, orchestrator, atau aturan internal.",
    "Buat SATU balasan WhatsApp yang natural."
  );

  return rules.join("\n");
}

