#!/bin/bash

# Script de test pour l'archive FEU HUMAIN
# Usage: ./test-feu-humain.sh

echo "🔥 Test de l'archive FEU HUMAIN"
echo "================================"

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier la présence du dossier
echo -e "\n📁 Vérification de la structure..."
if [ -d "public/FEU HUMAIN" ]; then
    echo -e "${GREEN}✓${NC} Dossier FEU HUMAIN trouvé"
else
    echo -e "${RED}✗${NC} Dossier FEU HUMAIN non trouvé dans public/"
    echo "   Créez le dossier et placez-y votre export Messenger"
    exit 1
fi

# Vérifier le fichier JSON
echo -e "\n📄 Vérification du fichier JSON..."
if [ -f "public/FEU HUMAIN/message_1.json" ]; then
    echo -e "${GREEN}✓${NC} Fichier message_1.json trouvé"
    
    # Vérifier la validité du JSON
    if python3 -m json.tool "public/FEU HUMAIN/message_1.json" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} JSON valide"
    else
        echo -e "${YELLOW}⚠${NC} Le fichier JSON pourrait être invalide"
    fi
else
    echo -e "${RED}✗${NC} Fichier message_1.json non trouvé"
    echo "   Placez votre export Messenger dans public/FEU HUMAIN/"
    exit 1
fi

# Vérifier les dossiers de médias
echo -e "\n📸 Vérification des dossiers de médias..."
for folder in photos videos audio gifs files; do
    if [ -d "public/FEU HUMAIN/$folder" ]; then
        count=$(ls -1 "public/FEU HUMAIN/$folder" 2>/dev/null | wc -l)
        echo -e "${GREEN}✓${NC} Dossier $folder trouvé ($count fichiers)"
    else
        echo -e "${YELLOW}⚠${NC} Dossier $folder non trouvé (optionnel)"
    fi
done

# Vérifier les fichiers de l'application
echo -e "\n🎯 Vérification des fichiers de l'application..."
files=(
    "app/admin/feu-humain/page.tsx"
    "app/admin/feu-humain/ExportButtons.tsx"
    "app/admin/feu-humain/config.ts"
    "app/admin/feu-humain/hooks.ts"
    "app/admin/feu-humain/README.md"
)

all_files_present=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file manquant"
        all_files_present=false
    fi
done

# Vérifier les dépendances
echo -e "\n📦 Vérification des dépendances..."
if [ -f "package.json" ]; then
    if grep -q "analyze:feu-humain" package.json; then
        echo -e "${GREEN}✓${NC} Script d'analyse configuré"
    else
        echo -e "${YELLOW}⚠${NC} Script d'analyse non trouvé dans package.json"
    fi
fi

# Résumé
echo -e "\n📊 Résumé"
echo "========="
if [ "$all_files_present" = true ] && [ -f "public/FEU HUMAIN/message_1.json" ]; then
    echo -e "${GREEN}✅ L'archive est prête !${NC}"
    echo ""
    echo "Pour lancer l'application :"
    echo "  1. npm run dev"
    echo "  2. Ouvrir http://localhost:3000/admin/feu-humain"
    echo ""
    echo "Pour analyser la conversation :"
    echo "  npm run analyze:feu-humain"
else
    echo -e "${YELLOW}⚠ Configuration incomplète${NC}"
    echo "Vérifiez les éléments manquants ci-dessus"
fi

echo -e "\n🔥 Fin du test"
