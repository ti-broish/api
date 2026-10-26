# Addresses of the abroad sections

The street address of every abroad section (election region 32, ids `32xxxxxxx`)
lives in `sections.address`. The МВнР publishes them as an xlsx on
<https://mfa.bg/bg/pvr2026/adresi> and changes them now and then; the API is the
one place they are kept, and the site reads them from `GET /sections/abroad`.

`place` of an abroad section stays the committee name from the CIK sheet
(„Посолство“, „Баркинг 2“). For domestic sections `place` is the address, and
`address` falls back to it (see `src/sections/section-address.ts`).

## Read

- `GET /sections/abroad` (public, cached 5 min): every abroad section with
  `id`, `code`, `place`, `address` (null until loaded), `town {id, name}` and
  `country {code, name}`.
- `GET /sections?town=`, `GET /sections/:id` and `/results/<section>.json`
  include `address` too.

## Update

Only the address column of existing abroad sections is written. Unknown ids are
reported in `unknown`, never created; nothing is deleted. Every run reports
`updated` (`{id, from, to}`), `unchanged` and `unknown`.

1. Convert the xlsx:

   ```sh
   uv run scripts/sections-preprocess/mfa_abroad_addresses.py adresi.xlsx abroad-addresses.csv
   ```

   The CSV has `section_id,country,place,address`; only `section_id` and
   `address` are used (`№ на секция` and `Адрес` work as headers too).

2. Load it, dry run first. Either on the server, in the `source` folder of the
   environment (uses its `.env`):

   ```sh
   npm run sections:update-abroad-addresses -- abroad-addresses.csv --dry-run
   npm run sections:update-abroad-addresses -- abroad-addresses.csv
   ```

   or over HTTP as an admin (`Manage Section`):

   ```sh
   curl -X PATCH "$API/sections/abroad/addresses?dryRun=true" \
     -H "Authorization: Bearer $TOKEN" -F file=@abroad-addresses.csv
   curl -X PATCH "$API/sections/abroad/addresses" \
     -H "Authorization: Bearer $TOKEN" -F file=@abroad-addresses.csv
   ```

   A JSON body `{"sections": [{"id": "320902332", "address": "…"}]}` works too.
