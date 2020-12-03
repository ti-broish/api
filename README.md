<h1 align="center">Ти Броиш REST API</h1>

Ти Броиш е платформа за паралелно преброяване и проследяване на парламентарните избори в България.

Това е REST API приложението, което приема и обработва данните от мобилните приложения.

## Инсталация

``` shell
git clone git@github.com:Da-Bulgaria/ti-broish-api.git
cd ti-broish-api
npm install
```

Пуснете Docker на вашата машина и създайте базата с първоначални данни:
``` shell
# Start Docker container
npm run start:dev:db

# Run migrations
npm typeorm migration:run

# Seed the database
npm typeorm seed:run
```

## Стартиране

``` shell
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Тестове

``` shell
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Контакти

- [team@demokrati.bg](mailto:team@demokrati.bg)

## Лиценз

Кодът на Ти Броиш е лицензиран под [MIT лиценз](https://github.com/nestjs/nest/blob/master/LICENSE).
