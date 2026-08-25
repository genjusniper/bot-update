export function analyzePsychology(text) {
  const input = String(text || '').trim();
  const lower = input.toLowerCase();

  let mood = 'neutral';
  let energy = 'medium';
  let intent = 'chat';
  let tone = 'casual';
  let needs = 'answer';

  const sadWords = [
    'sedih', 'nangis', 'menangis', 'kecewa',
    'capek', 'lelah', 'hancur', 'sakit hati',
    'sendiri', 'kesepian', 'putus asa'
  ];

  const angryWords = [
    'marah', 'kesel', 'sebel', 'benci',
    'muak', 'jengkel', 'ngamuk'
  ];

  const anxiousWords = [
    'takut', 'cemas', 'khawatir', 'bingung',
    'panik', 'deg-degan', 'kepikiran'
  ];

  const playfulWords = [
    'wkwk', 'haha', 'hahaha', 'hehe',
    '😂', '🤣', 'wkwkwk'
  ];

  const affectionWords = [
    'sayang', 'kangen', 'rindu', 'cinta',
    'love', 'miss you'
  ];

  const questionWords = [
    'apa', 'siapa', 'kapan', 'dimana',
    'di mana', 'kenapa', 'mengapa',
    'gimana', 'bagaimana', 'berapa',
    'boleh', 'bisa'
  ];

  if (sadWords.some(x => lower.includes(x))) {
    mood = 'sad';
    needs = 'listening';
  }

  if (angryWords.some(x => lower.includes(x))) {
    mood = 'angry';
    needs = 'space';
  }

  if (anxiousWords.some(x => lower.includes(x))) {
    mood = 'anxious';
    needs = 'reassurance';
  }

  if (playfulWords.some(x => lower.includes(x))) {
    mood = mood === 'neutral' ? 'playful' : mood;
    tone = 'playful';
  }

  if (affectionWords.some(x => lower.includes(x))) {
    intent = 'affection';
  }

  if (
    input.endsWith('?') ||
    questionWords.some(x => lower.startsWith(x + ' '))
  ) {
    intent = 'question';
  }

  if (
    lower.includes('curhat') ||
    lower.includes('cerita') ||
    lower.includes('mau cerita')
  ) {
    intent = 'venting';
    needs = 'listening';
  }

  if (
    input.length > 180 ||
    (input.split(/[.!?]+/).filter(Boolean).length >= 4)
  ) {
    energy = 'high';
  }

  if (input.length <= 12) {
    energy = 'low';
  }

  if (
    mood === 'sad' ||
    mood === 'angry' ||
    mood === 'anxious'
  ) {
    tone = 'emotional';
  }

  return {
    mood,
    energy,
    intent,
    tone,
    needs
  };
}

// ============================================================
// END V4.8 PSYCHOLOGY / EMOTION ENGINE

// ============================================================
// V4.9 PERSONALITY ENGINE
// ============================================================

function getPersonalityProfile(jid, psychology = {}) {
  const mood = psychology?.mood || 'neutral';
  const intent = psychology?.intent || 'conversation';
  const tone = psychology?.tone || 'casual';

  let warmth = 70;
  let humor = 45;
  let energy = 60;
  let formality = 15;

  if (mood === 'sad' || mood === 'anxious') {
    warmth = 90;
    humor = 10;
    energy = 35;
  }

  if (mood === 'angry') {
    warmth = 75;
    humor = 5;
    energy = 30;
  }

  if (mood === 'happy' || mood === 'excited') {
    warmth = 80;
    humor = 65;
    energy = 85;
  }

  if (intent === 'venting') {
    warmth = 90;
    humor = 10;
  }

  if (intent === 'joking') {
    humor = 75;
    energy = 80;
  }

  if (intent === 'question') {
    humor = Math.min(humor, 35);
  }

  if (tone === 'formal') {
    formality = 50;
    humor = Math.min(humor, 20);
  }

  return {
    name: 'Sahabat',
    warmth,
    humor,
    energy,
    formality,
    traits: [
      'natural',
      'hangat',
      'santai',
      'responsif',
      'tidak kaku',
      'tidak menggurui'
    ]
  };
}

