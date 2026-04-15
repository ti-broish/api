-- Carry over people from ti_broish_old into the current DB.
-- Run from psql connected to the target DB (ti_broish). Uses dblink
-- to pull rows directly from ti_broish_old.
--
-- All carried-over people are reassigned to the "Без организация" org and
-- have stream_id / section_id nulled (old refs don't exist in the new DB).

BEGIN;

CREATE EXTENSION IF NOT EXISTS dblink;

-- The source DB has duplicate firebase_uid values (legacy). The new schema
-- enforces UNIQUE, so keep only the latest registered_at per firebase_uid.
WITH src AS (
  SELECT * FROM dblink(
    'dbname=ti_broish_old user=postgres',
    'SELECT id, first_name, last_name, email, phone, pin, firebase_uid,
            roles, has_agreed_to_keep_data, registered_at, is_email_verified
       FROM people'
  ) AS t (
    id char(26), first_name varchar, last_name varchar, email varchar,
    phone varchar, pin char(4), firebase_uid varchar, roles json,
    has_agreed_to_keep_data boolean, registered_at timestamp,
    is_email_verified boolean
  )
),
deduped AS (
  SELECT DISTINCT ON (firebase_uid) *
  FROM src
  ORDER BY firebase_uid, registered_at DESC
)
INSERT INTO people (
  id, first_name, last_name, email, phone, pin, organization_id,
  firebase_uid, roles, has_agreed_to_keep_data, registered_at,
  is_email_verified, stream_id, section_id
)
SELECT
  id, first_name, last_name, email, phone, pin,
  (SELECT id FROM organizations WHERE name = 'Без организация' LIMIT 1),
  firebase_uid, roles, has_agreed_to_keep_data, registered_at,
  is_email_verified, NULL::char(26), NULL::char(9)
FROM deduped
ON CONFLICT (id) DO NOTHING;

SELECT 'people carried over' AS what, count(*) FROM people;

COMMIT;
