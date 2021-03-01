import * as bodyParser from 'body-parser';

export const jsonMiddleware = bodyParser.json({ limit: '50mb' });
