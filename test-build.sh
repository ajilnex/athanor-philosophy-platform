#!/bin/bash

# Script de test pour vérifier le build localement
echo "🔧 Test de build local pour FEU HUMAIN"
echo "======================================="

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Générer Prisma Client
echo "🔨 Génération du client Prisma..."
npx prisma generate

# Tester le typecheck d'abord (plus rapide)
echo "📝 Vérification des types TypeScript..."
npm run typecheck

# Si le typecheck passe, tenter le build complet
if [ $? -eq 0 ]; then
    echo "✅ TypeScript OK, lancement du build complet..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build réussi!"
        exit 0
    else
        echo "❌ Build échoué"
        exit 1
    fi
else
    echo "❌ Erreurs TypeScript détectées"
    exit 1
fi