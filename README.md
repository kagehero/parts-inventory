# Parts inventory & operations (部品在庫・業務管理)

Production-oriented MVP for tracking parts, purchase orders and receiving, outbound usage, customers, owned machines, and repair records (PDF). The UI is oriented toward Japanese office workflows; copy and date formatting use `ja-JP`.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **PostgreSQL** via **Prisma**
- **Tailwind CSS**, **shadcn-style** UI (Radix primitives + CVA), **Framer Motion** (light transitions)
- **NextAuth.js v5** (Auth.js) — credentials + JWT sessions

## Prerequisites

- Node.js 20+ recommended
- A PostgreSQL instance reachable from the app (local, Docker, Neon, Supabase, etc.)

## Quick start

```bash
npm install
cp .env.example .env
# Edit .env — set DATABASE_URL, AUTH_SECRET, and AUTH_URL as needed

# Preferred: versioned migrations
npx prisma migrate dev --name init_normalized

# Or prototype only (no migration files):
# npm run db:push

npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with the seeded accounts (see below) or create users in the database.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (with `?schema=public` if you use schemas) |
| `AUTH_SECRET` | Secret for encrypting sessions (e.g. `openssl rand -base64 32`) |
| `AUTH_URL` | Canonical app URL (production: your HTTPS origin) |
| `UPLOAD_DIR` | Directory for repair PDFs (default `./storage/repairs`) |
| `SEED_ADMIN_PASSWORD` | Optional seed password; default is `changeme123` if unset |
| `ALLOW_IPS` | Optional comma-separated allowlist (not wired in this MVP; reserved) |

Do not commit `.env`. Use `.env.example` as reference.

## NPM scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run db:push` | Push schema without migration history (dev/prototype only; prefer migrate) |
| `npx prisma migrate dev` | Create & apply migrations (see `prisma/MIGRATIONS.md`) |
| `npm run db:seed` | Seed demo users and sample data |
| `npm run db:studio` | Prisma Studio |

## Seeded users (after `db:seed`)

- `admin@example.com` — role `ADMIN`
- `user@example.com` — role `USER`

Default password (unless `SEED_ADMIN_PASSWORD` is set): **`changeme123`**

Change passwords in production (update `User.passwordHash` with bcrypt or extend the app with a password-change flow).

## Application structure (high level)

- `src/app/` — App Router routes: `/login`, `/dashboard/*`, API routes for auth, PDF upload, PDF download
- `src/features/*/actions.ts` — Server actions (mutations, guarded with `guardAction`)
- `prisma/schema.prisma` — Normalized data model: **Part**, **InventoryLog**, **Order** / **OrderLine**, **Customer**, **Machine**, **UsageHistory** / **UsageHistoryLine**, **RepairHistory** (+ **User** for login)
- `prisma/MIGRATIONS.md` — Migration workflow, production `migrate deploy`, and upgrade notes from older table names
- `storage/repairs/` — Default local storage for uploaded PDFs (gitignored under normal setup)

## Operational notes

- **Dashboard routes** use `force-dynamic` so `next build` does not require a live database at compile time.
- **Repair PDFs** are stored on disk under `UPLOAD_DIR`. For multi-instance hosting, point this to shared object storage or replace the upload layer with S3-compatible APIs.
- **Concurrency** is modest (target ~2 simultaneous users); heavier load will need connection pooling and tuning.

## License

Private / unlicensed unless you add a `LICENSE` file.
