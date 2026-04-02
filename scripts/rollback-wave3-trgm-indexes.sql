-- Roll back trigram indexes created in wave 3.
-- Usage: psql "$DATABASE_URL" -f scripts/rollback-wave3-trgm-indexes.sql

DROP INDEX CONCURRENTLY IF EXISTS "problem_title_trgm";
DROP INDEX CONCURRENTLY IF EXISTS "problem_statement_trgm";
