# syntax=docker/dockerfile:1

# ---- 1. build the static site ------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app

# install dependencies first so this layer is cached between source edits
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY tsconfig.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src

# typecheck + unit tests + production bundle (fails the image build on any error)
RUN npm test && npm run build

# ---- 2. serve it -------------------------------------------------------------
FROM nginx:1.29-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
