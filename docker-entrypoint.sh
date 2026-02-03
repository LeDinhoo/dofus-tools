#!/bin/sh
set -e

echo "🔄 Syncing database schema..."
npx prisma db push --skip-generate

echo "✅ Migrations completed successfully"
echo "🚀 Starting application..."

exec node build/index.js
