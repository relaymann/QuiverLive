# Supabase PostgreSQL migration

SchoolStream's application database is Supabase PostgreSQL. Prisma remains the ORM. Clerk remains the identity provider, LiveKit remains the media/realtime service, and UploadThing remains the upload provider.

## Connection strings

Copy connection strings from the Supabase project dashboard rather than constructing them by hand.

- `DATABASE_URL`: Supabase **Transaction Pooler** connection string (port 6543), for application traffic on Vercel. Append `?pgbouncer=true` (or use `&pgbouncer=true` if the URL already has query parameters). With Prisma 5 and serverless functions, start with `connection_limit=1` unless load testing demonstrates that a larger per-instance pool is appropriate.
- `DIRECT_URL`: Supabase direct connection string (port 5432), or the **Session Pooler** connection string (port 5432) when the deployment environment cannot reach the direct IPv6 endpoint. Prisma Migrate uses this URL and must not use the transaction pooler.

Keep both values private. URL-encode special characters in the database password. Configure both variables in local `.env.local` and in Vercel. Do not prefix either variable with `NEXT_PUBLIC_`.

The Prisma datasource uses `DATABASE_URL` at runtime and `DIRECT_URL` for CLI migration operations.

## Initial schema baseline

The repository previously had no versioned Prisma migration history. Do not point `prisma migrate deploy` at Supabase until the initial migration has been generated, reviewed, committed, and tested against a disposable PostgreSQL database.

1. Configure `DATABASE_URL` and `DIRECT_URL` locally.
2. Run `npm ci`.
3. Run `npx prisma validate` and `npx prisma generate`.
4. Run `npm run db:generate-baseline`. This generates `prisma/migrations/20261118000000_init_postgresql/migration.sql` from the checked-in Prisma schema without connecting to a database.
5. Review the generated SQL. Confirm every model, unique constraint, index, relation, and cascade action is represented as expected.
6. Commit the generated SQL together with `prisma/migrations/migration_lock.toml`.
7. Test `npm run db:migrate:deploy` against a disposable Supabase/PostgreSQL database or a separate development project.
8. Only after the migration is reviewed and tested, apply it to the intended Supabase project with `npm run db:migrate:deploy`.

Never run the initial baseline against a database that already contains tables or records. If Supabase already has schema objects, inspect and reconcile them before applying migrations.

## Existing MySQL data

Changing the Prisma provider does not copy existing MySQL records into Supabase. The repository has not been given a MySQL connection or a database dump, so this conversion changes the application schema and SQL compatibility only. If the old database contains real users, channels, follows, or other records, plan and test a separate data export/import before switching traffic. Preserve IDs and unique identifiers so Clerk account mappings and related records remain valid.

## PostgreSQL compatibility changes

- The Prisma provider is now `postgresql`; PostgreSQL native `TEXT`, `VARCHAR`, and `DATE` mappings remain explicit where needed.
- PostgreSQL foreign keys are enabled through Prisma's default relation mode. Relation and cascade behavior is now enforced by PostgreSQL rather than only being emulated by Prisma Client.
- The MySQL-only full-text index declaration and MySQL full-text preview flags were removed. Current discovery search uses case-insensitive Prisma `contains` filters, not the unused MySQL full-text index.
- The `!watchtime` command now uses PostgreSQL `EXTRACT(EPOCH FROM ...)` timestamp arithmetic instead of MySQL `TIMESTAMPDIFF`.
- No Supabase Auth, Supabase Storage, or Supabase Realtime integration is introduced by this database conversion.

## Release gates

- [ ] Initial migration SQL generated, reviewed, committed, and tested on disposable PostgreSQL.
- [ ] Supabase transaction-pooler and direct/session-pooler connections verified separately.
- [ ] Vercel preview can connect through the transaction pooler without exhausting database connections.
- [ ] User provisioning, account deletion, follows, stream updates, rate limits, moderation records, watch sessions, and chat commands pass integration tests.
- [ ] `!watchtime` returns correct values on PostgreSQL, including active sessions and ended sessions.
- [ ] Case-insensitive creator/title search behaves as expected.
- [ ] Backup and restore procedure is verified before production data import.
- [ ] Any existing MySQL data has a separately tested migration plan.
