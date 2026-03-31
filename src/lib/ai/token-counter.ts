import { prisma } from '@/lib/db/prisma';
import { TOKEN_LIMITS, TOKEN_ESTIMATE_PER_MESSAGE } from '@/lib/config';

interface TokenCheckResult {
  allowed: boolean;
  tokensUsed: number;
  tokenLimit: number;
  remaining: number;
}

/**
 * Check if a guest has remaining token budget for a session.
 */
export async function checkTokenBudget(guestId: string): Promise<TokenCheckResult> {
  const profile = await prisma.userProfile.findUnique({
    where: { guestId },
    select: { tier: true, tokensUsed: true, tokenLimit: true },
  });

  // If no profile yet, use FREE defaults
  const tier = profile?.tier ?? 'FREE';
  const tokensUsed = profile?.tokensUsed ?? 0;
  const tokenLimit = profile?.tokenLimit ?? TOKEN_LIMITS[tier];

  return {
    allowed: tokensUsed + TOKEN_ESTIMATE_PER_MESSAGE <= tokenLimit,
    tokensUsed,
    tokenLimit,
    remaining: Math.max(0, tokenLimit - tokensUsed),
  };
}

/**
 * Record token usage after an AI response completes.
 */
export async function recordTokenUsage(guestId: string, tokensUsed: number): Promise<void> {
  await prisma.userProfile.upsert({
    where: { guestId },
    update: {
      tokensUsed: { increment: tokensUsed },
      lastActivityAt: new Date(),
    },
    create: {
      guestId,
      tokensUsed,
      lastActivityAt: new Date(),
    },
  });
}
