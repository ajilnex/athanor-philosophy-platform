---
title: "Publier un billet avec termd → Termux → GitHub → Vercel (procédure compacte)"
---

# Publier un billet avec **termd → Termux → GitHub → Vercel** (procédure compacte)

Ce billet documente le flux complet que j’utilise sur mobile :

1. **`termd:`** je dicte à GPT le sujet / contenu. GPT renvoie un **Markdown final** + une **séquence bash unique**.
2. **Termux (Android)** : je colle la séquence, qui :
   - installe `git` + `gh` (GitHub CLI),
   - vérifie la connexion GitHub (device flow),
   - se cale sur `main` propre (`git pull --ff-only`),
   - crée une branche `feat/billet-…`,
   - écrit le fichier via **heredoc** (pas d’éditeur),
   - `git add` → `commit` → `push`,
   - crée une **PR** (`gh pr create`) puis **fusionne en squash** (`gh pr merge --squash --delete-branch`),
   - revient sur `main` et récupère le merge, puis ping `/api/health`.

3. **Vercel** déploie automatiquement après le merge. Le billet apparaît sur `/billets` et sa page dédiée.

## Pourquoi ça évite les embrouilles ?
- **Toujours `git pull --ff-only` sur `main`** avant de travailler → pas de merge cracra.
- **Une branche par billet** → PR claire, review/rollback faciles.
- **Squash merge** → historique propre (1 commit par billet sur `main`).
- **Heredoc** → pas d’éditeur interactif, fiable sur mobile.

## Liens internes (exemples)
- Procédure liée : [[2025-08-06-resume-la-procedure-de-publication-dun-billet]]
- Exemple d’analyse : [[2025-08-10-18-56-32-intelligence-and-spirit-negarestani]]
- Exemple artistique corrélé : [[2025-08-10-iri-berkleid-sublime-bacteriologique]]

## Check-list rapide (mémo)
- `termd:` à GPT → recevoir le bloc bash + le Markdown.
- Coller le bloc dans **Termux**.
- Si `gh` demande un **code** & **URL**, valider dans le navigateur.
- Retour Termux : laisser le script **créer PR + squash-merge**.
- Vérifier déploiement Vercel (ping `/api/health`, puis voir `/billets`).

*(Ce billet a été généré et publié via la procédure qu’il décrit.)*
