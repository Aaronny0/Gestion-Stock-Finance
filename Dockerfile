# syntax=docker/dockerfile:1.7
FROM node:22.23.0-bookworm-slim AS dependencies
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.8.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY vendor ./vendor
RUN --mount=type=cache,id=Gestion-Stock-Finance-pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
FROM dependencies AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN pnpm build
FROM node:22.23.0-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
