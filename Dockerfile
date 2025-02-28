FROM node:23-alpine3.20 AS base

WORKDIR /usr/src/app

COPY package*.json ./

#############################################
FROM base AS dev
RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm install

COPY . .

CMD ["npm", "run", "dev"]

#############################################
FROM base AS source
RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm install

COPY . .

RUN npm run build

CMD ["sh"]

#############################################
FROM base AS production

ENV NODE_ENV=production
RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm ci --only=production

USER node

COPY --chown=node:node --from=source /usr/src/app/dist /usr/src/app/dist
COPY --chown=node:node --from=source /usr/src/app/.env /usr/src/app/.env

CMD ["node", "dist/app.js"]
