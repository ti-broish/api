# Operational notes

## Deploying .env changes on staging/prod (important)

This app runs under pm2 in cluster mode as `nest start`. `nest start` spawns
`node dist/main` as a **child process**; pm2 only monitors the outer nest
wrapper. Consequences:

- `pm2 reload` / `pm2 restart` cycles the wrapper, but the `node dist/main`
  child can get orphaned and keep serving traffic with the **old** `.env`.
- `pm2 reload --update-env` only refreshes the wrapper's env, not the app's.
- The app reads config via `@nestjs/config` with `envFilePath: ['.env']`
  (see `src/config/config.module.ts`), resolved relative to `process.cwd()`.
  Runtime cwd on staging/prod is `/var/www/<target>/` — the file it actually
  reads is `source/.env`, copied from `shared/.env` by the deploy script.

**To apply an `.env` change without a full deploy:**

```bash
# on the server (deploy user)
sed -i "s|^KEY=.*|KEY=newvalue|" /var/www/ti-broish-api-staging/shared/.env
sed -i "s|^KEY=.*|KEY=newvalue|" /var/www/ti-broish-api-staging/source/.env
pm2 stop ti-broish-api-staging
pkill -f "ti-broish-api-staging/source/dist/main" || true
pm2 start ti-broish-api-staging
```

Always update **both** shared/.env (used by next deploy) and source/.env (live).

Verify the new env is actually in effect by hitting an endpoint that reflects
an env var, e.g. `GET /results/meta.json` returns `ELECTION_CAMPAIGN_NAME` and
`STREAMING_TIMESTAMP`. If the response is stale, look for an orphan
`node dist/main` process with `pgrep -fa dist/main`.

## Election rebuild pipeline

Scripts involved:

- `scripts/sections-preprocess/build_sections_csv.py` — regenerates
  `src/seeds/sections.csv` from CIK `.xlsx` files in `~/Downloads`. Handles
  canonical ER names, abroad town/country cleanup, domestic machines (>299
  voters), `;` sanitization for CSV.
- `scripts/reset-sections.sh` — truncates geo + parties/orgs + seeds history,
  runs `npm run seed:run`, reapplies `update-parties-orgs.sql`. Preserves
  `people` by temporarily dropping its FKs (section_id, stream_id,
  organization_id) before `TRUNCATE CASCADE` and re-adding them after.
  Without the FK drop, `TRUNCATE CASCADE` wipes people too.
- `scripts/update-parties-orgs.sql` — parties + organizations for the current
  election cycle. Uses a temp org id=9999 as a placeholder while swapping
  (people.organization_id is NOT NULL).
- `scripts/carryover-people.sql` — pulls people from `ti_broish_old` via
  `dblink`, deduping by firebase_uid (source has legacy duplicates). All
  carried-over people get their stream_id/section_id nullified and
  organization_id set to "Без организация".

## Updating domestic sections in place (CIK register refresh)

When CIK republishes „Адреси на избирателните секции“ mid-campaign, update the
live domestic sections without a rebuild (people, protocols etc. stay):

1. `python3 scripts/sections-preprocess/build_domestic_sections_csv.py
   --addresses <CIK addresses .xlsx> [--voters <CIK voters .xlsx>]
   --out src/seeds/<election-date>/domestic-sections.csv` (needs `openpyxl`;
   CSVs are globally gitignored on some machines, so `git add -f`).
   Oblast codes are mapped to МИР (Пловдив, София, 17+ shift); a квартал
   („ГР.СОФИЯ,КВ.ГОРУБЛЯНЕ“) gets its city's settlement code.
2. Ship it as a migration (see `1792490000000-DomesticSectionsPvr20261025.ts`),
   which runs on deploy (`postdeploy` → `migration:run`), or run it directly:
   `npm run sections:update-domestic -- <csv> --dry-run [--keep=id,id]`.

`src/sections/domestic` adds missing sections (creating settlements by EKATTE
code and city-district links when needed), updates addresses, and deletes
domestic sections missing from the register unless they are referenced
(protocols, violations, streams, people, …), mobile ballot boxes, or in
`keep`. Abroad (МИР 32) is never written. It refuses an input sharing less
than 80% of ids with the database, and is idempotent.

## npm scripts gotchas

- `seed:run` must prebuild (`npm run build`) — the seed migration reads CSVs
  from `dist/seeds/`, not `src/seeds/`.
- `typeorm-ts-node-esm` does NOT work with this project's commonjs tsconfig;
  use `typeorm-ts-node-commonjs` in all `typeorm`/`migration`/`seed` scripts.

## Staging/prod database moves

For a new election cycle, don't truncate the live DB — create a new one
(`ti_broish_2026`) and flip `DATABASE_NAME` in both `.env` files. This keeps
the old DB available for rollback. Sequence:

1. `pg_dump -Fc` from the prepared local DB
2. `scp` to the server
3. `CREATE DATABASE ti_broish_<year> OWNER ti_broish_api`
4. `pg_restore --no-owner --no-privileges --role=ti_broish_api`
5. Reassign ownership of all tables/sequences to `ti_broish_api`
6. Update DATABASE_NAME in shared/.env + source/.env, restart per section above

`dblink` restore errors during `pg_restore` on staging/prod are safe to
ignore — dblink is only used locally for the people carryover.
