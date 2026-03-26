import { prisma } from '@/lib/db/prisma';

export async function getProblemBySlug(slug: string) {
  return await prisma.problem.findUnique({
    where: { slug },
  });
}

export async function getAllProblemsPublic() {
  return await prisma.problem.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      difficulty: true,
      pattern: true,
      updatedAt: true,
      sortOrder: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
  });
}
