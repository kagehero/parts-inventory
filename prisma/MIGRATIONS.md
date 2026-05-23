# Database migrations — normalized schema

This project uses PostgreSQL with **Prisma Migrate** (recommended) or **`db push`** (prototyping only).

## Entities (logical)

| Logical name | Prisma models | PostgreSQL tables (`@@map`) |
|--------------|---------------|-----------------------------|
| **Part** | `Part` | `parts` |
| **Inventory log (in/out)** | `InventoryLog` | `inventory_logs` |
| **Order** | `Order`, `OrderLine` | `orders`, `order_lines` |
| **Customer** | `Customer` | `customers` |
| **Machine** | `Machine` | `machines` |
| **Usage history** | `UsageHistory`, `UsageHistoryLine` | `usage_histories`, `usage_history_lines` |
| **Repair history** | `RepairHistory` | `repair_histories` |
| Auth | `User` | `users` |

`InventoryLog` rows reference optional `OrderLine` (purchase receive) or `UsageHistoryLine` (usage out), or stand alone for adjustments.

`RepairHistory` stores `pdfUrl` (download path, e.g. `/api/repairs/{id}/file`) and `storedFileKey` (filename key under `UPLOAD_DIR`).

---

## New database (recommended)

1. Set `DATABASE_URL` in `.env`.
2. Create the first migration and apply it:

```bash
npx prisma migrate dev --name init_normalized
```

3. Seed:

```bash
npm run db:seed
```

4. Run the app:

```bash
npm run dev
```

---

## Production / CI (no prompts)

After committing migration SQL under `prisma/migrations/`:

```bash
npx prisma migrate deploy
npx prisma db seed   # if your pipeline should seed (often skipped in prod)
```

---

## Prototyping only (`db push`)

For a throwaway DB you can sync the schema **without** migration history:

```bash
npm run db:push
npm run db:seed
```

Do **not** use `db push` for production workflows where you need versioned DDL.

---

## Replacing an older schema version of this repo

Older iterations used tables such as `order_headers`, `stock_movements`, `outgoing_issues`, etc. This version uses new table names (`orders`, `inventory_logs`, `usage_histories`, …).

Options:

### A. Dev / empty data (simplest)

1. Backup if anything matters: `pg_dump …`
2. Drop and recreate the database (or schema), then:

```bash
npx prisma migrate dev --name init_normalized
npm run db:seed
```

### B. Preserve data

You must write **custom SQL** (or ETL) to migrate:

- Headers → `orders`, lines → `order_lines`
- Movements → `inventory_logs` with new `InventoryLogType` enum values (`PURCHASE_IN`, `USAGE_OUT`, `ADJUSTMENT` mapping from old enums)
- Outbound slips → `usage_histories` / `usage_history_lines`
- `repair_records` → `repair_histories` (`pdf_key` → `storedFileKey`, populate `pdfUrl`)

There is no automatic Prisma migrate for that path; engage DBA backup/restore discipline.

---

## Useful commands

```bash
npx prisma validate          # Schema only
npx prisma generate           # Regenerate Client
npx prisma studio             # Inspect data
npx prisma migrate status     # Pending migrations (deploy environments)
```

## Indexes (search-oriented)

Declared in `schema.prisma` for typical filters: part names/part numbers/compatibility text, customer name/municipality, machine identifiers, order supplier/date/status, inventory log type and time ordering, usage/repair searchable fields.

Adjust with further `@@index` / composite indexes once you analyze real queries (e.g. `EXPLAIN ANALYZE`).
