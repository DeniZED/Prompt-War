# Prompt Battle Arena ⚔️

Plateforme web de mini-jeux IA communautaires. Les joueurs s'affrontent en écrivant des prompts sur un thème imposé — l'IA génère les images, la communauté vote.

**L'IA donne les outils, les joueurs font le jeu.**

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** — thème dark gaming
- **Supabase** — DB, Auth, Realtime
- **Discord OAuth** — connexion via Supabase
- **Claude Haiku** — génération de thèmes + modération
- **fal.ai Flux Schnell** — génération d'images

## Boucle de jeu

```
[Lobby] → [Prompt 60s] → [Génération IA] → [Vote 30s] → [Résultats] → ...
```

## Setup

### 1. Variables d'environnement

Copie `.env.example` en `.env.local` et remplis :

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de ton projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase |
| `ANTHROPIC_API_KEY` | Clé API Anthropic (Claude) |
| `FAL_KEY` | Clé API fal.ai |
| `NEXT_PUBLIC_APP_URL` | URL de l'app (`http://localhost:3000` en dev) |

### 2. Base de données Supabase

Dans le SQL editor de ton projet Supabase, exécute :

```
supabase/migrations/001_initial.sql
```

Ce script crée les tables, les politiques RLS, les index et la fonction `increment_xp`.

### 3. Discord OAuth

Dans Supabase → Authentication → Providers → Discord :
- Active Discord
- Ajoute l'URL de callback : `https://ton-projet.supabase.co/auth/v1/callback`
- Configure les mêmes credentials dans le portail Discord Developer

### 4. Realtime Supabase

Dans Supabase → Database → Replication, active Realtime pour les tables :
- `rooms`
- `room_players`
- `prompts`
- `votes`

### 5. Lancer en dev

```bash
npm install
npm run dev
```

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/            # Tableau de bord joueur
│   ├── room/create/          # Création de salle
│   ├── room/[code]/          # Salle de jeu (toutes les phases)
│   ├── leaderboard/          # Classement global
│   └── api/
│       ├── rooms/            # CRUD salles
│       ├── prompts/          # Soumission de prompts
│       ├── votes/            # Votes
│       └── ai/               # Génération thèmes + images
├── components/
│   ├── game/                 # Lobby, Prompt, Generating, Voting, Results
│   ├── layout/               # Header
│   └── ui/                   # Button, Card, Input, Badge, Timer
├── lib/
│   ├── supabase/             # Client browser + server
│   ├── ai/                   # Themes (Claude) + Moderation
│   └── utils.ts
└── types/index.ts            # Interfaces TypeScript
```

## Déploiement (Vercel)

```bash
vercel deploy
```

Ajoute les variables d'environnement dans le dashboard Vercel. Change `NEXT_PUBLIC_APP_URL` vers ton domaine de production.
