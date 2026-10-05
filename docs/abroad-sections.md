# Updating abroad sections only

Replaces the abroad sections (election region `32`, ids `32…`) from the CIK
sheet without regenerating `sections.csv` and without touching domestic
sections. Two entry points, one code path
(`src/sections/abroad/abroad-sections.updater.ts`):

- `PUT /sections/abroad`: admin only (Firebase token of a user with the `admin` role)
- `npm run sections:update-abroad -- <file.csv> [--dry-run] [--verbose]`: talks to the database in `.env` (`DATABASE_*`)

Both run in one transaction. `dryRun` makes every change, reports it, then
rolls back. Run a dry run first.

## Input

CSV (UTF-8, comma separated, header row) as exported from the sheet:

```
Държава,№ на секция,Секционна избирателна комисия
Австралия,320012001,Аделаида
Австралия,320010003,Канбера (Посолство)
```

Optional columns: `Избиратели` (voters), `Машини` (machines). English headers
`country`, `section_id`, `label`, `voters`, `machines` work too. A blank
`Държава` repeats the previous country; `Общо:` rows are skipped.

JSON works too: `{"sections": [{"Държава": "…", "№ на секция": "…", "Секционна избирателна комисия": "…"}]}`.

The whole input is validated first. Any bad row (not `32` + 7 digits, a
duplicate id, a missing label, one country code with two names) returns 400
with every error and nothing is written.

## Mapping

| Column | Value |
| --- | --- |
| `sections.id` | `№ на секция` |
| `sections.code` | last 3 digits of the id |
| country code | digits 3–5 of the id (`320012001` → `001`) |
| country name | `Държава` without a trailing `*` or `(…)` |
| town / place | SIC label split on the first `(…)`: `Лондон (Посолство 1)` → town `Лондон`, place `Посолство 1`. `Виена (Посолски комплекс) - ПК Нашмаркт` → `Виена` / `Посолски комплекс ПК Нашмаркт`. Without parentheses both are the label (trailing `*` removed) |
| `voters_count` | `Избиратели` if present, else 0 (the seed also stores 0 for empty) |
| `is_machine` | `Машини` > 0, else false |
| `is_mobile`, `is_ship`, `city_region_id` | false, false, null |

`risk_level` and `population` of existing sections are left alone (they have
their own import paths). New sections get `low` / 0.

Geo:

- Election region `32` is reused, or created as `Извън страната`.
- Countries are matched by code. A different name in the sheet renames the
  country (`Германия` → `Германия ФР`). New codes are created with
  `is_abroad = true`. A code that belongs to a domestic country, or a name
  already used by another code, aborts with 409.
- Towns are matched by country + name (case-insensitive) among abroad towns.
  New towns get the next free code, at least 100000, so they never clash with
  EKATTE codes.

## Sections that are no longer in the list

An abroad section in the database but not in the input:

- is **deleted** if nothing references it;
- is **kept unchanged** and listed under `sections.kept` with the counts if
  any row in `protocols`, `violations`, `streams`, `stream_chunks`,
  `checkins` or `people` (or any other FK to `sections`) points at it.
  Nothing referencing it is rewritten or detached. Decide by hand what to do
  with those.

After that, abroad towns with no sections are deleted unless something else
references them (for example a town-level violation; those are listed under
`towns.kept`). Abroad countries with no towns that are not in the input are
deleted the same way.

Domestic data is never written: section writes are limited to `id like '32%'`,
town and country deletes to `countries.is_abroad = true`.

## Examples (2026-10-25 sheet)

```bash
TOKEN=$(npm run -s firebase:token -- <admin firebase uid>)

# Dry run
curl -sS -X PUT 'https://api.tibroish.bg/sections/abroad?dryRun=true' \
  -H "Authorization: Bearer $TOKEN" \
  -F 'file=@../sections_abroad_2026-10-25.csv;type=text/csv' | jq '{received, sections: (.sections | {created: (.created|length), updated: (.updated|length), unchanged, deleted: (.deleted|length), kept}), countries, towns: (.towns | {created: (.created|length), deleted: (.deleted|length), kept})}'

# Apply
curl -sS -X PUT 'https://api.tibroish.bg/sections/abroad' \
  -H "Authorization: Bearer $TOKEN" \
  -F 'file=@../sections_abroad_2026-10-25.csv;type=text/csv'
```

From a checkout with `.env` pointing at the target database:

```bash
npm run sections:update-abroad -- ../sections_abroad_2026-10-25.csv --dry-run
npm run sections:update-abroad -- ../sections_abroad_2026-10-25.csv
```

Running it again with the same file is a no-op (`unchanged: 613`).

`/results/*.json` responses carry a 60 s cache header, so clients can see the old abroad tree for up to a minute.
