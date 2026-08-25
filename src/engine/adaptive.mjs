export function analyzeImprovementSignal({
  reply = '',
  critic = {},
  conversation = {},
  timing = {}
} = {}) {
  return {
    quality: critic?.score ?? 0,
    criticPassed: critic?.pass ?? false,
    engagement: conversation?.engagement || 'medium',
    responseLength: timing?.responseLength || 'natural',
    shouldLearn:
      Boolean(critic?.pass) &&
      (conversation?.engagement === 'high' ||
       conversation?.state === 'playful' ||
       conversation?.state === 'support')
  };
}

// ============================================================
// END V6.1-V7.0 FULL INTELLIGENCE
// ============================================================



// ============================================================
// V7.1-V8.0 RESPONSE QUALITY PIPELINE
// ============================================================

// ============================================================
// V7.1 RESPONSE QUALITY JUDGE
// ============================================================

function judgeResponseQuality({
  response = '',
  incomingText = '',
  conversation = {},
  personality = {}
} = {}) {
  const text = String(response || '').trim();
  const input = String(incomingText || '').trim();

  const issues = [];

  if (!text) {
    issues.push('empty_response');
  }

  if (text.length > 1200 && input.length < 150) {
    issues.push('too_long');
  }

  const repeated = [
    'aku paham',
    'aku mengerti',
    'tenang ya',
    'semangat ya',
    'jangan khawatir'
  ];

  const lower = text.toLowerCase();

  const repetitionCount =
    repeated.filter(x => lower.includes(x)).length;

  if (repetitionCount >= 2) {
    issues.push('generic_repetition');
  }

  if (
    conversation?.boundaries?.noForcedRomance &&
    /\b(sayang|cinta|kangen|rindu|beb|ayang)\b/i.test(lower)
  ) {
    issues.push('forced_romance');
  }

  if (
    conversation?.boundaries?.noHumorWhenSensitive &&
    /\b(wkwk|haha|hehe|lol)\b/i.test(lower)
  ) {
    issues.push('inappropriate_humor');
  }

  if (/^(iya|oke|sip|hehe|wkwk)[.! ]*$/i.test(text)) {
    issues.push('low_information');
  }

  const score = Math.max(
    0,
    100 -
      issues.length * 20 -
      (text.length > 900 ? 10 : 0)
  );

  return {
    score,
    acceptable: score >= 70 && issues.length === 0,
    issues
  };
}

// ============================================================
// V7.2 SMART REGENERATION
// ============================================================

function shouldRegenerateResponse(judge = {}) {
  return (
    judge &&
    judge.acceptable === false &&
    Array.isArray(judge.issues) &&
    judge.issues.length > 0
  );
}

// ============================================================
// V7.3 MEMORY CONFLICT RESOLVER
// ============================================================

function resolveMemoryConflicts(memory = {}) {
  const result = {
    facts: [],
    preferences: [],
    conflicts: []
  };

  const facts = Array.isArray(memory.facts)
    ? memory.facts
    : [];

  const preferences = Array.isArray(memory.preferences)
    ? memory.preferences
    : [];

  const seen = new Map();

  for (const fact of facts) {
    const value = String(fact || '').trim();

    if (!value) continue;

    const key = value
      .toLowerCase()
      .replace(/[.!?]+/g, '')
      .trim();

    if (seen.has(key)) {
      result.conflicts.push({
        type: 'duplicate',
        values: [seen.get(key), value]
      });
      continue;
    }

    seen.set(key, value);
    result.facts.push(value);
  }

  result.preferences = [
    ...new Set(
      preferences
        .map(x => String(x || '').trim())
        .filter(Boolean)
    )
  ];

  return result;
}

// ============================================================
// V7.4 MEMORY IMPORTANCE SCORING
// ============================================================

function scoreMemoryImportance(memory = {}) {
  const score = value => {
    const text = String(value || '').toLowerCase();

    let result = 20;

    if (/\b(nama|panggil|umur|ulang tahun)\b/.test(text)) {
      result += 40;
    }

    if (/\b(suka|tidak suka|favorite|favorit|hobi)\b/.test(text)) {
      result += 30;
    }

    if (/\b(kerja|bisnis|usaha|proyek)\b/.test(text)) {
      result += 25;
    }

    if (/\b(ingat|jangan lupa|penting)\b/.test(text)) {
      result += 35;
    }

    return Math.min(result, 100);
  };

  return {
    facts: (Array.isArray(memory.facts) ? memory.facts : [])
      .map(value => ({
        value,
        importance: score(value)
      }))
      .sort((a, b) => b.importance - a.importance),

    preferences: (
      Array.isArray(memory.preferences)
        ? memory.preferences
        : []
    )
      .map(value => ({
        value,
        importance: score(value)
      }))
      .sort((a, b) => b.importance - a.importance)
  };
}

export function analyzeHallucinationRisk({
  response = '',
  context = '',
  incomingText = ''
} = {}) {
  const text = String(response || '').toLowerCase();
  const source = (
    String(context || '') +
    ' ' +
    String(incomingText || '')
  ).toLowerCase();

  const riskPatterns = [
    'saya sudah',
    'saya telah',
    'saya cek',
    'saya lihat',
    'saya kirim',
    'saya hubungi',
    'sudah saya lakukan'
  ];

  const suspiciousClaims =
    riskPatterns.filter(x => text.includes(x));

  return {
    risk: suspiciousClaims.length > 0 ? 'medium' : 'low',
    suspiciousClaims
  };
}

// ============================================================
// V8.0 FINAL RESPONSE PIPELINE
// ============================================================

function buildFinalResponseInstruction({
  judge = {},
  style = {},
  goal = {},
  reference = {},
  hallucination = {}
} = {}) {
  const instructions = [];

  if (judge?.issues?.length) {
    instructions.push(
      `Perbaiki masalah: ${judge.issues.join(', ')}.`
    );
  }

  if (style?.shortMessage) {
    instructions.push(
      'Pesan user pendek, jadi jangan membuat jawaban berlebihan.'
    );
  }

  if (style?.usesJavanese) {
    instructions.push(
      'User memakai unsur bahasa Jawa. Boleh menyesuaikan secara natural.'
    );
  }

  if (goal?.goal) {
    instructions.push(
      `Tujuan percakapan: ${goal.goal}.`
    );
  }

  if (reference?.hasReference) {
    instructions.push(
      'Pesan kemungkinan merujuk percakapan sebelumnya. Gunakan konteks sebelum menjawab.'
    );
  }

  if (hallucination?.risk !== 'low') {
    instructions.push(
      'Jangan mengklaim telah melakukan tindakan atau mengetahui fakta yang tidak tersedia.'
    );
  }

  return instructions.join('\n');
}

