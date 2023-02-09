import * as Joi from 'joi'

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
  DATABASE_SSL: Joi.boolean().default(false),
  GOOGLE_CLOUD_PROJECT: Joi.string().required(),
  GOOGLE_APPLICATION_CREDENTIALS: Joi.string().required(),
  UPLOADS_PATH: Joi.string().default('./var/uploads/'),
  MINIO_ENDPOINT: Joi.string().required(),
  MINIO_SSL: Joi.boolean().default(true),
  MINIO_PORT: Joi.number().default(9000),
  MINIO_URL: Joi.string().required(),
  MINIO_ACCESS_KEY: Joi.string().required(),
  MINIO_SECRET_KEY: Joi.string().required(),
  MINIO_PICTURES_BUCKET: Joi.string().required(),
  CANONICAL_RESULTS: Joi.string().default(
    'https://tibroish.bg/results/parliament2021-07-11/',
  ),
  STREAMING_TIMESTAMP: Joi.string().required(),
  STREAM_REJECT_SECRET: Joi.string().required(),
  PROTOCOLS_VALIDATION_ITERATIONS: Joi.number().default(2),
  STREAMS_WEBHOOK_USERNAME: Joi.string().required(),
  STREAMS_WEBHOOK_PASSWORD: Joi.string().required(),
  ELECTION_CAMPAIGN_NAME: Joi.string().default('Парламентарни избори'),
})
