#!/usr/bin/env bash
# Reset geographic + sections + parties + organizations to the 2026 state
# without dropping `people`. Drops people→sections/streams FKs temporarily
# so that the cascade truncate doesn't take people with it.
#
# Requires: DATABASE_URL or PGHOST/PGDATABASE/PGUSER env, plus `npm run seed:run`
# working locally. Expects sections.csv already regenerated.

set -euo pipefail

: "${PSQL:=psql}"
: "${DB:=ti_broish}"

PSQL_CMD=(docker exec -i api-ti-broish-db-1 psql -U postgres -d "$DB")

echo "==> dropping people FKs"
"${PSQL_CMD[@]}" <<'SQL'
ALTER TABLE people DROP CONSTRAINT IF EXISTS people_section_id_fkey;
ALTER TABLE people DROP CONSTRAINT IF EXISTS people_stream_id_fkey;
ALTER TABLE people DROP CONSTRAINT IF EXISTS people_organization_id_fkey;
SQL

echo "==> truncating geo + parties + seed history"
"${PSQL_CMD[@]}" <<'SQL'
TRUNCATE TABLE election_regions_municipalities RESTART IDENTITY CASCADE;
TRUNCATE TABLE sections RESTART IDENTITY CASCADE;
DROP TABLE IF EXISTS sections_seed;
TRUNCATE TABLE city_regions RESTART IDENTITY CASCADE;
TRUNCATE TABLE towns RESTART IDENTITY CASCADE;
TRUNCATE TABLE election_regions RESTART IDENTITY CASCADE;
TRUNCATE TABLE municipalities RESTART IDENTITY CASCADE;
TRUNCATE TABLE countries RESTART IDENTITY CASCADE;
TRUNCATE TABLE city_regions_towns RESTART IDENTITY CASCADE;
TRUNCATE TABLE parties RESTART IDENTITY CASCADE;
TRUNCATE TABLE organizations RESTART IDENTITY CASCADE;
DELETE FROM seeds;
SQL

echo "==> running seed migrations"
npm run seed:run

echo "==> applying 2026 parties/organizations"
"${PSQL_CMD[@]}" < "$(dirname "$0")/update-parties-orgs.sql"

echo "==> pointing any orphan people at Без организация"
"${PSQL_CMD[@]}" -c "
UPDATE people SET organization_id = (
  SELECT id FROM organizations WHERE name = 'Без организация' LIMIT 1
)"

echo "==> re-creating people FKs"
"${PSQL_CMD[@]}" <<'SQL'
ALTER TABLE people
  ADD CONSTRAINT people_section_id_fkey
    FOREIGN KEY (section_id) REFERENCES sections(id);
ALTER TABLE people
  ADD CONSTRAINT people_stream_id_fkey
    FOREIGN KEY (stream_id) REFERENCES streams(id);
ALTER TABLE people
  ADD CONSTRAINT people_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id);
SQL

echo "==> done"
"${PSQL_CMD[@]}" -c "
SELECT 'sections' AS t, count(*) FROM sections
UNION ALL SELECT 'machine', count(*) FROM sections WHERE is_machine
UNION ALL SELECT 'mobile', count(*) FROM sections WHERE is_mobile
UNION ALL SELECT 'ship', count(*) FROM sections WHERE is_ship
UNION ALL SELECT 'people', count(*) FROM people
UNION ALL SELECT 'parties', count(*) FROM parties
UNION ALL SELECT 'organizations', count(*) FROM organizations"
