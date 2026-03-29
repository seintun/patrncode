import { prisma } from '@/lib/db/prisma';
import { UnauthorizedError, NotFoundError } from '@/lib/errors/api';

export async function validateSessionOwnership(sessionId: string, guestId: string) {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, guestId },
    select: { id: true, guestId: true, problemId: true },
  });

  if (!session) {
    throw new NotFoundError('Session not found or access denied');
  }

  return session;
}

export function requireOwnership(sessionId: string, guestId: string | null) {
  if (!guestId) throw new UnauthorizedError('Guest session is required');
  return validateSessionOwnership(sessionId, guestId);
}
