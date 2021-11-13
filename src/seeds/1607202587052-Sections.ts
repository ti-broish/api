import { csvToSql } from 'src/utils/csvToSql';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sections1607202587052 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`COMMIT;`);
    await queryRunner.query(`
      create table if not exists "sections_seed" (
        "country_code" char(2),
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
    `);

    (
      await csvToSql(
        __dirname + '/parl-2021-11-14/sections-2021-11-14.csv',
        'sections_seed',
      )
    )
      .split(';')
      .map(async (sql) => await queryRunner.query(sql));

    await queryRunner.query(`START TRANSACTION;`);

    await queryRunner.query(`
      insert into countries (code, name, is_abroad)
      select country_code, max(country_name), max(election_region_code) = '32'
      from sections_seed
      group by country_code;
    `);

    await queryRunner.query(`
      insert into election_regions (code, name, is_abroad)
      select election_region_code, max(election_region_name), election_region_code = '32'
      from sections_seed
      group by election_region_code
      order by election_region_code;
    `);

    await queryRunner.query(`
      insert into municipalities(code, name)
      select municipality_code, municipality_name
      from sections_seed
      where sections_seed.municipality_code is not null
      group by municipality_code, municipality_name
    `);

    await queryRunner.query(`
      insert into election_regions_municipalities(election_region_id, municipality_id)
      select election_regions.id, municipalities.id
      from sections_seed
      join election_regions
        on election_regions.code = sections_seed.election_region_code
      join municipalities
        on municipalities.code = sections_seed.municipality_code
        and lower(municipalities.name) = lower(sections_seed.municipality_name)
      group by election_regions.id, municipalities.id
    `);

    await queryRunner.query(`
      insert into towns (name, code, country_id, municipality_id)
      select max(town_name), town_code, max(countries.id), max(municipalities.id)
      from sections_seed
      join countries
        on countries.code = sections_seed.country_code
      left join municipalities
        on municipalities.code = sections_seed.municipality_code
        and lower(municipalities.name) = lower(sections_seed.municipality_name)
      group by town_code
      order by max(country_code), max(election_region_code), town_code;
    `);

    await queryRunner.query(`
      insert into city_regions (code, name)
      select city_region_code, max(city_region_name)
      from sections_seed
      where sections_seed.city_region_code != '00'
      and sections_seed.city_region_code != ''
      and sections_seed.city_region_code is not null
      group by sections_seed.city_region_code, sections_seed.city_region_name
    `);

    await queryRunner.query(`
      insert into city_regions_towns (town_id, city_region_id)
      select towns.id as town_id, city_regions.id as city_region_id
      from sections_seed
      join towns
        on towns.code = sections_seed.town_code
      join city_regions
        on city_regions.code = sections_seed.city_region_code
        and lower(city_regions.name) = lower(sections_seed.city_region_name)
      where sections_seed.city_region_code != '00'
      and sections_seed.city_region_code != ''
      and sections_seed.city_region_code is not null
      group by towns.id, city_regions.id
    `);

    await queryRunner.query(`
      insert into sections (
        id,
        election_region_id,
        town_id,
        city_region_id,
        code,
        place,
        voters_count,
        is_machine,
        is_mobile,
        is_ship,
        is_covid
      )
      select
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
      from sections_seed
      join countries
        on countries.code = sections_seed.country_code
      join election_regions
        on election_regions.code = sections_seed.election_region_code
      join towns
        on towns.code = sections_seed.town_code
      left join city_regions
        on city_regions.code = sections_seed.city_region_code
        and lower(city_regions.name) = lower(sections_seed.city_region_name)
      group by sections_seed.election_region_code, sections_seed.country_code, sections_seed.town_code, sections_seed.section_id
      order by country_code, election_region_code, max(town_name);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      truncate table "election_regions_municipalities" restart identity cascade;
      truncate table "sections" restart identity cascade;
      truncate table "city_regions" restart identity cascade;
      truncate table "towns" restart identity cascade;
      truncate table "election_regions" restart identity cascade;
      truncate table "municipalities" restart identity cascade;
      truncate table "countries" restart identity cascade;
      truncate table "city_regions_towns" restart identity cascade;
    `);
  }
}
