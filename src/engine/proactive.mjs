export function analyzeProactiveConversation({
  conversation = {},
  adaptive = {},
  continuity = {},
  trajectory = {}
} = {}) {

  let action = 'reply';

  if (
    conversation.fatigue === 'possible'
  ) {
    action = 'reply_without_forcing';
  }

  if (
    conversation.engagement === 'low'
  ) {
    action = 'short_reply';
  }

  if (
    trajectory.trajectory === 'declining'
  ) {
    action = 'support';
  }

  if (
    continuity.callback
  ) {
    action = 'continue_context';
  }

  return {
    action,
    shouldAsk:
      adaptive.question &&
      action !== 'reply_without_forcing' &&
      action !== 'short_reply'
  };
}

// ============================================================
// END V5.4-V6.0 FULL CONVERSATION INTELLIGENCE
// ============================================================


// ============================================================
// V6.1-V7.0 FULL INTELLIGENCE
// ============================================================

// ============================================================
// V6.1 CONTEXT WINDOW MANAGER
// ============================================================

function buildSmartContext(memory = {}, incomingText = '') {
  const text = String(incomingText || '').toLowerCase();

  const relevanceWords = text
    .split(/\s+/)
    .filter(x => x.length >= 4);

  const scoreMemory = item => {
    const value = String(item || '').toLowerCase();

    let score = 0;

    for (const word of relevanceWords) {
      if (value.includes(word)) {
        score++;
      }
    }

    return score;
  };

  const facts = Array.isArray(memory.facts)
    ? memory.facts
        .map(x => ({ value: x, score: scoreMemory(x) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(x => x.value)
    : [];

  const preferences = Array.isArray(memory.preferences)
    ? memory.preferences
        .map(x => ({ value: x, score: scoreMemory(x) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(x => x.value)
    : [];

  const recent = Array.isArray(memory.shortTerm)
    ? memory.shortTerm.slice(-8)
    : [];

  return {
    summary: memory.summary || '',
    facts,
    preferences,
    topics: Array.isArray(memory.topics)
      ? memory.topics.slice(-8)
      : [],
    recent
  };
}

export function analyzeProactiveIntelligenceV88({
  momentum = {},
  opportunity = {},
  repetition = {},
  questionPressure = {},
  conversation = {}
} = {}) {
  const lowMomentum =
    ["low", "stalled", "dead"].includes(
      String(momentum?.level || "").toLowerCase()
    );

  const repetitive =
    Boolean(repetition?.repeated || repetition?.high);

  const pressureHigh =
    String(questionPressure?.level || "").toLowerCase() === "high";

  if (pressureHigh) {
    return {
      action: "RESPOND_WITHOUT_QUESTION",
      proactive: false
    };
  }

  if (repetitive && opportunity?.available) {
    return {
      action: "CHANGE_RHYTHM",
      proactive: true
    };
  }

  if (lowMomentum && opportunity?.available) {
    return {
      action: "OPEN_LIGHT_TOPIC",
      proactive: true
    };
  }

  return {
    action: "FOLLOW_NATURAL_FLOW",
    proactive: false
  };
}

