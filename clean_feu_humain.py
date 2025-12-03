#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script simple pour nettoyer l'encodage du fichier JSON
Usage: python3 clean_feu_humain.py
"""

import json
import os

# Dictionnaire des remplacements
REPLACEMENTS = {
    'Ã©': 'é',
    'Ã¨': 'è',
    'Ã ': 'à',
    'Ã¢': 'â',
    'Ã§': 'ç',
    'Ã´': 'ô',
    'Ã®': 'î',
    'Ã¯': 'ï',
    'Ã«': 'ë',
    'Ã¹': 'ù',
    'Ã»': 'û',
    'Ã¼': 'ü',
    'Ã¶': 'ö',
    'Ã±': 'ñ',
    'Ã€': 'À',
    'Ã‰': 'É',
    'ÃŠ': 'Ê',
    'Ã‡': 'Ç',
    'Å"': 'œ',
    'â€™': "'",
    'â€˜': "'",
    'â€œ': '"',
    'â€': '"',
    'â€"': '—',
    'â€¦': '...',
    'Â ': ' ',
    'nÂ°': 'n°',
}

def clean_text(text):
    """Nettoie le texte en remplaçant les caractères mal encodés"""
    if not text:
        return text
    
    result = text
    for bad, good in REPLACEMENTS.items():
        result = result.replace(bad, good)
    
    return result

def main():
    input_file = 'public/FEU HUMAIN/message_1.json'
    output_file = 'public/FEU HUMAIN/message_1_clean.json'
    
    print("🧹 Nettoyage du fichier FEU HUMAIN")
    print("=" * 40)
    
    # Lire le fichier
    print(f"\n📖 Lecture de {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"✅ {len(data['messages'])} messages trouvés")
    
    # Nettoyer les données
    print("\n🧹 Nettoyage en cours...")
    
    # Nettoyer le titre
    if 'title' in data:
        data['title'] = clean_text(data['title'])
    
    # Nettoyer les participants
    for participant in data.get('participants', []):
        participant['name'] = clean_text(participant['name'])
    
    # Nettoyer les messages
    messages_cleaned = 0
    for message in data.get('messages', []):
        # Nettoyer le contenu
        if 'content' in message and message['content']:
            original = message['content']
            message['content'] = clean_text(message['content'])
            if original != message['content']:
                messages_cleaned += 1
        
        # Nettoyer le nom de l'expéditeur
        if 'sender_name' in message:
            message['sender_name'] = clean_text(message['sender_name'])
        
        # Nettoyer les réactions
        if 'reactions' in message:
            for reaction in message['reactions']:
                reaction['actor'] = clean_text(reaction['actor'])
    
    print(f"✅ {messages_cleaned} messages nettoyés")
    
    # Sauvegarder le fichier nettoyé
    print(f"\n💾 Sauvegarde dans {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("✅ Nettoyage terminé avec succès !")
    print("\n📌 Prochaines étapes :")
    print("  1. Vérifiez le fichier : message_1_clean.json")
    print("  2. Importez-le via l'interface admin")

if __name__ == "__main__":
    main()
