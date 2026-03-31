import { createOpenAI } from '@ai-sdk/openai';

const openaiBase = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: (() => {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      throw new Error('OPENROUTER_API_KEY is not set. Please check your environment variables.');
    }
    return key;
  })(),
});

// OpenRouter doesn't support the Responses API (v3 default).
// Force chat completions via .chat() so all routes stay on /v1/chat/completions.
export const openrouter = Object.assign((modelId: string) => openaiBase.chat(modelId), {
  chat: openaiBase.chat,
  completion: openaiBase.completion,
  responses: () => {
    throw new Error(
      'OpenRouter does not support the Responses API. Use .chat() or .completion() instead.',
    );
  },
  embedding: openaiBase.embedding,
  image: openaiBase.image,
  speech: openaiBase.speech,
});

// ── Model Tiering ───────────────────────────────────────────────────────────

type Tier = 'FREE' | 'PREMIUM';

const MODEL_FREE = process.env.OPENROUTER_MODEL_FREE ?? 'x-ai/grok-4.1-fast';
const MODEL_PREMIUM = process.env.OPENROUTER_MODEL_PREMIUM ?? 'x-ai/grok-4.1-fast';

/**
 * Resolve the AI model for a given subscription tier and purpose.
 * Falls back to legacy AI_MODEL_REASONING / AI_MODEL_SUMMARY env vars.
 */
export function getModelForTier(
  tier: Tier,
  purpose: 'reasoning' | 'summary' = 'reasoning',
): string {
  const legacyEnv = process.env[`AI_MODEL_${purpose.toUpperCase()}` as const];
  if (tier === 'PREMIUM') {
    return process.env.OPENROUTER_MODEL_PREMIUM ?? legacyEnv ?? MODEL_PREMIUM;
  }
  return process.env.OPENROUTER_MODEL_FREE ?? legacyEnv ?? MODEL_FREE;
}

/**
 * Get an OpenRouter model instance for a given tier.
 */
export function openrouterForTier(tier: Tier, purpose: 'reasoning' | 'summary' = 'reasoning') {
  return openrouter(getModelForTier(tier, purpose));
}
