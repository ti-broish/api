-- Begin reset and import script.
-- Make sure data import is in the same connection and transaction
BEGIN;

-- Defer data constraints to be checked later
SET CONSTRAINTS ALL DEFERRED;

-- Delete data related to a specific election cycle
-- We keep the parties and organisations for now and adjust them later
DELETE FROM protocols_pictures;
DELETE FROM violations_pictures;
DELETE FROM pictures;
DELETE FROM protocol_actions;
DELETE FROM protocol_results;
DELETE FROM protocols_assignees;
DELETE FROM work_items;
DELETE FROM protocols;
DELETE FROM violation_comments;
DELETE FROM violation_updates;
DELETE FROM violations_assignees;
DELETE FROM violations;
DELETE FROM checkins;
UPDATE people set section_id = NULL;
UPDATE people set stream_id = NULL;
DELETE FROM stream_chunks;
DELETE FROM streams;
DELETE FROM election_regions_municipalities;
DELETE FROM city_regions_towns;
DELETE FROM sections;
DELETE FROM city_regions;
DELETE FROM towns;
DELETE FROM municipalities;
DELETE FROM election_regions;
DELETE FROM countries;

-- Reset sequences so re-importing doesn't overflow short ints
ALTER SEQUENCE towns_id_seq RESTART WITH 1;
ALTER SEQUENCE election_regions_id_seq RESTART WITH 1;
ALTER SEQUENCE municipalities_id_seq RESTART WITH 1;
ALTER SEQUENCE countries_id_seq RESTART WITH 1;
ALTER SEQUENCE city_regions_id_seq RESTART WITH 1;

-- Disable foreign key checks for missing data so we can import tables in any order
ALTER TABLE city_regions_towns DISABLE TRIGGER ALL;
ALTER TABLE city_regions DISABLE TRIGGER ALL;
ALTER TABLE countries DISABLE TRIGGER ALL;
ALTER TABLE election_regions DISABLE TRIGGER ALL;
ALTER TABLE election_regions_municipalities DISABLE TRIGGER ALL;
ALTER TABLE municipalities DISABLE TRIGGER ALL;
ALTER TABLE sections DISABLE TRIGGER ALL;
ALTER TABLE towns DISABLE TRIGGER ALL;


-- -------------

-- IMPORT DATA HERE:
-- city_regions
-- city_regions_towns
-- countries
-- election_regions
-- election_regions_municipalities
-- municipalities
-- sections
-- towns
-- -------------

-- Re-enable foreign key checks
ALTER TABLE city_regions_towns ENABLE TRIGGER ALL;
ALTER TABLE city_regions ENABLE TRIGGER ALL;
ALTER TABLE countries ENABLE TRIGGER ALL;
ALTER TABLE election_regions ENABLE TRIGGER ALL;
ALTER TABLE election_regions_municipalities ENABLE TRIGGER ALL;
ALTER TABLE municipalities ENABLE TRIGGER ALL;
ALTER TABLE sections ENABLE TRIGGER ALL;
ALTER TABLE towns ENABLE TRIGGER ALL;

-- Re-enable constraints
SET CONSTRAINTS ALL IMMEDIATE;

-- Commit if everything is OK so far, otherwise rollback
-- COMMIT;
