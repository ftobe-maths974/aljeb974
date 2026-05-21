# Aljeb974

**Clone HTML5 pédagogique de *DragonBox Algebra 12+*** — l'élève apprend à résoudre une équation en manipulant des cartes, sans jamais lire le mot « algèbre ».

[Jouer en ligne](https://ftobe-maths974.github.io/aljeb974/) · [Documentation pédagogique](./migration/PEDAGOGIE.md) · [Spec moteur](./migration/SPEC_DSL.md)

```
                 x        s
              [   ] + 1 = ---
              [ 2 ]        1

         pioche :  [ 1 ]  [ 2 ]  [ 4 ]
```

100 niveaux progressifs, 14 super-pouvoirs débloqués un à un, équilibre de balance, fractions, factorisation, signes. Tout en français et en anglais, pensé pour le smartphone en mode paysage.

---

## Pour les enseignants

Le jeu amène l'élève de l'élimination du zéro (niveau 1-1) jusqu'à la résolution d'équations linéaires complètes (`ax + b = c/x`), en passant par les fractions, la décomposition en facteurs premiers et la gestion du signe.

| Chapitre | Concept central                      | Niveau-clé d'introduction      |
|---------:|--------------------------------------|--------------------------------|
| 1        | Zéro, opposés, balance, pioche       | 1-1, 1-3, 1-5, 1-9, 1-16       |
| 2        | Fractions, simplification num/dén    | 2-1, 2-5, 2-11                 |
| 3        | Changement de membre (= balance)     | 3-1, 3-7                       |
| 4        | Addition, factorisation, produit     | 4-1, 4-4, 4-8                  |
| 5        | Signe `−1` comme atome manipulable   | 5-1                            |

Chaque niveau-clé déclenche une notification explicative ("Zéro c'est rien !", "Les opposés s'annulent !", "Je divise les deux côtés !") et un pouf de vapeur ancré sur la carte concernée. Le langage est simple et imagé — l'élève peut jouer sans aide d'adulte.

### Documentation pédagogique

- [`migration/PEDAGOGIE.md`](./migration/PEDAGOGIE.md) — **catalogue des 14 fragilités élèves** détectables via le jeu (cécité aux opposés, `=` unidirectionnel, linéarité fantôme, piège `x = 0`…), heatmap fragilité × chapitre, et pistes d'évolution.
- [`migration/SPEC_DSL.md`](./migration/SPEC_DSL.md) — sémantique formelle du moteur, table des capacités progressives, format JSON des niveaux.
- [`migration/MECHANICS.md`](./migration/MECHANICS.md) — récapitulatif des mécaniques de jeu.

Standards Common Core couverts : `6.NS.B → 6.EE → 7.EE → 8.EE.C.7 → HSA.REI.B.3` (cf. [commoncorestandardsdragonboxalgebra12-1.pdf](./commoncorestandardsdragonboxalgebra12-1.pdf)).

---

## Pour les développeurs

### Stack

- **Svelte 5** (runes `$state` / `$derived` / `$effect`) + **TypeScript strict**
- **Vite 6** — base path `/aljeb974/` en production
- **Zod** — validation à la génération du JSON des niveaux
- **Vitest** — tests unitaires sur le moteur
- **Pointer Events** — drag & drop maison, touch-friendly (pas de HTML5 drag natif)
- **i18n** : FR + EN, persistance `localStorage`

### Architecture

Le projet sépare strictement **moteur pur** et **UI réactive**, ce qui permet de tester toute la logique de jeu sans monter Svelte.

```
src/
├── lib/engine/                     moteur pur, 100% testable
│   ├── atoms.ts                    Atom = unknown | literal | symbol
│   ├── state.ts                    GameState immuable
│   ├── dsl.ts                      schéma Zod + Capabilities + capabilitiesFor()
│   ├── operations.ts               29 ops : deleteZero, cancelOpposites,
│   │                               startPiocheDrop, completePiocheDrop,
│   │                               moveAcross, simplifyFraction, factorize,
│   │                               addLiterals, multiplyInFraction,
│   │                               applyNegOne, fillHole, divideAll,
│   │                               multiplyAllNum, …
│   ├── solver.ts                   isSolved + stars (penalité shots > target)
│   └── __tests__/                  vitest
├── state/                          stores réactifs ($state) qui enveloppent le moteur
│   ├── game.svelte.ts              applyState, recordShot, tryDrop, tryCardDrop,
│   │                               tryFactorize, victoryReady…
│   ├── drag.svelte.ts              action `draggable` + `draggableCard`,
│   │                               picker via document.elementsFromPoint
│   ├── fx.svelte.ts                puffs / slogans ancrés sur cartes
│   └── astuce.svelte.ts            timer + main d'aide contextuelle
├── components/                     17 composants Svelte
│   ├── Side.svelte                 plateau de balance (lhs/rhs/pioche)
│   ├── Fraction.svelte             num + bar + den, draggable
│   ├── Card.svelte                 carte atomique (clic, double-clic, drag)
│   ├── Balance.svelte              pivot + bascule visuelle
│   ├── DivideZone.svelte / MultiplyZone.svelte   drop sous/sur la balance
│   ├── DragGhost.svelte            ghost overlay pendant le drag
│   ├── VictoryOverlay.svelte       feux d'artifice à 3 étoiles
│   └── …
├── i18n/                           store + locales fr/en
├── data/key-levels.ts              ids des 14 niveaux-clés
└── App.svelte                      home → menu → play
```

Le moteur est **immuable** : chaque opération renvoie un nouveau `GameState`. Les stores Svelte font la liaison avec l'UI via `applyState(newState)`.

### Tableau des super-pouvoirs (gating progressif)

Les capacités s'activent **pile au niveau-clé qui les introduit** et restent ensuite acquises pour tous les niveaux supérieurs (cf. [`src/lib/engine/dsl.ts`](./src/lib/engine/dsl.ts)).

| Capacité            | Débloqué à | Effet                                                             |
|---------------------|:----------:|-------------------------------------------------------------------|
| `dropOnce`          | (chap. 1)  | Les cartes de la pioche sont consommées à l'usage                 |
| `reversePower`      | 1-16       | Clic sur carte pioche → inverse son signe                         |
| `dropdenPower`      | 2-11       | Drop sur dénominateur (et plus tard zone « ÷ » sous balance)      |
| `crossPower`        | 3-1        | Drag d'un membre à l'autre = inversion automatique du signe       |
| `dropnumPower`      | 3-7        | Drop sur numérateur (et zone « × » au-dessus de la balance)       |
| `addPower`          | 4-1        | Drop nombre sur nombre → addition numérique                       |
| `primeFactorPower`  | 4-4        | Double-clic sur littéral > 3 → décomposition en facteurs premiers |
| `multPower`         | 4-8        | Drag intra-fraction → multiplication numérique                    |
| `negPower`          | 5-1        | Drag d'un `−1` sur un voisin = prendre l'opposé ; factorisation autorisée sur les négatifs |

### Lancer en local

Pré-requis : Node ≥ 20.

```bash
npm install
npm run dev          # http://localhost:5173 (accessible sur le LAN pour tester smartphone)
npm run typecheck    # svelte-check + tsc strict sur migration/
npm run test         # vitest run
```

### Build production

```bash
NODE_ENV=production npm run build   # → dist/
npm run preview                     # sert dist/ pour vérifier le bundle
```

### Régénérer les niveaux depuis le code legacy

L'ancien jeu CoffeeScript reste dans [`legacy/`](./legacy/) comme référence de comportement. Le script convertit `application.coffee` en `migration/levels.json`, validé par Zod.

```bash
npm run convert
```

---

## Intégration iframe (site `maths974.fr`)

Recommandation : **modale plein écran**.

```html
<iframe
  src="https://ftobe-maths974.github.io/aljeb974/"
  title="Aljeb974"
  allow="fullscreen"
  style="width: 100%; height: 100%; border: 0;"
></iframe>
```

L'application est conçue pour :

- mode **paysage forcé** sur smartphone (écran de rappel en portrait) ;
- aucune barre de défilement vertical ;
- aucun bandeau parasite (pas de cookies, pas de header) — s'intègre proprement dans une modale.

---

## Déploiement

Push sur `main` → workflow [`deploy.yml`](./.github/workflows/deploy.yml) → publication automatique sur GitHub Pages.

Au premier déploiement : *Settings* > *Pages* > *Source* : **GitHub Actions**.

---

## Crédits

Code original 100% écrit par l'auteur. Inspiré de **DragonBox Algebra 12+** (We Want to Know AS) pour la mécanique pédagogique — aucun asset ni code commun.

[@ftobe-maths974](https://github.com/ftobe-maths974) — académie de la Réunion · [maths974.fr](https://maths974.fr)
