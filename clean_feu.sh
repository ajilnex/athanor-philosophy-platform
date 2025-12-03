#!/bin/bash

# Script bash pour nettoyer l'encodage
echo "🧹 Nettoyage du fichier FEU HUMAIN..."

# Créer une copie de sauvegarde
cp "public/FEU HUMAIN/message_1.json" "public/FEU HUMAIN/message_1_original.json"

# Appliquer les remplacements
cat "public/FEU HUMAIN/message_1.json" | \
  sed 's/Ã©/é/g' | \
  sed 's/Ã¨/è/g' | \
  sed 's/Ã /à/g' | \
  sed 's/Ã¢/â/g' | \
  sed 's/Ã§/ç/g' | \
  sed 's/Ã´/ô/g' | \
  sed 's/Ã®/î/g' | \
  sed 's/Ã¯/ï/g' | \
  sed 's/Ã«/ë/g' | \
  sed 's/Ã¹/ù/g' | \
  sed 's/Ã»/û/g' | \
  sed 's/Ã€/À/g' | \
  sed 's/Ã‰/É/g' | \
  sed 's/ÃŠ/Ê/g' | \
  sed 's/Ã‡/Ç/g' | \
  sed 's/Å"/œ/g' | \
  sed 's/â€™/'\''/g' | \
  sed 's/â€œ/"/g' | \
  sed 's/â€/"/g' | \
  sed 's/â€"/—/g' | \
  sed 's/â€¦/.../g' | \
  sed 's/Â / /g' | \
  sed 's/nÂ°/n°/g' \
  > "public/FEU HUMAIN/message_1_clean.json"

echo "✅ Fichier nettoyé créé : message_1_clean.json"
echo "📌 Vous pouvez maintenant l'importer via l'interface admin"
