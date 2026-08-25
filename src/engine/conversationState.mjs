export function analyzeConversationContinuity({
  text = '',
  memory = {}
} = {}) {

  const value = String(text || '').toLowerCase();

  const recent = Array.isArray(memory?.shortTerm)
    ? memory.shortTerm
        .slice(-8)
        .map(x => String(x?.text || ''))
        .filter(Boolean)
    : [];

  const callback =
    /\b(yang kemarin|yang tadi|tadi itu|kemarin itu|gimana|terus|lanjut|jadi gimana|itu gimana)\b/i
      .test(value);

  return {
    hasRecentContext: recent.length > 0,
    callback,
    recentMessages: recent
  };
}

export function analyzeConversationTiming({
  engagement = 'medium',
  fatigue = 'normal',
  followUp = 'none'
} = {}) {
  if (fatigue === 'possible') {
    return {
      responseLength: 'short',
      askQuestion: false,
      continuePressure: 'none'
    };
  }

  if (engagement === 'low') {
    return {
      responseLength: 'short',
      askQuestion: false,
      continuePressure: 'low'
    };
  }

  if (followUp === 'ask_one_relevant_question') {
    return {
      responseLength: 'medium',
      askQuestion: true,
      continuePressure: 'low'
    };
  }

  return {
    responseLength: 'natural',
    askQuestion: false,
    continuePressure: 'none'
  };
}

export function analyzeMemoryConfidence(memory = {}) {

  const facts = Array.isArray(memory?.facts)
    ? memory.facts
    : [];

  const preferences = Array.isArray(memory?.preferences)
    ? memory.preferences
    : [];

  return {
    facts: facts.map(value => ({
      value,
      confidence: 0.85
    })),

    preferences: preferences.map(value => ({
      value,
      confidence: 0.75
    })),

    rule:
      'Gunakan memory eksplisit lebih kuat daripada memory yang disimpulkan.'
  };
}

export function analyzeMultiTurnReference({
  text = '',
  previousReplies = [],
  memory = {}
} = {}) {
  const value = String(text || '').trim();

  const reference =
    /^(itu|ini|yang itu|yang tadi|yang ini|dia|mereka|disana|di sana|terus|kalau begitu|kalau yang murah|yang murah)\b/i
      .test(value);

  return {
    hasReference: reference,
    previousMessageAvailable: previousReplies.length > 0,
    topicsAvailable:
      Array.isArray(memory.topics) &&
      memory.topics.length > 0
  };
}

// ============================================================
// V7.8 CONTEXT COMPRESSION
// ============================================================

function compressConversationContext({
  context = '',
  maxLength = 7000
} = {}) {
  const value = String(context || '');

  if (value.length <= maxLength) {
    return value;
  }

  return (
    value.slice(0, maxLength) +
    '\n[CONTEXT DIPANGKAS UNTUK MENJAGA RELEVANSI]'
  );
}

