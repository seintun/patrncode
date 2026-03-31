export const MODELS = {
  reasoning: process.env.AI_MODEL_REASONING || 'x-ai/grok-4.1-fast',
  summary: process.env.AI_MODEL_SUMMARY || 'x-ai/grok-4.1-fast',
} as const;
