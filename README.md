<p align="center">
  <img align="center" src="docs/youCount_horizontal_RGB_color.png" alt="Ти Броиш лого" width="500px">
</p>

<h1 align="center">Ти Броиш REST API</h1>

Ти Броиш е платформа за паралелно преброяване и проследяване на парламентарните избори в България.

Това е REST API приложението, което приема и обработва данните от мобилните приложения.

## Първоначална инсталация

Пуснете [Docker][], включете [Docker Compose 2.0][] и изпълнете следните команди:

```shell
# Clone the project
git clone git@github.com:ti-broish/api.git
cd ti-broish-api
# Copy the environment configuration template
cp .env.schema .env
# Пуснете всички нужни контейнери - API, Postgres база данни и Redis cache
docker compose up
# Create the schema and seed the data
docker compose exec ti-broish-api npm run migration:run
docker compose exec ti-broish-api npm run seed:run
```

### Конфигурация

`.env.schema` файлът съдържа стойности по подразбиране и всички възможни настройки на средата,
които приложението приема. Коригирайте всичко, което е нужно да промените в `.env`.

Свалете Service account JSON файл от Firebase и го запазете като `firebase.json` в проекта.

#### Генериране на Firebase JWT Token

Ако искате лесно да генерирате JWT токен за автентикация с Firebase, създайте потребител във [Firebase Console](https://console.firebase.google.com/project/ti-broish/authentication/users) и попълнете в `.env`:

- `FIREBASE_API_KEY`
- `FIREBASE_UID`

След това можете лесно да генерирате ключ със следната команда:

```shell
npm run firebase:token
```

#### Работа с ReCAPTCHA

Регистрирайте приложението си за ReCAPTCHA като следвате стъпките [описани тук](https://firebase.google.com/docs/app-check/web/recaptcha-provider#project-setup).

При локално стартирано приложение трябва да закоментирате следния ред `skipIf: process.env.NODE_ENV !== 'production',` в `app.module.ts`.

## Стартиране

```shell
npm run start
```

## API Документация

Ти Броиш REST API- използва Swagger OpenAPI стандарта.
След като стартирате приложението можете да намерите API документация на:

- http://localhost:4000/docs - Swagger документация и playground
- http://localhost:4000/docs-json - OpenAPI JSON Спецификация

## Разработване

```shell
# watch mode
npm run start:dev
```

## Тестове

```shell
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Контакти

- [team@tibroish.bg](mailto:team@tibroish.bg)

## Лиценз

Кодът на Ти Броиш е лицензиран под [MIT лиценз](https://github.com/nestjs/nest/blob/master/LICENSE).

[docker]: https://www.docker.com/products/docker-desktop
[docker compose 2.0]: https://docs.docker.com/compose/cli-command/#installing-compose-v2
