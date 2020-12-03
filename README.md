<h1 align="center">Ти Броиш REST API</h1>

Ти Броиш е платформа за паралелно преброяване и проследяване на парламентарните избори в България.

Това е REST API приложението, което приема и обработва данните от мобилните приложения.

## Инсталация

Пуснете [Docker][] и изпълнете следните команди:

``` shell
# Clone the project
git clone git@github.com:Da-Bulgaria/ti-broish-api.git
cd ti-broish-api
# Install dependencies
npm install
# Start the database with a Docker
npm run start:dev:db
# Run the migrations
npm typeorm migration:run
# Seed the database
npm typeorm seed:run
```

### Конфигурация

Свалете Service account JSON файл от Firebase и го запазете като `firebase.json` в проекта.

``` shell
# Copy the environment configuration template
cp .env.schema .env
```

`.env` файлът съдържа стойности по подразбиране от шаблона.

#### Генериране на Firebase JWT Token

Ако искате лесно да генерирате JWT токен за автентикация с Firebase, създайте потребител във [Firebase Console](https://console.firebase.google.com/project/ti-broish/authentication/users) и попълнете в `.env`:

- `FIREBASE_API_KEY`
- `FIREBASE_UID`

След това можете лесно да генерирате ключ със следната команда:
``` shell
npm run firebase:token
```

## Стартиране

``` shell
npm run start
```

## Разработване

``` shell
# watch mode
npm run start:dev
```

## Тестове

``` shell
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Контакти

- [team@demokrati.bg](mailto:team@demokrati.bg)

## Лиценз

Кодът на Ти Броиш е лицензиран под [MIT лиценз](https://github.com/nestjs/nest/blob/master/LICENSE).

[Docker]: https://www.docker.com/products/docker-desktop
