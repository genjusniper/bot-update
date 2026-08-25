export function analyzeConversationMomentum({
  incomingText = '',
  conversation = {},
  continuity = {},
  previousReplies = []
} = {}) {
  const text = String(incomingText || '').trim();
  const short = text.length <= 12;
  const recent = Array.isArray(previousReplies) ? previousReplies : [];

  let momentum = 'stable';

  if (!text) momentum = 'low';
  else if (short && recent.length > 0) momentum = 'low';
  else if (text.length > 40) momentum = 'active';
  else if (conversation?.engagement === 'high') momentum = 'active';

  return {
    momentum,
    engagement: conversation?.engagement || 'unknown',
    shortMessage: short,
    recentReplies: recent.length
  };
}

function detectConversationOpportunity({
  incomingText = '',
  conversation = {},
  psychology = {},
  topic = {}
} = {}) {
  const text = String(incomingText || '').trim().toLowerCase();

  const personal =
    /\b(aku|saya|gue|gw|kowe|kamu)\b/.test(text);

  const emotional =
    /\b(capek|stres|mumet|pusing|seneng|sedih|kesel|marah|takut|bingung)\b/.test(text);

  const topicSignal =
    /\b(kerja|duit|uang|keuangan|game|anime|motor|mobil|gunung|hiking|mancing|ikan|bisnis|usaha|cinta|cewek|cowok|film|musik|lagu|hp|pc)\b/.test(text);

  let opportunity = 'none';

  if (emotional) opportunity = 'emotional';
  else if (topicSignal) opportunity = 'topic';
  else if (personal) opportunity = 'personal';
  else if (text.length > 20) opportunity = 'conversation';

  return {
    opportunity,
    personal,
    emotional,
    topicSignal,
    currentTopic: topic?.current || 'general'
  };
}

function detectResponseRepetition({
  responseHistory = [],
  previousReplies = [],
  incomingText = ''
} = {}) {
  const replies = Array.isArray(previousReplies)
    ? previousReplies.filter(Boolean).map(String)
    : [];

  const recent = replies.slice(-5);

  if (recent.length < 2) {
    return {
      repeated: false,
      similarity: 0,
      reason: 'insufficient_history'
    };
  }

  const normalize = value =>
    String(value)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

  const currentInput = normalize(incomingText);

  let repeated = false;
  let similarity = 0;

  for (const reply of recent) {
    const a = normalize(reply);

    if (!a || !currentInput) continue;

    const wordsA = new Set(a.split(' '));
    const wordsB = new Set(currentInput.split(' '));

    const intersection =
      [...wordsA].filter(x => wordsB.has(x)).length;

    const union = new Set([...wordsA, ...wordsB]).size;

    if (union > 0) {
      const score = intersection / union;

      if (score > similarity) similarity = score;
      if (score >= 0.75) repeated = true;
    }
  }

  return {
    repeated,
    similarity: Number(similarity.toFixed(2)),
    reason: repeated ? 'high_overlap' : 'normal'
  };
}

