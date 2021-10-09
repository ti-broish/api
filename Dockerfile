FROM node:16-alpine As development

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

RUN apk add --no-cache bash vim
RUN npm set-script prepare "" && npm install

COPY --chown=node:node . .

RUN npm run build

FROM node:16-alpine as production

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

RUN npm set-script prepare "" && npm ci --only=production

COPY --chown=node:node . .

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main"]
