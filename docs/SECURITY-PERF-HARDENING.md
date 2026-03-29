# Technical Documentation: Security Audit & Performance Hardening

This document outlines the architectural changes, design decisions, and implementation details of the security and performance hardening phase for Sophocode.

## Overview

The primary goal was to transition from a client-side identity model to a secure, server-managed model while optimizing the application for scale and speed.

## 🏗️ Architectural Refactoring & Modularity

Following the initial implementation, a pragmatic refactoring was conducted to ensure the codebase is modular, dry, and easy to maintain.

### 1. API Higher-Order Components (HOCs)

- **Problem**: Repetitive logic for cookie extraction, null-checks, and parameter validation in every route handler.
- **Solution**: Centralized utilities in `src/lib/errors/api.ts` and `src/lib/ratelimit.ts`.
- **Implementation**:
  - `withAuth`: Injects `guestId` into handlers, handling 401 Unauthorized automatically.
  - `withValidIdParams`: Validates CUID/UUID parameters before handler execution.
  - `withAuthAndId`: Combined HOC for routes needing both authentication and identifier validation.
  - `withRateLimit`: Wraps AI endpoints to apply Upstash Redis protection with zero boilerplate in the route itself.

### 2. Modular Pyodide Worker

- **Refactoring**: Decoupled the worker message handler into functional units:
  - `normalize()`: Standardizes Python types for comparison.
  - `cleanError()`: Truncates tracebacks and adjusts line numbers for user-friendly errors.
  - `runTestCase()`: Isolated execution logic for single-unit testing within the worker.

## 🛡️ Security Implementation

### 1. Server-Side Identity (Guest Identity)

- **Problem**: Previously used `localStorage` for `guestId`, which is susceptible to XSS and client-side manipulation.
- **Solution**: Migrated to server-generated `httpOnly` cookies managed via Next.js Proxy/Middleware.
- **Implementation**:
  - `src/proxy.ts`: Consolidates Supabase session refresh and `sophocode_guest` cookie injection.
  - `src/lib/guest.ts`: Logic for cookie retrieval and `crypto.randomUUID()` generation.

### 2. Session Ownership & Authorization

- **Implementation**:
  - `src/lib/auth/session-auth.ts`: `requireOwnership(sessionId, guestId)` checks the database before allowing updates or reads.
  - Integrated seamlessly via `withAuthAndId`.

### 3. Identifier Validation

- **Implementation**: Robust regex validation for both standard UUIDs and Prisma CUIDs (`/^[a-z0-9]{20,36}$/i`).

### 4. Granular Rate Limiting

- **Implementation**: Upstash Redis rate limiting (20 req/min).
- **Design Decision**: Added a `fallback_ratelimit_${crypto.randomUUID()}` for requests without a detectable IP to prevent shared bucket collisions.

### 5. Standardized Error Handling

- **Implementation**: Custom Error classes (`UnauthorizedError`, `NotFoundError`, etc.) mapped to HTTP statuses via `handleApiError`.

### 6. Content Security Policy (CSP)

- **Implementation**: Added comprehensive headers in `next.config.ts` (Report-Only).
- **Update**: Added `'unsafe-eval'` to support Monaco Editor and React 19 dev tools.

## 🚀 Performance Hardening

### 1. Pyodide WASM Preloading

- **Mechanism**: The `prewarmWorker()` function is triggered on the Problem Detail page mount to initialize the environment in the background.

### 2. Tiered API Caching

- **Public Data** (Problems): 5m fresh, 1h stale (shared).
- **Private Data** (Progress/Mastery): 5m fresh, 1h stale (private browser cache).

### 3. Data Transfer Optimization

- **Solution**: Explicit `select` statements in Prisma queries to reduce payload size (e.g., only selecting necessary fields for problem statements).

### 4. Incremental Static Regeneration (ISR)

- **Implementation**: Hourly revalidation for all problem pages using `generateStaticParams()`.

### 5. Build System & Environments

- **Decision**: Added a build-time fallback for `DATABASE_URL` in `prisma.config.ts` to support Vercel/CI builds before secrets are provisioned.

## 🧪 Verification Results

- **Unit Tests**: 181 passed.
- **Build**: Successful production build using Turbopack.
- **Modularity**: Reduced route handler boilerplate by ~50%.
