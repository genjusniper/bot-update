import { buildConversationState } from '../engine/index.mjs';

export function runLegacyAdapter(input) {
  // Call the new pure V10 Conversation Engine
  const v10State = buildConversationState({
    text: input.text,
    memory: input.memory,
    previousReplies: input.previousReplies
  });

  // Ensure legacy compatibility: we just return the object mappings 
  // exactly as the legacy system expects them, which in this phase
  // is a 1:1 map since the pure functions were strictly copied.
  return {
    psychology: v10State.psychology,
    intent: v10State.intent,
    conversation: v10State.conversation,
    familiarity: v10State.familiarity,
    continuity: v10State.continuity,
    style: v10State.style,
    trajectory: v10State.trajectory,
    proactive: v10State.proactive,
    topic: v10State.topic,
    entities: v10State.entities,
    relationshipEmotion: v10State.relationshipEmotion,
    timing: v10State.timing,
    humor: v10State.humor,
    userStyle: v10State.userStyle,
    goal: v10State.goal,
    multiTurn: v10State.multiTurn
  };
}
