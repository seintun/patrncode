#!/usr/bin/env bun

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@/generated/prisma/client';
import type { Difficulty, Pattern, Prisma } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { normalizePythonStarterCode } from '../src/lib/leetcode/mappers';

type SeedExample = {
  input: string;
  output: string;
  explanation?: string;
};

type SeedApproach = {
  name: string;
  description: string;
  complexity: string;
};

type SeedProblem = {
  leetcodeNumber: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  pattern: Pattern;
  tags: string[];
  constraints: string[];
  statement: string;
  examples: SeedExample[];
  starterCode: string;
  approaches: SeedApproach[] | null;
  hints: string[];
  externalUrl: string;
};

type ParseResult = {
  records: Array<{ index: number; data: SeedProblem }>;
  skipped: number;
};

type SeedStats = {
  totalRows: number;
  validRows: number;
  skippedRows: number;
  problemsCreated: number;
  problemsUpdated: number;
  testCasesCreated: number;
  testCasesUpdated: number;
  testCasesDeleted: number;
  hintsCreated: number;
  hintsUpdated: number;
  hintsDeleted: number;
};

const VALID_DIFFICULTIES = new Set<Difficulty>(['EASY', 'MEDIUM', 'HARD']);
const VALID_PATTERNS = new Set<Pattern>([
  'ARRAYS_STRINGS',
  'HASH_MAPS',
  'TWO_POINTERS',
  'SLIDING_WINDOW',
  'BINARY_SEARCH',
  'LINKED_LISTS',
  'STACKS_QUEUES',
  'TREES',
  'GRAPHS',
  'RECURSION_BACKTRACKING',
  'DYNAMIC_PROGRAMMING',
  'HEAPS',
  'SORTING',
  'GREEDY',
  'TRIES',
  'BIT_MANIPULATION',
  'INTERVALS',
  'ADVANCED_GRAPHS',
  'MATH_GEOMETRY',
  'PREFIX_SUM',
]);

type Args = {
  help: boolean;
  dryRun: boolean;
  filePath: string;
};

function printHelp(): void {
  console.log('Seed LeetCode dataset into Problem/TestCase/ProblemHint tables.');
  console.log('');
  console.log('Usage: bun scripts/seed-leetcode.ts [options]');
  console.log('');
  console.log('Options:');
  console.log('  --file <path>   Path to JSON dataset (default: data/neetcode150.json)');
  console.log('  --dry-run       Validate and parse only, no DB writes');
  console.log('  --help          Show this help message');
}

function parseArgs(argv: string[]): Args {
  let help = false;
  let dryRun = false;
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  let filePath = path.resolve(scriptDir, '../data/neetcode150.json');

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      help = true;
      continue;
    }

    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (arg === '--file' && argv[i + 1]) {
      filePath = path.resolve(process.cwd(), argv[i + 1]);
      i++;
      continue;
    }

    if (arg.startsWith('--')) {
      console.warn(`[warn] Ignoring unknown option: ${arg}`);
    }
  }

  return { help, dryRun, filePath };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim());
}

function normalizeExamples(value: unknown): SeedExample[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: SeedExample[] = [];
  for (const rawExample of value) {
    if (!isRecord(rawExample)) {
      continue;
    }

    const input = asString(rawExample.input);
    const output = asString(rawExample.output);
    const explanation = asString(rawExample.explanation);
    if (!input || !output) {
      continue;
    }

    normalized.push(explanation ? { input, output, explanation } : { input, output });
  }

  return normalized;
}

function normalizeApproaches(value: unknown): SeedApproach[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized: SeedApproach[] = [];
  for (const rawApproach of value) {
    if (!isRecord(rawApproach)) {
      continue;
    }

    const name = asString(rawApproach.name);
    const description = asString(rawApproach.description);
    const complexity = asString(rawApproach.complexity);

    if (!name || !description || !complexity) {
      continue;
    }

    normalized.push({ name, description, complexity });
  }

  return normalized.length > 0 ? normalized : null;
}

