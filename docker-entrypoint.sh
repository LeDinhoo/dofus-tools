#!/bin/sh
set -e

echo " Syncing database schema..."
if ! npx prisma db push --accept-data-loss; then
    echo "⚠️ Schema sync failed. Attempting to reset equipment tables..."
    # Exécute le script SQL pour supprimer et recréer uniquement les tables d'équipement
    npx prisma db execute --file prisma/migrations/manual_equipment_sets.sql
    
    echo "🔄 Retrying schema sync..."
    npx prisma db push --accept-data-loss
fi

echo "✅ Migrations completed successfully"
echo "🚀 Starting application..."

exec node build/index.js