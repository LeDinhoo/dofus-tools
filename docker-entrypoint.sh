#!/bin/sh
set -e

echo "🔄 Syncing database schema..."
npx prisma db push --accept-data-loss

echo "✅ Migrations completed successfully"
echo "🚀 Starting application..."

exec node build/index.js
