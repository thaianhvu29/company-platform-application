FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev


FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./

RUN chown -R node:node /app

USER node

EXPOSE 3000

CMD ["node", "server.js"]
