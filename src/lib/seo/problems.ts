import { prisma } from '@/lib/db/prisma';

export async function getProblemBySlug(slug: string) {
  // Use findFirst instead of findUnique to avoid Prisma 7.x query compiler
  // panic (PrismaClientRustPanicError) when calls are batched with driver adapters.
  // See: https://github.com/prisma/prisma/issues/new (selection.rs:218 panic)
  return await prisma.problem.findFirst({
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
