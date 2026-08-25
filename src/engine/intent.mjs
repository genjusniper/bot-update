export function analyzeIntent(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return {
      intent: 'conversation',
      confidence: 0
    };
  }

  const value = text.trim();
  const lower = value.toLowerCase();

  if (
    /^(hai|halo|hi|hey|p|pagi|siang|sore|malam)\b/i.test(lower)
  ) {
    return {
      intent: 'greeting',
      confidence: 0.95
    };
  }

  if (
    /\b(sayang|cinta|kangen|rindu|beb|ayang|pacar|love)\b/i.test(lower)
  ) {
    return {
      intent: 'affection',
      confidence: 0.88
    };
  }

  if (
    /\b(capek|lelah|sedih|nangis|stress|stres|pusing|bingung|takut|kecewa|kesel|marah|galau)\b/i.test(lower) ||
    /aku mau curhat|aku cuma mau cerita/i.test(lower)
  ) {
    return {
      intent: 'venting',
      confidence: 0.86
    };
  }

  if (
    /[?]\s*$/.test(value) ||
    /^(apa|apakah|kenapa|mengapa|gimana|bagaimana|kapan|dimana|di mana|siapa|berapa|boleh|bisa|kok)\b/i.test(lower)
  ) {
    return {
      intent: 'question',
      confidence: 0.93
    };
  }

  if (
    /^(tolong|bantu|bikinin|buatkan|buat|carikan|cari|kasih|beri|jelaskan|rekomendasikan)\b/i.test(lower)
  ) {
    return {
      intent: 'request',
      confidence: 0.91
    };
  }

  if (
    /\b(wkwk|wkwkwk|haha|hahaha|hehe|lol|kwkw)\b/i.test(lower)
  ) {
    return {
      intent: 'joking',
      confidence: 0.90
    };
  }

  if (
    /\b(kecewa|komplain|protes|gak adil|tidak adil|nyebelin)\b/i.test(lower)
  ) {
    return {
      intent: 'complaint',
      confidence: 0.82
    };
  }

  if (
    /^(iya|bener|benar|betul|oke|ok|sip|siap|nah)\b/i.test(lower)
  ) {
    return {
      intent: 'confirmation',
      confidence: 0.78
    };
  }

  return {
    intent: 'conversation',
    confidence: 0.50
  };
}

// ============================================================
// END V5.0 INTENT ENGINE
// ============================================================

// ============================================================

// ============================================================


// ============================================================
// V5.4-V6.0 FULL CONVERSATION INTELLIGENCE
// ============================================================

// ------------------------------------------------------------
// V5.4 ADAPTIVE RESPONSE ENGINE
// ------------------------------------------------------------

function adaptiveResponse({
  text = '',
  psychology = {},
  conversation = {},
  personality = {}
} = {}) {

  const value = String(text || '').trim();

  let length = 'medium';
  let emoji = 'low';
  let question = false;

  if (value.length <= 15) {
    length = 'short';
  } else if (value.length >= 120) {
    length = 'long';
  }

  if (
    psychology.mood === 'sad' ||
    psychology.mood === 'anxious' ||
    psychology.mood === 'angry'
  ) {
    emoji = 'none';
  } else if (personality.humor >= 65) {
    emoji = 'medium';
  }

  if (
    conversation.followUp === 'ask_one_relevant_question'
  ) {
    question = true;
  }

  if (
    conversation.engagement === 'low' ||
    conversation.fatigue === 'possible'
  ) {
    question = false;
    length = 'short';
  }

  return {
    length,
    emoji,
    question,
    maxSentences:
      length === 'short'
        ? 2
        : length === 'medium'
          ? 4
          : 7
  };
}

export function analyzeConversationGoal({
  intent = {},
  psychology = {},
  conversation = {}
} = {}) {
  const detected =
    intent?.intent ||
    psychology?.intent ||
    'conversation';

  const goals = {
    greeting: 'open_conversation',
    question: 'provide_answer',
    request: 'complete_request',
    venting: 'provide_support',
    joking: 'maintain_playfulness',
    affection: 'maintain_warmth',
    complaint: 'resolve_tension',
    confirmation: 'continue_topic',
    conversation: 'maintain_conversation'
  };

  return {
    goal: goals[detected] || 'maintain_conversation',
    state: conversation?.state || 'normal'
  };
}

