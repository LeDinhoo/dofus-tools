#!/bin/bash
set -e  # Arrête le script si une commande échoue

echo "🚀 Démarrage du processus de déploiement..."

# Configuration
IMAGE_NAME="ghcr.io/ledinhoo/dofus-tools/dftools"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Vérifier si on veut un tag spécifique ou latest
TAG="${1:-latest}"

echo "📦 Building l'image Docker..."
docker build -t ${IMAGE_NAME}:${TAG} .

# Si c'est un tag custom, on tag aussi en latest
if [ "$TAG" != "latest" ]; then
    echo "🏷️  Tagging aussi en latest..."
    docker tag ${IMAGE_NAME}:${TAG} ${IMAGE_NAME}:latest
fi

echo "🔐 Vérification de l'authentification GitHub Container Registry..."
# Note: Il faut être connecté avec: docker login ghcr.io -u USERNAME
# avec un Personal Access Token (PAT) avec les permissions packages

echo "📤 Push de l'image vers GitHub Container Registry..."
docker push ${IMAGE_NAME}:${TAG}

if [ "$TAG" != "latest" ]; then
    docker push ${IMAGE_NAME}:latest
fi

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
