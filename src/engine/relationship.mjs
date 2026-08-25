export function analyzeFamiliarity({
  text = '',
  memory = {},
  previousReplies = []
} = {}) {

  const value = String(text || '').toLowerCase();

  const history = [
    memory?.summary || '',
    ...(Array.isArray(memory?.facts) ? memory.facts : []),
    ...(Array.isArray(memory?.preferences) ? memory.preferences : []),
    ...(Array.isArray(previousReplies) ? previousReplies : [])
  ]
    .join(' ')
    .toLowerCase();

  let familiarity = 0;

  if (history.length > 80) familiarity += 20;
  if (history.length > 300) familiarity += 20;
  if (history.length > 800) familiarity += 20;

  if (
    /\b(bro|sob|gus|guys|cuy|woy|rek|bang|mas|mbak)\b/i.test(value)
  ) {
    familiarity += 10;
  }

  if (
    /\b(sayang|ayang|beb|cinta|kangen|rindu)\b/i.test(value)
  ) {
    familiarity += 10;
  }

  familiarity = Math.min(100, familiarity);

  let level = 'new';

  if (familiarity >= 70) {
    level = 'very_close';
  } else if (familiarity >= 45) {
    level = 'close';
  } else if (familiarity >= 20) {
    level = 'familiar';
  }

  // Jangan menyimpulkan hubungan romantis hanya dari satu kata.
  const romanceEvidence =
    /\b(pacar|pasangan|istri|suami|tunangan)\b/i.test(history);

  return {
    score: familiarity,
    level,
    romanceEvidence,
    safeRomance:
      romanceEvidence ||
      (
        /\b(sayang|cinta|kangen|rindu)\b/i.test(value) &&
        familiarity >= 45
      )
  };
}

export function analyzeSocialModeV82({
  incomingText = '',
  conversation = {},
  trajectory = {},
  continuity = {},
  previousReplies = []
} = {}) {
  const text = String(incomingText || '').trim().toLowerCase();

  const sensitive =
    trajectory?.current === 'sad' ||
    trajectory?.current === 'stressed' ||
    trajectory?.current === 'angry' ||
    /\b(capek|lelah|stres|stress|mumet|pusing|sedih|kecewa|hancur|takut|bingung)\b/i.test(text);

  const shortMessage =
    text.length <= 12 ||
    /^(p|ya|iya|yo|hmm|hm|opo|terus|terus piye|hehe|wkwk)$/i.test(text);

  const playful =
    /\b(wkwk|hehe|haha|😂|🤣|ngakak|lucu)\b/i.test(text);

  if (sensitive) return {
    mode: 'COMFORT',
    questionAllowed: false,
    topicChange: false,
    reason: 'user appears emotionally loaded'
  };

  if (playful) return {
    mode: 'PLAYFUL',
    questionAllowed: true,
    topicChange: false,
    reason: 'playful conversation'
  };

  if (shortMessage && continuity?.hasRecentContext) return {
    mode: 'CONTINUE',
    questionAllowed: true,
    topicChange: true,
    reason: 'short message with existing context'
  };

  return {
    mode: 'RESPOND_ONLY',
    questionAllowed: true,
    topicChange: true,
    reason: 'normal conversation'
  };
}


function detectTopicOpportunityV82({
  incomingText = '',
  conversation = {},
  previousReplies = []
} = {}) {
  const text = String(incomingText || '').toLowerCase();

  const topics = [];

  const topicMap = {
    kerjaan: /\b(kerja|kerjaan|kantor|bos|shift|teman kerja)\b/i,
    uang: /\b(uang|duit|gaji|tabungan|utang|keuangan)\b/i,
    bisnis: /\b(bisnis|jualan|usaha|dagang|jualan online)\b/i,
    game: /\b(game|gaming|roblox|ml|mobile legend|ps)\b/i,
    anime: /\b(anime|manga|one piece|naruto)\b/i,
    gunung: /\b(gunung|mendaki|naik gunung|prau|merbabu|bromo)\b/i,
    teknologi: /\b(ai|teknologi|coding|programming|hp|komputer)\b/i,
    musik: /\b(musik|lagu|nyanyi|band)\b/i,
    makanan: /\b(makan|kuliner|masak|makanan)\b/i,
    perjalanan: /\b(jalan|liburan|wisata|trip|travel)\b/i
  };

  for (const [topic, regex] of Object.entries(topicMap)) {
    if (regex.test(text)) topics.push(topic);
  }

  return {
    available: topics.length > 0,
    topics,
    confidence: topics.length ? 0.9 : 0.2
  };
}


