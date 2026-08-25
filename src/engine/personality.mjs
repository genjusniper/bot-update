export function analyzeStyleMirror({
  text = ''
} = {}) {

  const value = String(text || '');

  const lower = value.toLowerCase();

  let language = 'indonesia';
  let formality = 'casual';
  let slang = false;
  let emoji = false;

  if (
    /\b(aku|kamu|gak|nggak|ngga|gk|gue|gw|lu|lo|kok|nih|sih|dong|lah)\b/i
      .test(lower)
  ) {
    slang = true;
    formality = 'very_casual';
  }

  if (
    /\b(ora|opo|ngopo|piye|wis|wes|kowe|aku|sampeyan|mbok|nek|karo|mbe|ndak)\b/i
      .test(lower)
  ) {
    language = 'jawa_or_mixed';
  }

  if (/[😂🤣😭😅❤️💕😍🥹]/u.test(value)) {
    emoji = true;
  }

  return {
    language,
    formality,
    slang,
    emoji
  };
}

export function analyzeHumorStrategy({
  psychology = {},
  conversation = {},
  personality = {}
} = {}) {
  const sensitive =
    psychology?.mood === 'sad' ||
    psychology?.mood === 'angry' ||
    psychology?.mood === 'anxious';

  if (sensitive || conversation?.boundaries?.noHumorWhenSensitive) {
    return {
      allowed: false,
      level: 0,
      style: 'none'
    };
  }

  const level = Math.min(
    conversation?.humorLevel ?? 2,
    Math.round((personality?.humor ?? 45) / 20)
  );

  return {
    allowed: level > 0,
    level,
    style:
      level >= 4
        ? 'playful'
        : level >= 2
          ? 'light'
          : 'none'
  };
}

export function analyzeRomanceCalibration({
  conversation = {},
  intent = {},
  memory = {}
} = {}) {
  const relationshipText = [
    memory?.summary || '',
    ...(Array.isArray(memory?.facts) ? memory.facts : [])
  ]
    .join(' ')
    .toLowerCase();

  const knownRelationship =
    /\b(pacar|pasangan|istri|suami|tunangan)\b/.test(
      relationshipText
    );

  let level = conversation?.romanceLevel ?? 0;

  if (!knownRelationship && intent?.intent !== 'affection') {
    level = Math.min(level, 1);
  }

  return {
    level,
    allowed: level >= 3,
    calibrated:
      level >= 4
        ? 'intimate'
        : level >= 2
          ? 'warm'
          : 'neutral'
  };
}

// ============================================================
// V6.9 RESPONSE CRITIC
// ============================================================

function criticResponse(reply = '', incomingText = '') {
  const value = String(reply || '').trim();

  const issues = [];

  if (!value) {
    issues.push('empty');
  }

  if (value.length > 1200) {
    issues.push('too_long');
  }

  const repeatedPatterns = [
    'aku paham',
    'semoga',
    'tenang ya',
    'wkwk wkwk',
    'hehe hehe'
  ];

  for (const pattern of repeatedPatterns) {
    if (value.toLowerCase().includes(pattern)) {
      issues.push(`pattern:${pattern}`);
    }
  }

  if (
    String(incomingText || '').trim().endsWith('?') &&
    !value.includes('?') &&
    value.length < 15
  ) {
    issues.push('possibly_not_answering');
  }

  return {
    pass: issues.length === 0,
    issues,
    score: Math.max(0, 100 - issues.length * 20)
  };
}

export function analyzeUserStyle(text = '') {
  const value = String(text || '');

  return {
    language:
      /\b(aku|kamu|gue|gw|lu|kita)\b/i.test(value)
        ? 'casual'
        : 'neutral',

    usesJavanese:
      /\b(nggak|gak|ora|wis|mbok|kowe|aku|mbe|nek|opo|piye|ngene|ngono)\b/i
        .test(value),

    shortMessage: value.length < 40,

    emoji:
      /[\u{1F300}-\u{1FAFF}]/u.test(value),

    laughter:
      /\b(wkwk+|haha+|hehe+|kwkw+)\b/i.test(value),

    punctuation:
      /!{2,}|\?{2,}/.test(value)
        ? 'expressive'
        : 'normal'
  };
}

export function analyzePersonalityAdaptationV86({
  style = {},
  personality = {},
  incomingText = ""
} = {}) {
  return {
    language: style?.language || "indonesian",
    formality: style?.formality || "casual",
    slang: style?.slang || false,
    emoji: style?.emoji || false,
    mirrorLightly: true,
    neverCopyMistakes: true
  };
}

