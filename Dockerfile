FROM node:25-alpine3.22 AS builder
RUN npm install -g pnpm
WORKDIR /app

COPY pnpm-lock.yaml package.json ./
COPY prisma ./prisma/

# On installe tout
RUN pnpm install --frozen-lockfile

COPY . .

# LA MÉTHODE PROPRE : 
# On génère les types SvelteKit ET Prisma en une seule fois
# avant de lancer le build final.
# On définit des variables temporaires pour que Better-Auth et SvelteKit
# On définit les variables de manière globale pour le BUILD
ENV BETTER_AUTH_SECRET="build_only_secret_123456789_dont_use_in_prod"
ENV BETTER_AUTH_URL="http://localhost:3000"
ENV PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
ENV DB_URL="postgresql://user:pass@localhost:5432/db"
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Maintenant on lance tout, Vite les verra forcément
RUN pnpm svelte-kit sync && npx prisma generate && pnpm run build

# --- Image de production ---
FROM node:25-alpine3.22
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "build/index.js"]