function detectConversationRecoveryV82({
  incomingText = '',
  previousReplies = [],
  continuity = {}
} = {}) {
  const text = String(incomingText || '').trim();

  const short =
    text.length <= 12 ||
    /^(p|ya|iya|yo|hmm|hm|opo|terus|terus piye)$/i.test(text);

  const repeated =
    previousReplies.length >= 3 &&
    new Set(previousReplies.slice(-3)).size <= 2;

  return {
    needed: Boolean(short && (repeated || !continuity?.hasRecentContext)),
    shortMessage: short,
    repeated,
    action: short && repeated
      ? 'RECOVER_CONVERSATION'
      : 'NONE'
  };
}


function buildV82SocialInstruction({
  socialMode = {},
  topicOpportunity = {},
  recovery = {}
} = {}) {
  const rules = [];

  rules.push(
    `MODE: ${socialMode.mode || 'RESPOND_ONLY'}`,
    `QUESTION_ALLOWED: ${socialMode.questionAllowed !== false}`,
    `TOPIC_CHANGE_ALLOWED: ${socialMode.topicChange !== false}`
  );

  if (socialMode.mode === 'COMFORT') {
    rules.push(
      'Prioritaskan menemani dan validasi.',
      'Jangan menginterogasi user.',
      'Jangan tiba-tiba mengganti topik.',
      'Jangan memberi terlalu banyak solusi kecuali diminta.'
    );
  }

  if (socialMode.mode === 'PLAYFUL') {
    rules.push(
      'Balas dengan energi ringan dan natural.',
      'Boleh bercanda jika konteks mendukung.',
      'Jangan memaksakan humor.'
    );
  }

  if (topicOpportunity.available) {
    rules.push(
      `TOPIK TERSEDIA: ${topicOpportunity.topics.join(', ')}`,
      'Gunakan topik hanya jika ada jembatan alami.',
      'Jangan menyebut daftar topik secara kaku.'
    );
  }

  if (recovery.needed) {
    rules.push(
      'Percakapan mulai terasa mandek.',
      'Lakukan conversation recovery secara natural.',
      'Boleh membuka arah pembicaraan ringan.',
      'Jangan membuat respons terasa seperti bot yang sedang menjalankan strategi.'
    );
  }

  rules.push(
    'Jangan selalu mengakhiri balasan dengan pertanyaan.',
    'Jangan selalu menggunakan "iya", "aku paham", "kenapa", atau "terus".',
    'Variasikan ritme: komentar, respons emosional, cerita kecil, callback, atau pertanyaan ringan.',
    'Tujuan utama adalah percakapan terasa spontan, hangat, dan menyenangkan.'
  );

  return rules.join('\n');
}

export function analyzeRelationshipV83({
  conversation = {},
  familiarity = {},
  psychology = {},
  previousReplies = []
} = {}) {
  const score = Number(familiarity?.score || 0);

  let level = "NEW";
  if (score >= 75) level = "CLOSE";
  else if (score >= 50) level = "FAMILIAR";
  else if (score >= 25) level = "KNOWN";

  return {
    level,
    warmth: level === "CLOSE" ? "high" :
            level === "FAMILIAR" ? "medium" : "low",
    avoid: level === "NEW"
      ? ["over-familiar", "forced-romance"]
      : ["forced-romance"],
    evidence: Number(familiarity?.romanceEvidence || 0)
  };
}

