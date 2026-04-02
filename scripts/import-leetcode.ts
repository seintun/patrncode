#!/usr/bin/env bun

import { PrismaClient } from '@/generated/prisma/client';
import type { Prisma } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { fetchLeetCodeProblem, fetchLeetCodeSlugByFrontendId } from '../src/lib/leetcode/graphql';
import {
  mapLeetCodeTagsToPattern,
  mapDifficulty,
  extractExamples,
  extractStatement,
  extractConstraints,
  getPythonStarterCode,
  buildExternalUrl,
} from '../src/lib/leetcode/mappers';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is required.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const DEFAULT_NEETCODE_150_LIST_URL =
  'https://raw.githubusercontent.com/krmanik/Anki-NeetCode/main/neetcode-150-list.json';

function parseArgs(): {
  slug?: string;
  id?: string;
  neetcode150: boolean;
  listUrl: string;
} {
  const args = process.argv.slice(2);
  const result: {
    slug?: string;
    id?: string;
    neetcode150: boolean;
    listUrl: string;
  } = {
    neetcode150: false,
    listUrl: DEFAULT_NEETCODE_150_LIST_URL,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug' && args[i + 1]) {
      result.slug = args[i + 1];
      i++;
    } else if (args[i] === '--id' && args[i + 1]) {
      result.id = args[i + 1];
      i++;
    } else if (args[i] === '--neetcode150') {
      result.neetcode150 = true;
    } else if (args[i] === '--list-url' && args[i + 1]) {
      result.listUrl = args[i + 1];
      i++;
    }
  }

  return result;
}

function extractSlugFromLeetCodeUrl(url: string): string | null {
  const match = url.match(/^https?:\/\/leetcode\.com\/problems\/([^/]+)\/?$/i);
  return match?.[1] ?? null;
}

