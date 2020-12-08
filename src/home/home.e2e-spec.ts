import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { HomeModule } from './home.module';
import { INestApplication } from '@nestjs/common';

describe('HomeController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [HomeModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .set('Accept', 'application/json')
      .expect(200, {
        hello: 'world',
      })
      .expect('Content-Type', /json/);
  });
});
