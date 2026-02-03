#!/bin/bash
set -e  # Arrête le script si une commande échoue

echo "🚀 Démarrage du processus de déploiement..."

# Configuration
IMAGE_NAME="ghcr.io/ledinhoo/dofus-tools/dftools"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# VPS Configuration (modifie ces valeurs)
VPS_HOST="${VPS_HOST:-81.17.100.156}"
VPS_USER="${VPS_USER:-root}"
VPS_PATH="${VPS_PATH:-/root/dofus-tools}"

# Vérifier si on veut un tag spécifique ou latest
TAG="${1:-latest}"

echo "🔧 Création du builder multi-plateforme si nécessaire..."
docker buildx create --name multiplatform --use 2>/dev/null || docker buildx use multiplatform

echo "📦 Building l'image Docker pour linux/amd64..."
if [ "$TAG" != "latest" ]; then
    echo "🏷️  Building avec tag ${TAG} et latest..."
    docker buildx build \
        --platform linux/amd64 \
        -t ${IMAGE_NAME}:${TAG} \
        -t ${IMAGE_NAME}:latest \
        --push \
        .
else
    docker buildx build \
        --platform linux/amd64 \
        -t ${IMAGE_NAME}:${TAG} \
        --push \
        .
fi

echo ""
echo "✅ Image poussée avec succès!"
echo "   - ${IMAGE_NAME}:${TAG}"
if [ "$TAG" != "latest" ]; then
    echo "   - ${IMAGE_NAME}:latest"
fi

echo ""
echo "🖥️  Déploiement sur le VPS (${VPS_USER}@${VPS_HOST})..."
ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PATH} && docker compose pull && docker compose up -d"

echo ""
echo "✅ Déploiement terminé avec succès!"
echo ""
