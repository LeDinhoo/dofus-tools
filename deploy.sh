#!/bin/bash
set -e  # Arrête le script si une commande échoue

echo "🚀 Démarrage du processus de déploiement..."

# Configuration
IMAGE_NAME="ghcr.io/ledinhoo/dofus-tools/dftools"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Vérifier si on veut un tag spécifique ou latest
TAG="${1:-latest}"

echo "🔧 Création du builder multi-plateforme si nécessaire..."
docker buildx create --name multiplatform --use 2>/dev/null || docker buildx use multiplatform

echo "📦 Building l'image Docker pour linux/amd64 et linux/arm64..."
if [ "$TAG" != "latest" ]; then
    echo "🏷️  Building avec tag ${TAG} et latest..."
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        -t ${IMAGE_NAME}:${TAG} \
        -t ${IMAGE_NAME}:latest \
        --push \
        .
else
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        -t ${IMAGE_NAME}:${TAG} \
        --push \
        .
fi

echo "🔐 Note: Assurez-vous d'être connecté avec: docker login ghcr.io -u USERNAME"

echo ""
echo "✅ Déploiement terminé avec succès!"
echo ""
echo "📋 Image poussée:"
echo "   - ${IMAGE_NAME}:${TAG}"
if [ "$TAG" != "latest" ]; then
    echo "   - ${IMAGE_NAME}:latest"
fi
echo ""
echo "🖥️  Pour déployer sur le VPS:"
echo "   ssh user@your-vps"
echo "   cd /path/to/dofus-tools"
echo "   docker compose pull"
echo "   docker compose up -d"
echo ""