async function fetchNeetCode150Slugs(listUrl: string): Promise<string[]> {
  const response = await fetch(listUrl, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch NeetCode list: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as Record<string, Record<string, { url?: string }>>;
  const slugs = new Set<string>();

  for (const category of Object.values(data)) {
    for (const problem of Object.values(category)) {
      const url = typeof problem?.url === 'string' ? problem.url : '';
      const slug = extractSlugFromLeetCodeUrl(url);
      if (slug) {
        slugs.add(slug);
      }
    }
  }

  return Array.from(slugs);
}

async function importProblemBySlug(resolvedSlug: string, curatedOrder?: number): Promise<void> {
  console.log(`Fetching LeetCode problem: ${resolvedSlug}...`);

  const question = await fetchLeetCodeProblem(resolvedSlug);
  console.log(`  Found: ${question.title} (LC #${question.questionFrontendId})`);

  const content = question.content ?? '';
  const topicTags = question.topicTags ?? [];
  const codeSnippets = question.codeSnippets ?? [];
  const hints = question.hints ?? [];
  if (!question.content) {
    console.warn('  ! Problem content unavailable (likely locked). Importing metadata only.');
  }
  const pattern = mapLeetCodeTagsToPattern(topicTags);
  const difficulty = mapDifficulty(question.difficulty);
  const examples = extractExamples(content);
  const statement = extractStatement(content);
  const constraints = extractConstraints(content);
  const starterCode = getPythonStarterCode(codeSnippets);
  const parsedFrontendId = Number.parseInt(question.questionFrontendId, 10);
  const leetcodeNumber = Number.isFinite(parsedFrontendId) ? parsedFrontendId : null;
  const externalUrl = buildExternalUrl(resolvedSlug);

  await prisma.$transaction(async (tx) => {
    // Upsert problem
    const upserted = await tx.problem.upsert({
      where: { slug: resolvedSlug },
      create: {
        title: question.title,
        slug: resolvedSlug,
        difficulty,
        pattern,
        tags: topicTags.map((t) => t.name),
        constraints,
        sourceType: 'EXTERNAL',
        leetcodeNumber,
        externalUrl,
        statement,
        examples: examples as unknown as Prisma.InputJsonValue,
        starterCode,
        isCurated: true,
        curatedOrder,
      },
      update: {
        title: question.title,
        difficulty,
        pattern,
        tags: topicTags.map((t) => t.name),
        constraints,
        leetcodeNumber,
        externalUrl,
        statement,
        examples: examples as unknown as Prisma.InputJsonValue,
        starterCode,
        isCurated: true,
        curatedOrder,
      },
    });

    console.log(`  ✓ Problem upserted: ${upserted.id}`);

    // Replace visible test cases from examples in bulk.
    await tx.testCase.deleteMany({
      where: { problemId: upserted.id, isHidden: false },
    });
    if (examples.length > 0) {
      await tx.testCase.createMany({
        data: examples.map((example, index) => ({
          problemId: upserted.id,
          input: example.input,
          expected: example.output,
          isHidden: false,
          order: index + 1,
        })),
      });
    }
    console.log(`  ✓ ${examples.length} test cases upserted`);

    // Replace top 3 LeetCode hints to avoid stale rows.
    const topHints = hints.slice(0, 3);
    await tx.problemHint.deleteMany({
      where: { problemId: upserted.id, source: 'leetcode' },
    });
    if (topHints.length > 0) {
      await tx.problemHint.createMany({
        data: topHints.map((content, index) => ({
          problemId: upserted.id,
          level: index + 1,
          content,
          source: 'leetcode',
        })),
      });
    }

    return upserted;
  });

  const topHints = hints.slice(0, 3);
  console.log(`  ✓ ${topHints.length} hints upserted`);

  console.log(`Done! Imported: ${question.title} (LC #${leetcodeNumber})`);
}

async function main() {
  const { slug, id, neetcode150, listUrl } = parseArgs();

  if (!slug && !id && !neetcode150) {
    console.error('Usage: bun scripts/import-leetcode.ts --slug <problem-slug>');
    console.error('       bun scripts/import-leetcode.ts --id <leetcode-id>');
    console.error('       bun scripts/import-leetcode.ts --neetcode150 [--list-url <json-url>]');
    process.exit(1);
  }

  const modeCount = [Boolean(slug), Boolean(id), neetcode150].filter(Boolean).length;
  if (modeCount > 1) {
    console.error('Use exactly one mode: --slug, --id, or --neetcode150.');
    process.exit(1);
  }

  if (neetcode150) {
    console.log(`Fetching NeetCode 150 list from: ${listUrl}`);
    const slugs = await fetchNeetCode150Slugs(listUrl);

    if (slugs.length === 0) {
      console.error('No LeetCode slugs found in NeetCode list source.');
      process.exit(1);
    }

    console.log(`Found ${slugs.length} unique slugs. Starting import...`);

    let succeeded = 0;
    const failed: Array<{ slug: string; error: string }> = [];

    for (let i = 0; i < slugs.length; i++) {
      const currentSlug = slugs[i];
      console.log(`\n[${i + 1}/${slugs.length}] ${currentSlug}`);
      try {
        await importProblemBySlug(currentSlug, i + 1);
        succeeded++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        failed.push({ slug: currentSlug, error: message });
        console.error(`  ✗ Failed: ${message}`);
      }
    }

    console.log('\n=== Import Summary ===');
    console.log(`Succeeded: ${succeeded}`);
    console.log(`Failed: ${failed.length}`);
    if (failed.length > 0) {
      console.log('Failures:');
      for (const item of failed) {
        console.log(`  - ${item.slug}: ${item.error}`);
      }
      process.exit(1);
    }

    return;
  }

  let resolvedSlug = slug;

  if (!resolvedSlug && id) {
    const trimmedId = id.trim();
    if (!/^\d+$/.test(trimmedId)) {
      console.error(`Invalid --id value: ${id}. Expected a numeric LeetCode frontend ID.`);
      process.exit(1);
    }

    console.log(`Resolving LeetCode ID ${trimmedId} to slug...`);
    resolvedSlug = (await fetchLeetCodeSlugByFrontendId(trimmedId)) ?? undefined;

    if (!resolvedSlug) {
      console.error(
        `Could not resolve LeetCode ID ${trimmedId} to a slug. Try: bun scripts/import-leetcode.ts --slug <problem-slug>`,
      );
      process.exit(1);
    }

    console.log(`  Found slug: ${resolvedSlug}`);
  }

  if (!resolvedSlug) {
    console.error('Failed to determine problem slug for import.');
    process.exit(1);
  }

  await importProblemBySlug(resolvedSlug);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
