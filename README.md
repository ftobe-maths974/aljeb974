# Aljeb974

**Clone HTML5 pédagogique de *DragonBox Algebra 12+*** — apprends à résoudre des équations en manipulant des cartes.

🎮 **Jouer en ligne :** https://ftobe-maths974.github.io/aljeb974/

> Portage en cours de l'ancienne version CoffeeScript/jQuery vers **Svelte 5 + Vite + TypeScript**.
> L'ancien code reste consultable dans [`legacy/`](./legacy/) comme référence de comportement.

---

## Pour les enseignants

Le jeu propose 100 niveaux progressifs (5 chapitres × 20 niveaux) qui amènent l'élève des manipulations les plus simples (élimination de zéros, opposés) jusqu'à la résolution complète d'équations à une inconnue avec fractions, factorisations et signes.

📖 Documents pédagogiques :
- [migration/SPEC_DSL.md](./migration/SPEC_DSL.md) — spécification du DSL des niveaux, sémantique, table des capacités progressives.
- [migration/PEDAGOGIE.md](./migration/PEDAGOGIE.md) — **catalogue des 14 fragilités élèves** détectables via le jeu (cécité aux opposés, `=` unidirectionnel, linéarité fantôme, piège `x=0`, etc.) + heatmap fragilité × chapitre + pistes d'évolution.

Standards Common Core couverts : 6.NS.B → 6.EE → 7.EE → 8.EE.C.7 → HSA.REI.B.3 (cf. [commoncorestandardsdragonboxalgebra12-1.pdf](./commoncorestandardsdragonboxalgebra12-1.pdf)).

---

## Intégration iframe (site maths974)

Recommandation : **modale plein écran**, l'iframe occupe la viewport visible.

```html
<iframe
  src="https://ftobe-maths974.github.io/aljeb974/"
  title="Aljeb974"
  allow="fullscreen"
  style="width: 100%; height: 100%; border: 0;"
></iframe>
```

L'app est conçue pour :
- mode **paysage forcé** sur smartphone (un écran de rappel s'affiche en portrait) ;
- absence de scroll vertical ;
- contenu seul (pas de bandeau cookies, pas de header parasite) — pensé pour s'intégrer proprement dans une modale.

---

## Développement

### Pré-requis
- Node.js ≥ 20 (testé sur 22 et 24)
- npm ≥ 10

### Setup

```bash
npm install
npm run dev          # → http://localhost:5173  (et accessible sur le LAN pour tester smartphone)
```

### Build production

```bash
NODE_ENV=production npm run build   # → dist/
npm run preview                     # sert dist/ localement pour vérifier
```

### Régénérer les niveaux depuis le code legacy

```bash
npm run convert      # legacy/js/application.coffee → migration/levels.json
```

### Vérification de types

```bash
npm run typecheck
```

---

## Déploiement

Push sur `main` → workflow GitHub Actions [`deploy.yml`](./.github/workflows/deploy.yml) → publication automatique sur GitHub Pages.

Premier déploiement : il faut activer Pages dans les *Settings* du repo :
- *Settings* > *Pages*
- *Source* : "GitHub Actions"

---

## Architecture du dépôt

```
.
├── .github/workflows/deploy.yml   # CI/CD GitHub Pages
├── src/                           # code Svelte 5 (en construction)
│   ├── App.svelte
│   ├── main.ts
│   ├── app.css
│   └── lib/
│       └── OrientationGate.svelte
├── migration/                     # outillage et docs de portage
│   ├── SPEC_DSL.md
│   ├── PEDAGOGIE.md
│   ├── types.ts                   # schéma Zod + parser DSL
│   ├── levels.json                # 100 niveaux générés (validés)
│   └── scripts/
│       └── convert-legacy.ts      # CoffeeScript → JSON
├── legacy/                        # ANCIEN code v1, figé en lecture
│   ├── index.html
│   ├── js/application.coffee
│   └── ...
├── public/                        # assets statiques (favicon, …)
├── index.html                     # entrée Vite
├── vite.config.ts                 # base path = /aljeb974/ en prod
├── package.json
└── tsconfig.json
```

---

## Licence et crédits

Code original 100% écrit par l'auteur, publié sous licence libre (cf. fichier LICENSE à venir).
Inspiré de **DragonBox Algebra 12+** (We Want to Know AS) pour la mécanique pédagogique.

Auteur : [@ftobe-maths974](https://github.com/ftobe-maths974) — maths974.fr (académie de la Réunion).
