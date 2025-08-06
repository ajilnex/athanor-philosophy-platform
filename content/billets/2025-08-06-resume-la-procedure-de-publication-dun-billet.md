---
title: Résume la procédure de publication d'un billet
tags: [publication, site, markdown, git]
---

Pour publier un billet sur le site, il suffit de rédiger un fichier Markdown et de l’enregistrer dans le dossier `content/billets/` du dépôt local, en le nommant selon le format `YYYY-MM-DD-titre.md`.

Lors du `git push`, Vercel le détecte automatiquement et publie le billet. Il est ensuite disponible à l’URL :

`https://athanor.vercel.app/billets/slug-du-billet`
