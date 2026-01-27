FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --production

FROM node:20-alpine
WORKDIR /app

# Install sqlite3 for database initialization
RUN apk add --no-cache sqlite

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy scripts for admin tasks
COPY --from=builder /app/scripts ./scripts

# Copy schema and entrypoint
COPY src/lib/server/db/schema.sql ./schema.sql
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
VOLUME /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

ENTRYPOINT ["./docker-entrypoint.sh"]
