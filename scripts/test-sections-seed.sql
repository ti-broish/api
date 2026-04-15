-- Test the sections seed logic directly. Assumes sections.csv is at the given path.

BEGIN;

DROP TABLE IF EXISTS sections_seed;

CREATE TABLE "sections_seed" (
  "country_code" char(3),
  "country_name" varchar,
  "election_region_code" char(2),
  "election_region_name" varchar,
  "municipality_code" char(2),
  "municipality_name" varchar,
  "city_region_code" char(2),
  "city_region_name" varchar,
  "section_code" char(3),
  "section_id" char(9),
  "town_code" int,
  "town_name" varchar,
  "place" varchar,
  "voters_count" int,
  "is_machine" boolean,
  "machines_count" int,
  "is_mobile" boolean,
  "is_ship" boolean,
  "is_covid" boolean
);

-- Load CSV. The CSV has 18 columns; we enumerate them (no is_machine column).
\copy sections_seed (section_id, country_code, country_name, election_region_name, election_region_code, municipality_code, municipality_name, city_region_code, city_region_name, section_code, town_code, town_name, place, voters_count, machines_count, is_mobile, is_ship, is_covid) FROM '/var/sections.csv' WITH (FORMAT csv, HEADER true, NULL '');

-- Derive is_machine from machines_count
UPDATE sections_seed SET is_machine = (machines_count IS NOT NULL AND machines_count > 0);

-- Counts
SELECT 'sections_seed rows' AS what, count(*) FROM sections_seed;

-- Replicate seed INSERT logic
INSERT INTO countries (code, name, is_abroad)
SELECT country_code::bpchar(3), max(country_name), max(election_region_code) = '32'
FROM sections_seed
GROUP BY country_code;

INSERT INTO election_regions (code, name, is_abroad)
SELECT election_region_code, max(election_region_name), election_region_code = '32'
FROM sections_seed
GROUP BY election_region_code
ORDER BY election_region_code;

INSERT INTO municipalities (code, name)
SELECT municipality_code, municipality_name
FROM sections_seed
WHERE sections_seed.municipality_code IS NOT NULL
  AND sections_seed.municipality_code != '00'
GROUP BY municipality_code, municipality_name;

INSERT INTO election_regions_municipalities (election_region_id, municipality_id)
SELECT election_regions.id, municipalities.id
FROM sections_seed
JOIN election_regions ON election_regions.code = sections_seed.election_region_code
JOIN municipalities
  ON municipalities.code = sections_seed.municipality_code
 AND lower(municipalities.name) = lower(sections_seed.municipality_name)
GROUP BY election_regions.id, municipalities.id;

INSERT INTO towns (name, code, country_id, municipality_id)
SELECT max(town_name), town_code, max(countries.id), max(municipalities.id)
FROM sections_seed
JOIN countries ON countries.code = sections_seed.country_code
LEFT JOIN municipalities
  ON municipalities.code = sections_seed.municipality_code
 AND lower(municipalities.name) = lower(sections_seed.municipality_name)
GROUP BY town_code
ORDER BY max(country_code), max(election_region_code), town_code;

INSERT INTO city_regions (code, name)
SELECT city_region_code, max(city_region_name)
FROM sections_seed
WHERE sections_seed.city_region_code != '00'
  AND sections_seed.city_region_code != '0'
  AND sections_seed.city_region_code != ''
  AND sections_seed.city_region_code IS NOT NULL
GROUP BY sections_seed.city_region_code, sections_seed.city_region_name;

INSERT INTO city_regions_towns (town_id, city_region_id)
SELECT towns.id AS town_id, city_regions.id AS city_region_id
FROM sections_seed
JOIN towns ON towns.code = sections_seed.town_code
JOIN city_regions
  ON city_regions.code = sections_seed.city_region_code
 AND lower(city_regions.name) = lower(sections_seed.city_region_name)
WHERE sections_seed.city_region_code != '00'
  AND sections_seed.city_region_code != '0'
  AND sections_seed.city_region_code != ''
  AND sections_seed.city_region_code IS NOT NULL
GROUP BY towns.id, city_regions.id;

INSERT INTO sections (
  id, election_region_id, town_id, city_region_id,
  code, place, voters_count, is_machine, is_mobile, is_ship, is_covid
)
SELECT
  sections_seed.section_id,
  max(election_regions.id),
  max(towns.id),
  max(city_regions.id),
  max(sections_seed.section_code),
  coalesce(max(sections_seed.place), ''),
  coalesce(max(sections_seed.voters_count), 0),
  bool_or(sections_seed.is_machine),
  bool_or(sections_seed.is_mobile),
  bool_or(sections_seed.is_ship),
  bool_or(sections_seed.is_covid)
FROM sections_seed
JOIN countries ON countries.code = sections_seed.country_code
JOIN election_regions ON election_regions.code = sections_seed.election_region_code
JOIN towns ON towns.code = sections_seed.town_code
LEFT JOIN city_regions
  ON city_regions.code = sections_seed.city_region_code
 AND lower(city_regions.name) = lower(sections_seed.city_region_name)
GROUP BY sections_seed.election_region_code, sections_seed.country_code, sections_seed.town_code, sections_seed.section_id
ORDER BY country_code, election_region_code, max(town_name);

SELECT 'countries' AS what, count(*) FROM countries
UNION ALL SELECT 'election_regions', count(*) FROM election_regions
UNION ALL SELECT 'municipalities', count(*) FROM municipalities
UNION ALL SELECT 'towns', count(*) FROM towns
UNION ALL SELECT 'city_regions', count(*) FROM city_regions
UNION ALL SELECT 'city_regions_towns', count(*) FROM city_regions_towns
UNION ALL SELECT 'election_regions_municipalities', count(*) FROM election_regions_municipalities
UNION ALL SELECT 'sections', count(*) FROM sections;

COMMIT;
