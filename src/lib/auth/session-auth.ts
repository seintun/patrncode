import { prisma } from '@/lib/db/prisma';

export async function validateSessionOwnership(sessionId: string, guestId: string) {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, guestId },
    select: { id: true, guestId: true, problemId: true },
  });

  if (!session) {
    throw new Error('SESSION_NOT_FOUND');
  }

  return session;
}

export function requireOwnership(sessionId: string, guestId: string | null) {
  if (!guestId) throw new Error('UNAUTHORIZED');
  return validateSessionOwnership(sessionId, guestId);
}
