import { z } from 'zod';

// ── Chat ────────────────────────────────────────────────────────────────────

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000).trim(),
});

export const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(['user', 'assistant']),
      parts: z
        .array(
          z.object({
            type: z.string(),
            text: z.string().max(4000).optional(),
          }),
        )
        .optional(),
      // Legacy format — AI SDK v6 may still send content-only messages
      content: z.string().max(4000).optional(),
    }),
  ),
  mode: z.enum(['coach', 'interviewer']),
  title: z.string().min(1).max(500),
  statement: z.string().min(1).max(20000),
  pattern: z.string().min(1).max(100),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  sessionId: z.string().optional(),
  currentCode: z.string().max(50000).optional(),
});

// ── Problem Notes ───────────────────────────────────────────────────────────

export const problemNotesSchema = z.object({
  notes: z.string().max(10000).trim(),
});

// ── Session Feedback ────────────────────────────────────────────────────────

export const sessionFeedbackSchema = z.object({
  strengths: z.string().max(2000).optional(),
  weaknesses: z.string().max(2000).optional(),
  suggestions: z.string().max(2000).optional(),
  complexityNote: z.string().max(2000).optional(),
});

// ── Guest ID ────────────────────────────────────────────────────────────────

export const guestIdSchema = z.object({
  guestId: z.string().min(1).max(100),
});

// ── Session Create ──────────────────────────────────────────────────────────

export const sessionCreateSchema = z.object({
  problemId: z.string().min(1).max(100),
  mode: z.enum(['SELF_PRACTICE', 'COACH_ME', 'MOCK_INTERVIEW']),
});

// ── Explain Request ─────────────────────────────────────────────────────────

export const explainRequestSchema = z.object({
  title: z.string().min(1).max(500),
  statement: z.string().min(1).max(20000),
  pattern: z.string().min(1).max(100),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
});

// ── Hint Request ────────────────────────────────────────────────────────────

export const hintRequestSchema = z.object({
  title: z.string().min(1).max(500),
  statement: z.string().min(1).max(20000),
  pattern: z.string().min(1).max(100),
  currentCode: z.string().max(50000).optional(),
  testResults: z.any().optional(),
  level: z.number().int().min(1).max(3),
  mode: z.string().optional(),
});

// ── Summary Request ─────────────────────────────────────────────────────────

export const summaryRequestSchema = z.object({
  title: z.string().min(1).max(500),
  pattern: z.string().min(1).max(100),
  finalCode: z.string().max(50000),
  testResults: z.any(),
  hintsUsed: z.number().int().min(0),
  timeSpentSeconds: z.number().int().min(0),
  mode: z.string().optional(),
});

// ── Helper: Validate request body ───────────────────────────────────────────

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; issues: z.ZodIssue[] };

/**
 * Parse and validate a request body against a Zod schema.
 * Returns a typed result suitable for early-return in route handlers.
 */
export function validateBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown,
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    issues: result.error.issues,
  };
}
