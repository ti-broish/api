import { MigrationInterface, QueryRunner } from 'typeorm';

export class Organizations1607157753776 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(`
        insert into "organizations" ("name", "type") values
        ('Демократична България', 'party'),
        ('Има такъв народ', 'party'),
        ('Заедно за промяна', 'party'),
        ('Свобода', 'party'),
        ('Български национален съюз – НД', 'party'),
        ('БСП за България', 'party'),
        ('ГЕРБ-СДС', 'party'),
        ('Атака', 'party'),
        ('ДПС', 'party'),
        ('Изправи се! Мутри вън!', 'party'),
        ('МИР', 'party'),
        ('БТР', 'party'),
        ('Възраждане', 'party'),
        ('Подем', 'party'),
        ('Бригада', 'party'),
        ('Пряка демокрация', 'party'),
        ('Българско лято', 'party'),
        ('Българските патриоти', 'party'),
        ('Ляв съюз за чиста и свята република', 'party'),
        ('Партия на зелените', 'party'),
        ('Национално обединение на десницата', 'party'),
        ('Глас народен', 'party'),
        ('Републиканци за България', 'party'),
        ('Член на комисия', 'commission'),
        ('ОССЕ/БДИПЧ', 'watchers'),
        ('ПАЧИС', 'watchers'),
        ('ПАСЕ', 'watchers'),
        ('ПАОССЕ', 'watchers'),
        ('Съюз на офицерите и сержантите от запаса и резерва', 'watchers'),
        ('Федерация на независимите студентски дружества', 'watchers'),
        ('ДЕМОКРАЦИЯ И ЗАКОННОСТ', 'watchers'),
        ('ЗТП - НАБЛЮДАТЕЛНА МИСИЯ, БЪЛГАРИЯ', 'watchers'),
        ('БОЕЦ', 'watchers'),
        ('Институт за социална интеграция', 'watchers'),
        ('Институт за развитие на публичната среда', 'watchers'),
        ('ГИСДИ', 'watchers'),
        ('Сдружение на роверите', 'watchers'),
        ('Аз обичам Пловдив', 'watchers'),
        ('Национална младежка мрежа', 'watchers'),
        ('Организация за подкрепа и закрила', 'watchers'),
        ('Звено за развитие на гражданското общество', 'watchers'),
        ('Прозрачност без граници', 'watchers'),
        ('Достойнството на един народ', 'watchers'),
        ('Институт за политики и развитие', 'watchers'),
        ('България на гражданите', 'watchers'),
        ('АЛТПМЗ', 'watchers'),
        ('БЗСЗБ', 'watchers'),
        ('Гражданси комитет равни пред закона', 'watchers'),
        ('Съвет по нормотворчество', 'watchers');
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(
      `TRUNCATE TABLE "organizations" RESTART IDENTITY CASCADE`,
    );
  }
}
