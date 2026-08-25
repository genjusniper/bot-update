// src/ai/index.mjs
import { OpenAIProvider } from './providers/OpenAIProvider.mjs';
import { GeminiProvider } from './providers/GeminiProvider.mjs';
import { GroqProvider } from './providers/GroqProvider.mjs';
import { LocalFallbackProvider } from './providers/LocalFallbackProvider.mjs';
import { AIGateway } from './gateway/AIGateway.mjs';

export function createAIGateway(geminiApiKey) {
  const openAiKeys  = process.env.OPENAI_API_KEY  || '';
  const groqApiKey  = process.env.GROQ_API_KEY    || '';
  const useGroqFirst = process.env.USE_GROQ_FIRST === 'true';
  const useGeminiFirst = process.env.USE_GEMINI_FIRST === 'true';

  let primary = null;

  if (useGeminiFirst) {
    primary = new GeminiProvider(geminiApiKey);
    console.log(`🤖 AI Stack: Gemini (Primary) → Groq/OpenAI (Backup) → Local (Offline)`);
  } else if (openAiKeys && !useGroqFirst) {
    primary = new OpenAIProvider(openAiKeys);
    const keyCount = openAiKeys.split(',').filter(Boolean).length;
    console.log(`🤖 AI Stack: OpenAI/NVIDIA (${keyCount} keys, Primary) → Groq (Backup) → Gemini (Darurat) → Local (Offline)`);
  } else if (groqApiKey) {
    primary = new GroqProvider(groqApiKey);
    console.log(`🤖 AI Stack: Groq (Primary) → Gemini (Backup) → Local (Offline)`);
  } else {
    primary = new GeminiProvider(geminiApiKey);
    console.log(`🤖 AI Stack: Gemini (Primary) → Local (Offline)`);
  }

  const groq     = groqApiKey ? new GroqProvider(groqApiKey) : null;
  const gemini   = new GeminiProvider(geminiApiKey);
  const fallback = new LocalFallbackProvider();

  const backupProvider = useGroqFirst ? gemini : (groq || gemini);
  const thirdProvider  = useGroqFirst ? fallback : (groq ? gemini : fallback);

  return new AIGateway(primary, backupProvider, thirdProvider);
}

export { AIGateway, OpenAIProvider, GeminiProvider, GroqProvider, LocalFallbackProvider };
