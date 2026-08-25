export function analyzeQuestionPressure({
  conversation = {},
  proactive = {},
  opportunity = {},
  incomingText = ''
} = {}) {
  const text = String(incomingText || '').trim();

  const alreadyQuestion =
    /[?？]$/.test(text);

  let pressure = 'low';

  if (alreadyQuestion) pressure = 'avoid_question';
  else if (opportunity?.opportunity === 'emotional') pressure = 'very_low';
  else if (conversation?.engagement === 'low') pressure = 'low';
  else if (proactive?.shouldAsk) pressure = 'medium';

  return {
    pressure,
    alreadyQuestion,
    shouldAsk:
      pressure === 'medium'
  };
}

function selectConversationAction({
  momentum = {},
  opportunity = {},
  repetition = {},
  questionPressure = {}
} = {}) {
  if (opportunity?.opportunity === 'emotional') {
    return {
      action: 'listen_and_validate',
      reason: 'emotional_context'
    };
  }

  if (repetition?.repeated) {
    return {
      action: 'change_pattern',
      reason: 'response_repetition'
    };
  }

  if (opportunity?.opportunity === 'topic') {
    return {
      action: 'explore_topic',
      reason: 'topic_opportunity'
    };
  }

  if (momentum?.momentum === 'low') {
    return {
      action: 'light_nudge',
      reason: 'low_conversation_momentum'
    };
  }

  return {
    action: 'continue_naturally',
    reason: 'normal_flow'
  };
}

function selectTopicNudge({
  opportunity = {},
  momentum = {},
  incomingText = ''
} = {}) {
  const text = String(incomingText || '').toLowerCase();

  if (opportunity?.emotional) {
    return {
      type: 'emotional',
      topic: null,
      intensity: 0
    };
  }

  const topics = [
    ['kerja', /\b(kerja|kantor|shift|atasan|teman kerja)\b/],
    ['keuangan', /\b(uang|duit|keuangan|gaji|utang|cicilan)\b/],
    ['hobi', /\b(game|gaming|anime|musik|mancing)\b/],
    ['travel', /\b(gunung|hiking|naik gunung|touring|jalan)\b/],
    ['teknologi', /\b(hp|pc|komputer|aplikasi|coding|ai)\b/],
    ['bisnis', /\b(bisnis|usaha|jualan|dagang|produk)\b/]
  ];

  for (const [topic, regex] of topics) {
    if (regex.test(text)) {
      return {
        type: 'related_topic',
        topic,
        intensity: momentum?.momentum === 'low' ? 1 : 2
      };
    }
  }

  return {
    type: 'open_topic',
    topic: null,
    intensity: momentum?.momentum === 'low' ? 1 : 0
  };
}

function buildTopicBridge({
  action = {},
  nudge = {},
  incomingText = ''
} = {}) {
  if (action?.action === 'listen_and_validate') {
    return 'Utamakan merespons perasaan user. Jangan buru-buru mengalihkan topik.';
  }

  if (action?.action === 'change_pattern') {
    return 'Gunakan cara bicara berbeda dari balasan sebelumnya agar tidak terasa monoton.';
  }

  if (nudge?.topic) {
    return `Jika natural, sambungkan percakapan dengan topik ${nudge.topic}. Jangan memaksakan.`;
  }

  if (action?.action === 'light_nudge') {
    return 'Boleh membuka celah topik ringan yang relevan, tetapi jangan terasa seperti interview.';
  }

  return 'Lanjutkan percakapan secara natural berdasarkan pesan terbaru.';
}

function buildV81ConversationInstruction({
  action = {},
  momentum = {},
  opportunity = {},
  repetition = {},
  questionPressure = {},
  nudge = {},
  bridge = ''
} = {}) {
  return `
=== V8.1 NATURAL CONVERSATION LAYER ===

Action:
${JSON.stringify(action)}

Momentum:
${JSON.stringify(momentum)}

Opportunity:
${JSON.stringify(opportunity)}

Repetition:
${JSON.stringify(repetition)}

Question Pressure:
${JSON.stringify(questionPressure)}

Topic Nudge:
${JSON.stringify(nudge)}

Bridge:
${bridge}

RULES V8.1:

1. Jangan membuat percakapan terasa seperti sesi tanya jawab.
2. Jangan selalu mengakhiri balasan dengan pertanyaan.
3. Jika ada peluang topik baru, boleh membuka topik secara natural.
4. Topik baru harus punya hubungan dengan percakapan, bukan random.
5. Jika user sedang curhat, validasi dulu sebelum mengembangkan topik.
6. Jika user hanya menjawab pendek, jangan langsung menyerah dan jangan membuat paragraf panjang.
7. Gunakan respons yang terasa seperti teman yang ikut ngobrol.
8. Variasikan pembuka dan pola kalimat.
9. Hindari pengulangan "iya", "aku paham", "wkwk", "hehe", dan "sing sabar".
10. Sesekali boleh memberikan komentar kecil, observasi, candaan ringan, atau cerita pendek yang relevan.
11. Jangan memaksa user terus berbicara.
12. Jika percakapan mulai hambar, boleh memberikan satu topic nudge ringan.
13. Jangan mengarang pengalaman pribadi atau fakta tentang user.
14. Prioritaskan konteks pesan terbaru.
15. Tetap singkat jika pesan user singkat.
16. Tujuan utama adalah membuat percakapan terasa hidup, bukan sekadar menjawab.

Buat SATU balasan WhatsApp yang terasa seperti teman ngobrol sungguhan.
`.trim();
}

