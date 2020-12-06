import { csvToSql } from 'src/utils/csvToSql';
import {MigrationInterface, QueryRunner} from 'typeorm';

export class Sections1607202587052 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TEMPORARY TABLE "sections_elections" (
        "section_id" char(9),
        "section_code" char(3),
        "election_region_code" char(2),
        "election_region_name" varchar,
        "country_code" char(2),
        "country_name" varchar,
        "municipality_code" char(2),
        "city_region_code" char(2),
        "city_region_name" varchar,
        "town_code" int,
        "town_name" varchar,
        "is_mobile" boolean,
        "is_ship" boolean,
        "is_machine" boolean
      ) ON COMMIT DROP;
    `);

    await queryRunner.query(await csvToSql(
      __dirname + '/eu2019/sections.txt',
      'sections_elections',
      {
        delimiter: ';',
        columns: [
          'section_id',
          'election_region_code',
          'election_region_name',
          'town_code',
          'town_name',
          'is_mobile',
          'is_ship',
          'is_machine',
        ],
      },
    ));

    await queryRunner.query(`
      update sections_elections
      set
        election_region_code = SUBSTRING(section_id from 1 for 2),
        election_region_name = INITCAP(SUBSTRING(election_region_name from 5)),
        section_code = SUBSTRING(section_id from 7);
    `);

    await queryRunner.query(`
      update sections_elections
      set
        country_code = case
          when election_region_code = '32' then SUBSTRING(section_id from 3 for 2)
          else '00'
        end
    `);

    await queryRunner.query(`
      update sections_elections
      set country_name = 'България'
      where country_code = '00'
    `);

    await queryRunner.query(`
      UPDATE sections_elections
      SET
        town_name = split_part(town_name, ',', 1)
      WHERE town_name LIKE '%,%'
      AND country_code = '00';
    `);

    await queryRunner.query(`
      UPDATE sections_elections
      SET
        town_code = 14218
        WHERE town_name = 'гр. Габрово';
    `);
    await queryRunner.query(`
      UPDATE sections_elections
      SET town_code = 68134
      WHERE town_name = 'гр. София';
    `);

    await queryRunner.query(`
      update sections_elections
      set
        country_name = split_part(town_name, ', ', 1),
        town_name = split_part(town_name, ', ', 2)
      where country_code != '00'
    `);
    await queryRunner.query(`
      update sections_elections
      set municipality_code = SUBSTRING(section_id from 3 for 2)
      where country_code = '00';
    `);
    await queryRunner.query(`
      update sections_elections
      set city_region_code = SUBSTRING(section_id from 5 for 2)
      where country_code = '00'
      and SUBSTRING(section_id from 5 for 2) != '00';
    `);

    await queryRunner.query(`
      insert into countries (code, name, is_abroad)
      select country_code, MAX(country_name), MAX(election_region_code) = '32'
      from sections_elections
      group by country_code;
    `);

    await queryRunner.query(`
      insert into election_regions (code, name, is_abroad)
      select election_region_code, MAX(election_region_name), election_region_code = '32'
      from sections_elections
      group by election_region_code
      order by election_region_code;
    `);

    await queryRunner.query(`
      insert into towns (name, code, country_id)
      select max(town_name), town_code, max(countries.id)
      from sections_elections
      join countries on countries.code = sections_elections.country_code
      group by town_code
      order by max(country_code), max(election_region_code), town_code;
    `);

    await queryRunner.query(`
      insert into sections (
        "id",
        "election_region_id",
        "town_id",
        "code",
        "is_mobile",
        "is_ship",
        "is_machine"
      )
      select
        sections_elections.section_id,
        max(election_regions.id),
        max(towns.id),
        max(sections_elections.section_code),
        bool_or(sections_elections.is_mobile),
        bool_or(sections_elections.is_ship),
        bool_or(sections_elections.is_machine)
      from sections_elections
      join countries
        on countries.code = sections_elections.country_code
      join election_regions
        on election_regions.code = sections_elections.election_region_code
      join towns
        on towns.code = sections_elections.town_code
      group by sections_elections.election_region_code, sections_elections.country_code, sections_elections.town_code, sections_elections.section_id
      order by country_code, election_region_code, max(town_name);
    `);

    await queryRunner.query(`
      CREATE TEMPORARY TABLE "sections_ekatte" (
        "province_code" char(2),
        "province_name" varchar,
        "election_region_code" char(2),
        "municipality_code" char(2),
        "municipality_name" varchar,
        "city_region_code" char(2),
        "city_region_name" varchar,
        "section_code" char(3),
        "town_code" int,
        "town_name" varchar,
        "place" varchar,
        "voters_count" int
      ) ON COMMIT DROP;
    `);

    await queryRunner.query(await csvToSql(
      __dirname + '/eu2019/sections_ekatte.csv',
      'sections_ekatte'
    ));

    await queryRunner.query(`
      UPDATE sections_ekatte
      SET town_name = 'ГР.ГАБРОВО'
      WHERE town_name = 'ГР.ГАБРОВО,КВ.ЕТЪРА';
    `);

    await queryRunner.query(`
      UPDATE sections_ekatte
      SET
        place = concat(split_part(town_name, ',', 2), ', ', place),
        town_name = split_part(town_name, ',', 1)
      WHERE town_name LIKE 'ГР.СОФИЯ,%';
    `);

    await queryRunner.query(`
      UPDATE sections_ekatte
      SET town_code = 14218
      WHERE town_name = 'ГР.ГАБРОВО';
    `);

    await queryRunner.query(`
      UPDATE sections_ekatte
      SET town_code = 68134
      WHERE town_name = 'ГР.СОФИЯ';
    `);

    await queryRunner.query(`
      UPDATE sections_ekatte
      SET city_region_code = '00'
      WHERE city_region_code IS NULL or city_region_code = ''
    `);

    await queryRunner.query(`
      UPDATE sections_ekatte
      SET city_region_code = '00'
      WHERE city_region_code IS NULL or city_region_code = ''
    `);

    await queryRunner.query(`
      INSERT INTO city_regions (code, name, town_id)
      SELECT city_region_code, initcap(max(city_region_name)), max(towns.id)
      FROM sections_ekatte
      JOIN towns ON towns.code = sections_ekatte.town_code
      WHERE city_region_code != '00'
      GROUP BY sections_ekatte.province_code, sections_ekatte.city_region_code
    `);

    await queryRunner.query(`
      UPDATE sections
      SET city_region_id = city_regions.id
      FROM towns
      JOIN city_regions ON city_regions.town_id = towns.id
      WHERE towns.id = sections.town_id
      AND city_regions.code = substring(sections.id from 5 for 2)
    `);

    await queryRunner.query(`
      update sections_ekatte
      set election_region_code = province_code;

      update sections_ekatte
      set election_region_code = LPAD(cast(cast(province_code as integer) + 1 as VARCHAR), 2, '0')
      where cast(province_code as integer) > 16;

      update sections_ekatte
      set election_region_code = '17'
      where province_code = '16' and city_region_code = '00';

      update sections_ekatte
      set election_region_code = LPAD(cast(cast(province_code as integer) + 3 as VARCHAR), 2, '0')
      where cast(province_code as integer) > 22;
    `);

    await queryRunner.query(`
      update sections_ekatte
      set election_region_code = sections.election_region_code
      from (
        select
          sections.code as section_code,
          election_regions.code as election_region_code,
          towns.code as town_code,
          city_regions.code as city_region_code
        from sections
        join towns on towns.id = sections.town_id
        join city_regions on city_regions.id = sections.city_region_id
        join election_regions on election_regions.id = sections.election_region_id
      ) as sections
      where sections.section_code = sections_ekatte.section_code
      and sections.town_code = sections_ekatte.town_code
      and sections.city_region_code = sections_ekatte.city_region_code
      and sections_ekatte.city_region_code != '00'
      and sections_ekatte.town_code = '68134';
    `);

    await queryRunner.query(`
        update sections
        set place = sections_ekatte.place
        from sections_ekatte
        join election_regions
          on election_regions.code = sections_ekatte.election_region_code
        join towns
          on towns.code = sections_ekatte.town_code
        left join city_regions
          on city_regions.code = sections_ekatte.city_region_code
        where election_regions.id = sections.election_region_id
        and towns.id = sections.town_id
        and (sections.city_region_id is null or sections.city_region_id = city_regions.id)
        and sections.code = sections_ekatte.section_code;
    `);

    await queryRunner.query(`
      insert into municipalities(code, name)
      select municipality_code, INITCAP(MAX(municipality_name))
      from sections_ekatte
      group by province_code, municipality_code
    `);

    await queryRunner.query(`
      update towns
      set municipality_id = municipalities.id
      from sections_ekatte
      join municipalities
        on municipalities.code = sections_ekatte.municipality_code
      where sections_ekatte.town_code = towns.code
    `);

    await queryRunner.query(`
      insert into election_regions_municipalities(election_region_id, municipality_id)
      select election_regions.id, municipalities.id
      from sections_ekatte
      join election_regions on sections_ekatte.election_region_code = election_regions.code
      join municipalities on sections_ekatte.municipality_code = municipalities.code
      group by election_regions.id, municipalities.id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      truncate table "election_regions_municipalities" RESTART IDENTITY CASCADE;
      truncate table "sections" RESTART IDENTITY CASCADE;
      truncate table "city_regions" RESTART IDENTITY CASCADE;
      truncate table "towns" RESTART IDENTITY CASCADE;
      truncate table "election_regions" RESTART IDENTITY CASCADE;
      truncate table "municipalities" RESTART IDENTITY CASCADE;
      truncate table "countries" RESTART IDENTITY CASCADE;
    `);
  }
}
