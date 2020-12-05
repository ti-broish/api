import {MigrationInterface, QueryRunner} from "typeorm";
import { readFileSync } from 'fs';

export class Sections1606864388675 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(readFileSync('./src/seeds/temp_sections_towns.sql', 'utf8'));
      await queryRunner.query(`
        insert into countries (code, name, is_abroad)
        select country_code, MAX(country_name), MAX(election_region_code) = '32'
        from temp_sections_towns
        group by country_code;
      `);
      await queryRunner.query(`
        insert into election_regions (code, name, is_abroad)
        select election_region_code, MAX(election_region_name), election_region_code = '32'
        from temp_sections_towns
        group by election_region_code;
      `);

      await queryRunner.query(`
        insert into towns (name, election_region_id, country_id)
        select town_name, max(election_regions.id), max(countries.id)
        from temp_sections_towns
        join countries on countries.code = temp_sections_towns.country_code
        join election_regions on election_regions.code = temp_sections_towns.election_region_code
        group by country_code, election_region_code, town_name
        order by country_code, election_region_code, town_name;
      `);

      await queryRunner.query(`
        insert into sections (
          "id",
          "election_region_id",
          "town_id",
          "code",
          "is_mobile",
          "is_ship"
        )
        select
          temp_sections_towns.id,
          election_regions.id,
          towns.id,
          temp_sections_towns.section_code,
          temp_sections_towns.is_mobile,
          temp_sections_towns.is_ship
        from temp_sections_towns
        join countries
          on countries.code = temp_sections_towns.country_code
        join election_regions
          on election_regions.code = temp_sections_towns.election_region_code
        join towns
          on towns.country_id = countries.id
          and towns.election_region_id = election_regions.id
          and towns.name = temp_sections_towns.town_name
        order by country_code, election_region_code, town_name;
      `);

      //   insert into municipalities (code, name) values
      //   ('01', 'Банско'),
      //   ('02', 'Белица'),
      //   ('03', 'Благоевград'),
      //   ('11', 'Гоце Делчев'),
      //   ('13', 'Гърмен'),
      //   ('28', 'Кресна'),
      //   ('33', 'Петрич'),
      //   ('37', 'Разлог'),
      //   ('40', 'Сандански'),
      //   ('42', 'Сатовча'),
      //   ('44', 'Симитли'),
      //   ('49', 'Струмяни'),
      //   ('52', 'Хаджидимово'),
      //   ('53', 'Якоруда');

      //   insert into election_regions_municipalities (election_region_id, municipality_id)
      //   select election_regions.id, municipalities.id
      //   from municipalities
      //   left join election_regions
      //     on true = true
      //   where election_regions.code = '01';

      //   insert into municipalities (code, name) values
      //   ('46', 'Столична');

      //   insert into election_regions_municipalities (election_region_id, municipality_id)
      //   select election_regions.id, municipalities.id
      //   from municipalities
      //   left join election_regions
      //     on true = true
      //   where municipalities.code = '46'
      //   and election_regions.code = '25';

      //   insert into city_regions (code, name, town_id) values
      //   ('11', 'Красна Поляна', 1),
      //   ('12', 'Илинден', 1),
      //   ('13', 'Надежда', 1),
      //   ('18', 'Овча Купел', 1),
      //   ('19', 'Люлин', 1),
      //   ('20', 'Връбница', 1),
      //   ('21', 'Нови Искър', 1),
      //   ('24', 'Банкя', 1);
      // `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        -- drop table "temp_sections_towns" restart identity cascade;
        truncate table "election_regions_municipalities" restart identity cascade;
        truncate table "sections" restart identity cascade;
        truncate table "city_regions" restart identity cascade;
        truncate table "towns" restart identity cascade;
        truncate table "election_regions" restart identity cascade;
        truncate table "municipalities" restart identity cascade;
        truncate table "countries" restart identity cascade;
        truncate table "countries" restart identity cascade;
      `);
    }

}