export function analyzeConversationIntelligence({
  text = '',
  psychology = {},
  intent = {},
  memory = {},
  previousReplies = []
} = {}) {

  const value = String(text || '').trim();
  const lower = value.toLowerCase();

  const mood =
    psychology?.mood || 'neutral';

  const detectedIntent =
    intent?.intent ||
    psychology?.intent ||
    'conversation';

  // ----------------------------------------------------------
  // CONVERSATION STATE
  // ----------------------------------------------------------

  let state = 'normal';

  if (
    detectedIntent === 'greeting'
  ) {
    state = 'opening';
  }

  if (
    detectedIntent === 'venting'
  ) {
    state = 'support';
  }

  if (
    detectedIntent === 'joking'
  ) {
    state = 'playful';
  }

  if (
    detectedIntent === 'complaint'
  ) {
    state = 'sensitive';
  }

  // ----------------------------------------------------------
  // ENGAGEMENT
  // ----------------------------------------------------------

  let engagement = 'medium';

  if (value.length <= 5) {
    engagement = 'low';
  } else if (value.length >= 80) {
    engagement = 'high';
  }

  // ----------------------------------------------------------
  // HUMOR
  // ----------------------------------------------------------

  let humorLevel = 2;

  if (detectedIntent === 'joking') {
    humorLevel = 5;
  }

  if (
    mood === 'sad' ||
    mood === 'anxious' ||
    mood === 'angry'
  ) {
    humorLevel = 0;
  }

  if (detectedIntent === 'venting') {
    humorLevel = Math.min(humorLevel, 1);
  }

  // ----------------------------------------------------------
  // ROMANCE
  // ----------------------------------------------------------

  let romanceLevel = 0;

  const relationshipText = [
    memory?.summary || '',
    ...(Array.isArray(memory?.facts)
      ? memory.facts
      : [])
  ]
    .join(' ')
    .toLowerCase();

  if (
    /\b(pacar|pasangan|istri|suami|tunangan)\b/
      .test(relationshipText)
  ) {
    romanceLevel = 4;
  }

  if (
    /\b(sayang|cinta|kangen|rindu|beb|ayang)\b/
      .test(lower)
  ) {
    romanceLevel = Math.max(
      romanceLevel,
      3
    );
  }

  if (
    detectedIntent !== 'affection' &&
    romanceLevel < 4
  ) {
    romanceLevel = Math.min(
      romanceLevel,
      1
    );
  }

  // ----------------------------------------------------------
  // RESPONSE OBJECTIVE
  // ----------------------------------------------------------

  let objective = 'continue_conversation';

  switch (detectedIntent) {

    case 'question':
      objective = 'answer_question';
      break;

    case 'request':
      objective = 'help_user';
      break;

    case 'venting':
      objective = 'listen_and_support';
      break;

    case 'joking':
      objective = 'play_and_respond';
      break;

    case 'affection':
      objective = 'respond_warmly';
      break;

    case 'complaint':
      objective = 'deescalate';
      break;

    case 'greeting':
      objective = 'open_conversation';
      break;

    case 'confirmation':
      objective = 'confirm_and_continue';
      break;
  }

  // ----------------------------------------------------------
  // FOLLOW-UP
  // ----------------------------------------------------------

  let followUp = 'none';

  if (detectedIntent === 'venting') {
    followUp = 'ask_one_relevant_question';
  }

  if (
    detectedIntent === 'conversation' &&
    engagement === 'high'
  ) {
    followUp = 'consider_follow_up';
  }

  if (
    engagement === 'low'
  ) {
    followUp = 'do_not_force_conversation';
  }

  // ----------------------------------------------------------
  // FATIGUE
  // ----------------------------------------------------------

  let fatigue = 'normal';

  if (
    engagement === 'low' &&
    previousReplies.length >= 3
  ) {
    fatigue = 'possible';
  }

  // ----------------------------------------------------------
  // ANTI REPETITION
  // ----------------------------------------------------------

  const avoid = [];

  const recent = Array.isArray(previousReplies)
    ? previousReplies
        .slice(-5)
        .map(x => String(x).toLowerCase())
    : [];

  const patterns = [
    'semangat ya',
    'tenang ya',
    'aku mengerti',
    'aku paham',
    'jangan khawatir',
    'wkwk',
    'hehe',
    'iya'
  ];

  for (const phrase of patterns) {
    if (
      recent.some(reply =>
        reply.includes(phrase)
      )
    ) {
      avoid.push(phrase);
    }
  }

  // ----------------------------------------------------------
  // BOUNDARIES
  // ----------------------------------------------------------

  const boundaries = {
    noForcedRomance:
      romanceLevel < 3,

    noHumorWhenSensitive:
      mood === 'sad' ||
      mood === 'anxious' ||
      mood === 'angry',

    noManipulation: true,

    noInventedFacts: true,

    noPretendingActions: true
  };

  return {
    state,
    engagement,
    objective,
    humorLevel,
    romanceLevel,
    followUp,
    fatigue,
    avoid,
    boundaries
  };
}

export function analyzeMemoryIntelligenceV84({
  memory = {},
  incomingText = "",
  continuity = {},
  multiTurn = {}
} = {}) {
  const facts = Array.isArray(memory?.facts) ? memory.facts : [];

  return {
    factsAvailable: facts.length,
    callbackAllowed:
      Boolean(continuity?.hasRecentContext || multiTurn?.hasReference),
    useMemoryOnlyWhenRelevant: true,
    avoidRandomMemoryDrop: true
  };
}

