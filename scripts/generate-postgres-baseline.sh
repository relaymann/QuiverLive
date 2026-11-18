#!/usr/bin/env bash
set -euo pipefail

migration_name="20261118000000_init_postgresql"
migration_dir="prisma/migrations/${migration_name}"

if [[ -e "${migration_dir}/migration.sql" ]]; then
  echo "Refusing to overwrite ${migration_dir}/migration.sql" >&2
  exit 1
fi

mkdir -p "${migration_dir}"
if ! npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > "${migration_dir}/migration.sql"; then
  rm -f "${migration_dir}/migration.sql"
  rmdir "${migration_dir}" 2>/dev/null || true
  exit 1
fi

if [[ ! -s "${migration_dir}/migration.sql" ]]; then
  echo "Prisma generated an empty migration; refusing to continue." >&2
  rm -f "${migration_dir}/migration.sql"
  rmdir "${migration_dir}" 2>/dev/null || true
  exit 1
fi

echo "Generated ${migration_dir}/migration.sql"
echo "Review and commit this SQL before applying it to Supabase."
