-- Create GIN trigram indexes without taking long write locks.
-- NOTE: CREATE INDEX CONCURRENTLY must run outside a transaction block.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "problem_title_trgm"
  ON "Problem" USING gin (title gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "problem_statement_trgm"
  ON "Problem" USING gin (statement gin_trgm_ops);
