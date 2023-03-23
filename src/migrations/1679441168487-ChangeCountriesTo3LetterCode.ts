import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeCountriesTo3LetterCode1679441168487
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE countries ALTER COLUMN code TYPE bpchar(3) USING code::bpchar(3);
      UPDATE countries SET code = CONCAT('0', code);
      UPDATE sections SET id = substring(id from 1 for 2) || '0' || substring(id from 3 for 2) || '0' || substring(id from 7 for 3) where id like '32%';
      UPDATE checkins SET section_id = substring(section_id from 1 for 2) || '0' || substring(section_id from 3 for 2) || '0' || substring(section_id from 7 for 3) where section_id like '32%';
      UPDATE people SET section_id = substring(section_id from 1 for 2) || '0' || substring(section_id from 3 for 2) || '0' || substring(section_id from 7 for 3) where section_id like '32%';
      UPDATE protocols SET section_id = substring(section_id from 1 for 2) || '0' || substring(section_id from 3 for 2) || '0' || substring(section_id from 7 for 3) where section_id like '32%';
      UPDATE streams SET section_id = substring(section_id from 1 for 2) || '0' || substring(section_id from 3 for 2) || '0' || substring(section_id from 7 for 3) where section_id like '32%';
      UPDATE violations SET section_id = substring(section_id from 1 for 2) || '0' || substring(section_id from 3 for 2) || '0' || substring(section_id from 7 for 3) where section_id like '32%';
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE countries SET code = SUBSTRING(code FROM 2);
      ALTER TABLE countries ALTER COLUMN code bpchar(2) NOT NULL;
      UPDATE sections SET id = substring(id from 1 for 2) || substring(id from 4 for 2) || '00' || substring(id from 7 for 3) where id like '32%';
      UPDATE checkins SET section_id = substring(section_id from 1 for 2) || substring(section_id from 4 for 2) || '00' || substring(section_id from 7 for 3) where section_id like '32%';
      UPDATE people SET section_id = substring(section_id from 1 for 2) || substring(section_id from 4 for 2) || '00' || substring(section_id from 7 for 3) where section_id like '32%';
      UPDATE protocols SET section_id = substring(section_id from 1 for 2) || substring(section_id from 4 for 2) || '00' || substring(section_id from 7 for 3) where section_id like '32%';
      UPDATE streams SET section_id = substring(section_id from 1 for 2) || substring(section_id from 4 for 2) || '00' || substring(section_id from 7 for 3) where section_id like '32%';
      UPDATE violations SET section_id = substring(section_id from 1 for 2) || substring(section_id from 4 for 2) || '00' || substring(section_id from 7 for 3) where section_id like '32%';
    `)
  }
}
