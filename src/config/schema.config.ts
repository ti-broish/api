import * as Joi from 'joi';

export const configSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  PORT: Joi.number().default(4000),
  NEST_LANG: Joi.string().default('bg'),
  DATABASE_HOST: Joi.string().hostname().default('localhost'),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USERNAME: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().default('ti_broish'),
  GOOGLE_CLOUD_PROJECT: Joi.string().required(),
  GOOGLE_APPLICATION_CREDENTIALS: Joi.string().required(),
  UPLOADS_PATH: Joi.string().default('./var/uploads/'),
  MINIO_ENDPOINT: Joi.string().required(),
  MINIO_PORT: Joi.number().default(9000),
  MINIO_ACCESS_KEY: Joi.string().required(),
  MINIO_SECRET_KEY: Joi.string().required(),
  MINIO_PICTURES_BUCKET: Joi.string().required(),
  API_DOCS: Joi.boolean().default(false)
});
