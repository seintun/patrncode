-- Search + hot-path performance improvements

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Support ILIKE/fuzzy title/statement search in GET /api/problems
CREATE INDEX IF NOT EXISTS "problem_title_trgm"
ON "Problem" USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "problem_statement_trgm"
ON "Problem" USING gin (statement gin_trgm_ops);

-- Support latest-session lookup per problem for a guest
CREATE INDEX IF NOT EXISTS "Session_guestId_problemId_startedAt_idx"
ON "Session" ("guestId", "problemId", "startedAt" DESC);

-- Support visible test-case reads/deletes by problem
CREATE INDEX IF NOT EXISTS "TestCase_problemId_isHidden_order_idx"
ON "TestCase" ("problemId", "isHidden", "order");

-- Support hint replacement/deletes by source
CREATE INDEX IF NOT EXISTS "ProblemHint_problemId_source_idx"
ON "ProblemHint" ("problemId", source);
