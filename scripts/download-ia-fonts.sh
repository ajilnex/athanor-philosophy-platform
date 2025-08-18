#!/bin/bash
# chmod +x scripts/download-ia-fonts.sh pour rendre exécutable

# Script pour télécharger les fonts iA Writer localement
# Cela améliore les performances et évite la dépendance à GitHub

echo "📥 Téléchargement des fonts iA Writer Duo..."

# Créer le dossier si nécessaire
mkdir -p public/fonts/ia-writer

# URLs des fonts depuis le repo officiel
BASE_URL="https://github.com/iaolo/iA-Fonts/raw/master/iA%20Writer%20Duo"

# Télécharger les versions Variable (recommandées)
echo "Téléchargement des fonts variables..."
curl -L "${BASE_URL}/Variable/iAWriterDuoV.ttf" -o public/fonts/ia-writer/iAWriterDuoV.ttf
curl -L "${BASE_URL}/Variable/iAWriterDuoV-Italic.ttf" -o public/fonts/ia-writer/iAWriterDuoV-Italic.ttf

# Télécharger les versions Static comme fallback
echo "Téléchargement des fonts statiques (fallback)..."
curl -L "${BASE_URL}/Static/iAWriterDuoS-Regular.woff2" -o public/fonts/ia-writer/iAWriterDuoS-Regular.woff2
curl -L "${BASE_URL}/Static/iAWriterDuoS-Bold.woff2" -o public/fonts/ia-writer/iAWriterDuoS-Bold.woff2
curl -L "${BASE_URL}/Static/iAWriterDuoS-Italic.woff2" -o public/fonts/ia-writer/iAWriterDuoS-Italic.woff2
curl -L "${BASE_URL}/Static/iAWriterDuoS-BoldItalic.woff2" -o public/fonts/ia-writer/iAWriterDuoS-BoldItalic.woff2

echo "✅ Fonts téléchargées avec succès !"
echo ""
echo "Pour utiliser les fonts locales, mettez à jour le fichier:"
echo "  public/fonts/ia-writer-fonts.css"
echo ""
echo "Remplacez les URLs GitHub par:"
echo "  /fonts/ia-writer/[nom-du-fichier]"
