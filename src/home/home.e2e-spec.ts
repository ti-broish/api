import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { HomeModule } from './home.module';
import { INestApplication } from '@nestjs/common';

describe('Home (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HomeModule],
    }).compile();

    app = moduleRef.createNestApplication();
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

  afterAll(async () => {
    await app.close();
  });
});
