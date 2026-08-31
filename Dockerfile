FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S lorah && adduser -S lorah -G lorah
RUN apk add --no-cache su-exec
COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=lorah:lorah package.json ./
COPY --chown=lorah:lorah src ./src
COPY --chown=lorah:lorah migrations ./migrations
COPY --chown=lorah:lorah scripts ./scripts
COPY --chown=lorah:lorah storage ./storage
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod 755 /usr/local/bin/docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/server/index.js"]
