import { prisma } from '@/lib/db/prisma';

export async function migrateGuestData(userId: string): Promise<void> {
  'use server';

  await prisma.$transaction([
    prisma.session.updateMany({
      where: { userId: null },
      data: { userId },
    }),
    prisma.userProblemState.updateMany({
      where: { userId: null },
      data: { userId },
    }),
  ]);
}
