# Multi-stage Dockerfile
FROM node:24-alpine AS base
WORKDIR /usr/src/app
RUN apk add --no-cache libc6-compat

# Development stage
FROM base AS development
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production builder
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# Production stage
FROM node:24-alpine AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
