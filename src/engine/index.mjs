import { analyzePsychology } from './psychology.mjs';
import { analyzeIntent, analyzeConversationGoal } from './intent.mjs';
import { analyzeEmotionTrajectory, analyzeRelationshipEmotion, analyzeEmotionIntelligenceV85 } from './emotion.mjs';
import { analyzeStyleMirror, analyzeHumorStrategy, analyzeRomanceCalibration, analyzeUserStyle, analyzePersonalityAdaptationV86 } from './personality.mjs';
import { analyzeTopicTracker, analyzeEntities, analyzeTopicIntelligenceV87 } from './topic.mjs';
import { analyzeFamiliarity, analyzeSocialModeV82, analyzeRelationshipV83 } from './relationship.mjs';
import { analyzeProactiveConversation, analyzeProactiveIntelligenceV88 } from './proactive.mjs';
import { analyzeAntiMonotonyV89 } from './monotony.mjs';
import { analyzeConversationMomentum } from './momentum.mjs';
import { analyzeQuestionPressure } from './questionPressure.mjs';
import { analyzeImprovementSignal, analyzeHallucinationRisk } from './adaptive.mjs';
import { analyzeConversationContinuity, analyzeConversationTiming, analyzeMemoryConfidence, analyzeMultiTurnReference, analyzeConversationIntelligence, analyzeMemoryIntelligenceV84 } from './conversationState.mjs';

// V10 Engine Orchestrator
export function buildConversationState({ text, memory = {}, previousReplies = [] }) {
  // Execute pure analyzers in the exact same sequence as legacy generateReply()
  
  const psychology = analyzePsychology(text);
  const intent = analyzeIntent(text);
  
  const conversation = analyzeConversationIntelligence({
    text,
    psychology,
    intent,
    memory,
    previousReplies
  });

  const familiarity = analyzeFamiliarity({
    text,
    memory,
    previousReplies
  });

  const continuity = analyzeConversationContinuity({
    text,
    memory
  });

  const style = analyzeStyleMirror({
    text
  });

  const trajectory = analyzeEmotionTrajectory({
    psychology,
    memory
  });

  const proactive = analyzeProactiveConversation({
    conversation,
    // Note: adaptive response logic (maxSentences, emoji) relies on personality which isn't generated purely by analyze functions yet.
    // However, analyzeProactiveConversation safely handles missing adaptive object properties.
    adaptive: {}, 
    continuity,
    trajectory
  });

  const topic = analyzeTopicTracker(text, memory);
  const entities = analyzeEntities(text);
  
  const relationshipEmotion = analyzeRelationshipEmotion({
    psychology,
    previousReplies
  });

  const timing = analyzeConversationTiming({
    engagement: conversation.engagement,
    fatigue: conversation.fatigue,
    followUp: conversation.followUp
  });

  // analyzeHumorStrategy originally requires personality, we just pass nulls if missing, it's deterministic
  const humor = analyzeHumorStrategy({
    psychology,
    conversation,
    personality: {} 
  });

  const userStyle = analyzeUserStyle(text);

  const goal = analyzeConversationGoal({
    intent,
    psychology,
    conversation
  });

  const multiTurn = analyzeMultiTurnReference({
    text,
    previousReplies,
    memory
  });

  return {
    psychology,
    intent,
    conversation,
    familiarity,
    continuity,
    style,
    trajectory,
    proactive,
    topic,
    entities,
    relationshipEmotion,
    timing,
    humor,
    userStyle,
    goal,
    multiTurn
  };
}

export * from './psychology.mjs';
export * from './intent.mjs';
export * from './emotion.mjs';
export * from './personality.mjs';
export * from './topic.mjs';
export * from './relationship.mjs';
export * from './proactive.mjs';
export * from './monotony.mjs';
export * from './momentum.mjs';
export * from './questionPressure.mjs';
export * from './adaptive.mjs';
export * from './conversationState.mjs';
