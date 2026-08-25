export function analyzeEmotionTrajectory({
  psychology = {},
  memory = {}
} = {}) {

  const current = psychology?.mood || 'neutral';

  const recent = Array.isArray(memory?.shortTerm)
    ? memory.shortTerm.slice(-6)
    : [];

  const text = recent
    .map(x => String(x?.text || '').toLowerCase())
    .join(' ');

  let trajectory = 'stable';

  const negative =
    /\b(sedih|capek|lelah|stress|stres|marah|kecewa|takut|nangis|galau|pusing)\b/i
      .test(text);

  const positive =
    /\b(senang|bahagia|happy|lega|ketawa|wkwk|haha|mantap|asyik)\b/i
      .test(text);

  if (
    negative &&
    (current === 'sad' || current === 'anxious' || current === 'angry')
  ) {
    trajectory = 'declining';
  } else if (
    positive &&
    (current === 'happy' || current === 'excited')
  ) {
    trajectory = 'improving';
  }

  return {
    current,
    trajectory
  };
}

export function analyzeRelationshipEmotion({
  psychology = {},
  previousReplies = []
} = {}) {
  const mood = psychology?.mood || 'neutral';

  let state = 'stable';

  if (mood === 'happy' || mood === 'excited') {
    state = 'warm';
  }

  if (mood === 'sad' || mood === 'anxious') {
    state = 'needs_support';
  }

  if (mood === 'angry') {
    state = 'sensitive';
  }

  return {
    state,
    mood,
    continuity:
      previousReplies.length >= 2
        ? 'ongoing'
        : 'fresh'
  };
}

export function analyzeEmotionIntelligenceV85({
  trajectory = {},
  psychology = {},
  conversation = {}
} = {}) {
  const emotion = String(trajectory?.current || "neutral");

  const sensitive = [
    "sad",
    "stressed",
    "angry",
    "anxious",
    "hurt"
  ].includes(emotion);

  return {
    emotion,
    sensitive,
    energy: sensitive ? "low" : "adaptive",
    responsePriority: sensitive
      ? "emotional-support"
      : "normal-conversation"
  };
}

