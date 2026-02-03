# syntax=docker/dockerfile:1.4
FROM node:22-bookworm-slim AS builder

# Installer pnpm via corepack (plus rapide)
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copier uniquement les fichiers de dépendances d'abord (meilleur cache)
COPY pnpm-lock.yaml package.json ./
COPY prisma ./prisma/

# Installer avec cache mount (réutilise le cache pnpm entre builds)
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .

ENV BETTER_AUTH_SECRET="build_only_secret_123456789_dont_use_in_prod"
ENV BETTER_AUTH_URL="http://localhost:3000"
ENV PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
ENV DB_URL="postgresql://user:pass@localhost:5432/db"
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

RUN pnpm svelte-kit sync && npx prisma generate && pnpm run build:raw

# Stage final
FROM node:22-bookworm-slim AS runtime

RUN corepack enable && corepack prepare pnpm@latest --activate

# Installer dépendances Playwright en une seule commande
RUN npx playwright install-deps chromium && npx playwright install chromium

WORKDIR /app

# Copier les fichiers nécessaires
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