function parseSeedEntry(raw: unknown, index: number): SeedProblem | null {
  if (!isRecord(raw)) {
    console.warn(`[warn] Skipping row ${index + 1}: expected object entry`);
    return null;
  }

  const leetcodeNumber = typeof raw.leetcodeNumber === 'number' ? raw.leetcodeNumber : Number.NaN;
  const title = asString(raw.title);
  const slug = asString(raw.slug);
  const difficulty = asString(raw.difficulty) as Difficulty | null;
  const pattern = asString(raw.pattern) as Pattern | null;

  if (!Number.isInteger(leetcodeNumber) || (leetcodeNumber as number) <= 0) {
    console.warn(`[warn] Skipping row ${index + 1}: invalid leetcodeNumber`);
    return null;
  }

  if (!title || !slug) {
    console.warn(`[warn] Skipping row ${index + 1}: title/slug is missing`);
    return null;
  }

  if (!difficulty || !VALID_DIFFICULTIES.has(difficulty)) {
    console.warn(`[warn] Skipping ${slug}: invalid difficulty \`${String(raw.difficulty)}\``);
    return null;
  }

  if (!pattern || !VALID_PATTERNS.has(pattern)) {
    console.warn(`[warn] Skipping ${slug}: invalid pattern \`${String(raw.pattern)}\``);
    return null;
  }

  const examples = normalizeExamples(raw.examples);
  if (examples.length === 0) {
    console.warn(`[warn] Skipping ${slug}: no valid examples`);
    return null;
  }

  const externalUrl = asString(raw.externalUrl) ?? `https://leetcode.com/problems/${slug}/`;

  return {
    leetcodeNumber,
    title,
    slug,
    difficulty,
    pattern,
    tags: asStringArray(raw.tags),
    constraints: asStringArray(raw.constraints),
    statement: asString(raw.statement) ?? '',
    examples,
    starterCode: normalizePythonStarterCode(asString(raw.starterCode) ?? ''),
    approaches: normalizeApproaches(raw.approaches),
    hints: asStringArray(raw.hints),
    externalUrl,
  };
}

