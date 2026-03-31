import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Ordered list of slugs to curate (curatedOrder = index + 1)
// For now, curate all existing problems. Expand this list as more problems are added.
const curatedSlugs = [
  'two-sum',
  'valid-anagram',
  'group-anagrams',
  'best-time-to-buy-and-sell-stock',
  'maximum-subarray',
  'valid-palindrome',
  'binary-search',
  'longest-substring-without-repeating-characters',
  // Add more slugs as problems are seeded
];

async function main() {
  console.log('Curating SophoCode 75 problems...');

  // Clear all curation first
  await prisma.problem.updateMany({
    data: { isCurated: false, curatedOrder: null },
  });

  let curated = 0;
  for (let i = 0; i < curatedSlugs.length; i++) {
    const result = await prisma.problem.updateMany({
      where: { slug: curatedSlugs[i] },
      data: { isCurated: true, curatedOrder: i + 1 },
    });
    if (result.count > 0) {
      curated++;
      console.log(`  ✓ #${i + 1}: ${curatedSlugs[i]}`);
    } else {
      console.log(`  ✗ #${i + 1}: ${curatedSlugs[i]} (not found)`);
    }
  }

  console.log(`\nCurated ${curated} problems (target: 75).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
