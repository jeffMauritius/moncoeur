# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MonCoeur is a French-language luxury secondhand bag resale management app. It tracks the full lifecycle: purchasing bags from platforms (Vinted, Vestiaire Collectif, Le Bon Coin), refurbishing, and reselling with automatic margin tracking. Two roles: admin and seller.

## Commands

```bash
pnpm dev          # Start all apps (web on port 3000)
pnpm dev:web      # Start only the Next.js app
pnpm build        # Build all apps
pnpm build:web    # Build only web
pnpm lint         # Lint all apps
```

No test suite is actively used. Jest is configured but has minimal coverage.

## Architecture

**Monorepo** (pnpm workspaces):
- `apps/web/` — Primary Next.js 14 (App Router) application with API routes
- `apps/api/` — NestJS backend (scaffolded, not actively used)
- `packages/shared/` — Shared TypeScript types and constants (brands, platforms, conditions, statuses, roles)

### Tech Stack
- **UI**: shadcn/ui + Radix UI + Tailwind CSS + Lucide icons
- **Database**: MongoDB Atlas via Mongoose ODM
- **Auth**: NextAuth.js v5 (beta) with Credentials provider, JWT strategy (24h), edge-compatible middleware config in `auth.config.ts`
- **File storage**: Vercel Blob (bag photos)
- **Email**: ZeptoMail API
- **Charts**: Recharts

### Key Directories (within `apps/web/src/`)
- `app/(dashboard)/` — Protected pages (stock, sales, bank-accounts, users, settings)
- `app/api/` — RESTful API routes (bags, sales, users, bank-accounts, upload, export)
- `components/ui/` — shadcn/ui components
- `lib/auth/` — NextAuth config split: `auth.config.ts` (edge-safe) and `index.ts` (full with Mongoose)
- `lib/db/models/` — Mongoose models (User, Bag, Sale, BankAccount)
- `lib/db/mongodb.ts` — Cached MongoDB connection (global singleton for hot-reload)

### Path Alias
`@/*` maps to `./src/*` in the web app.

## Key Patterns

**Mongoose model registration** — Always use the guard pattern to avoid hot-reload errors:
```typescript
const Model = mongoose.models.Name || mongoose.model('Name', Schema);
```

**API routes** — All use `export const dynamic = 'force-dynamic'` and check auth via `await auth()`. Standard JSON responses with `{ error: string }` on failure.

**Sale model hooks** — Pre-save calculates margin/marginPercent. Post-save updates the associated Bag status to "vendu".

**Bag references** — Auto-generated in format `MC-YYYY-NNNNN` via pre-save hook.

**Middleware** — Edge runtime, uses only `auth.config.ts` (no Mongoose). Protects all routes except `/login`, `/api/auth`, `/api/seed`, `/api/seed-excel`, `/api/fix-dates`, and static assets. Admin-only enforcement for `/users` and `/bank-accounts`.

**Frontend data fetching** — Client-side with `useState` + `useEffect` + `fetch` to API routes. No server components for data fetching.

**All UI text is in French.**

## Environment Variables

Required in `.env.local` (copy from `.env.example`):
- `MONGODB_URI` — MongoDB Atlas connection string
- `NEXTAUTH_SECRET` / `AUTH_SECRET` — NextAuth secret
- `NEXTAUTH_URL` — App URL (http://localhost:3000 for dev)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token for photo uploads
- `ZEPTOMAIL_API_KEY`, `ZEPTOMAIL_FROM_EMAIL`, `ZEPTOMAIL_FROM_NAME` — Email service

## Seeding

Visit `/api/seed` to create initial users:
- nadia@moncoeur.app / password (admin)
- jeff@moncoeur.app / password (admin)
- jeannette@moncoeur.app / password (seller)