async function readDataset(filePath: string): Promise<ParseResult> {
  const content = await readFile(filePath, 'utf-8');
  const parsed = JSON.parse(content) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('Dataset root must be a JSON array');
  }

  const records: Array<{ index: number; data: SeedProblem }> = [];
  let skipped = 0;

  for (let i = 0; i < parsed.length; i++) {
    const entry = parseSeedEntry(parsed[i], i);
    if (!entry) {
      skipped++;
      continue;
    }

    records.push({ index: i, data: entry });
  }

  return { records, skipped };
}

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required (or run with --dry-run)');
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const { records, skipped } = await readDataset(args.filePath);
  const stats: SeedStats = {
    totalRows: records.length + skipped,
    validRows: records.length,
    skippedRows: skipped,
    problemsCreated: 0,
    problemsUpdated: 0,
    testCasesCreated: 0,
    testCasesUpdated: 0,
    testCasesDeleted: 0,
    hintsCreated: 0,
    hintsUpdated: 0,
    hintsDeleted: 0,
  };

  console.log(`Loaded ${stats.totalRows} row(s) from ${args.filePath}`);
  console.log(`Valid: ${stats.validRows}, Skipped: ${stats.skippedRows}`);

  if (args.dryRun) {
    console.log('[dry-run] Dataset parsed successfully. No database changes made.');
    return;
  }

  const prisma = createPrismaClient();

  try {
    for (let recordIndex = 0; recordIndex < records.length; recordIndex++) {
      const { data } = records[recordIndex];
      const order = recordIndex + 1;
      const existing = await prisma.problem.findUnique({
        where: { slug: data.slug },
        select: { id: true },
      });

      const problem = await prisma.problem.upsert({
        where: { slug: data.slug },
        create: {
          title: data.title,
          slug: data.slug,
          difficulty: data.difficulty,
          pattern: data.pattern,
          tags: data.tags,
          constraints: data.constraints,
          statement: data.statement,
          examples: data.examples as Prisma.InputJsonValue,
          starterCode: data.starterCode,
          approaches: data.approaches as Prisma.InputJsonValue,
          sourceType: 'EXTERNAL',
          leetcodeNumber: data.leetcodeNumber,
          externalUrl: data.externalUrl,
          isCurated: true,
          curatedOrder: order,
        },
        update: {
          title: data.title,
          difficulty: data.difficulty,
          pattern: data.pattern,
          tags: data.tags,
          constraints: data.constraints,
          statement: data.statement,
          examples: data.examples as Prisma.InputJsonValue,
          starterCode: data.starterCode,
          approaches: data.approaches as Prisma.InputJsonValue,
          sourceType: 'EXTERNAL',
          leetcodeNumber: data.leetcodeNumber,
          externalUrl: data.externalUrl,
          isCurated: true,
          curatedOrder: order,
        },
      });

      if (existing) {
        stats.problemsUpdated++;
      } else {
        stats.problemsCreated++;
      }

      for (let i = 0; i < data.examples.length; i++) {
        const example = data.examples[i];
        const testCaseOrder = i + 1;

        const existingTestCase = await prisma.testCase.findFirst({
          where: { problemId: problem.id, order: testCaseOrder, isHidden: false },
          select: { id: true },
        });

        if (existingTestCase) {
          await prisma.testCase.update({
            where: { id: existingTestCase.id },
            data: {
              input: example.input,
              expected: example.output,
              isHidden: false,
              order: testCaseOrder,
            },
          });
          stats.testCasesUpdated++;
        } else {
          await prisma.testCase.create({
            data: {
              problemId: problem.id,
              input: example.input,
              expected: example.output,
              isHidden: false,
              order: testCaseOrder,
            },
          });
          stats.testCasesCreated++;
        }
      }

      const deletedTestCases = await prisma.testCase.deleteMany({
        where: {
          problemId: problem.id,
          isHidden: false,
          order: { gt: data.examples.length },
        },
      });
      stats.testCasesDeleted += deletedTestCases.count;

      const hintSet = data.hints.slice(0, 3);
      for (let i = 0; i < hintSet.length; i++) {
        const level = i + 1;

        const existingHint = await prisma.problemHint.findUnique({
          where: { problemId_level: { problemId: problem.id, level } },
          select: { id: true },
        });

        await prisma.problemHint.upsert({
          where: { problemId_level: { problemId: problem.id, level } },
          create: {
            problemId: problem.id,
            level,
            content: hintSet[i],
            source: 'leetcode',
          },
          update: {
            content: hintSet[i],
            source: 'leetcode',
          },
        });

        if (existingHint) {
          stats.hintsUpdated++;
        } else {
          stats.hintsCreated++;
        }
      }

      const deletedHints = await prisma.problemHint.deleteMany({
        where: {
          problemId: problem.id,
          source: 'leetcode',
          level: { gt: hintSet.length, lte: 3 },
        },
      });
      stats.hintsDeleted += deletedHints.count;
    }

    console.log('');
    console.log('Seed complete.');
    console.log(`Problems  +${stats.problemsCreated} created, ~${stats.problemsUpdated} updated`);
    console.log(
      `TestCases +${stats.testCasesCreated} created, ~${stats.testCasesUpdated} updated, -${stats.testCasesDeleted} removed`,
    );
    console.log(
      `Hints     +${stats.hintsCreated} created, ~${stats.hintsUpdated} updated, -${stats.hintsDeleted} removed`,
    );
    console.log(`Rows      ${stats.validRows} processed, ${stats.skippedRows} skipped`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[error] Seed failed:', error);
  process.exit(1);
});
