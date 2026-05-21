# Mécaniques pédagogiques cachées — analyse du legacy

> Document qui détaille trois mécaniques cruciales du legacy que j'avais escamotées dans la première version du moteur Aljeb974. Toutes les trois sont au cœur de la pédagogie *DragonBox-style* — les omettre transforme le jeu en simple puzzle visuel.

Référence : [legacy/js/application.coffee](../legacy/js/application.coffee).

---

## 1. Le « block mode » — enforcement de l'équivalence

### Problème didactique

Quand on résout une équation, **toute opération doit s'appliquer aux deux membres** pour préserver l'égalité. C'est la règle n°1 mais c'est aussi la plus difficile à internaliser (cf. F2 dans [PEDAGOGIE.md](./PEDAGOGIE.md) — *non-préservation de l'équivalence*).

Le legacy ne se contente pas d'appliquer la règle implicitement (comme je l'ai fait dans la v0 du moteur). Il **force l'élève à faire le geste deux fois** — une fois pour chaque membre. C'est ça la pédagogie.

### Implémentation legacy ([application.coffee:774-824](../legacy/js/application.coffee#L774))

Trois entités HTML matérialisent ce mode :

| Marqueur CSS | Sens                                                     | Apparaît quand                                                                            |
|-------------:|----------------------------------------------------------|-------------------------------------------------------------------------------------------|
| `.rootDrop`  | « pose la carte ici aussi pour équilibrer »              | Drop d'une carte de pioche sur lhs ou rhs → un `.rootDrop` apparaît sur l'AUTRE membre    |
| `.DC`        | « pose la carte ici aussi pour ne pas casser la fraction »| Drop d'une carte de pioche dans un dénominateur/numérateur → `.DC` apparaît dans les autres fractions, à la même position |
| `.US`        | « slot vide — déposable depuis la pioche »               | Au survol d'une fraction par une carte de pioche, des slots `_` apparaissent (`dropdenPower`, `dropnumPower`) |

Le passage `block(draggable)` :
1. Désactive toutes les autres cartes (`$( ":ui-draggable" ).not(draggable).draggable( "destroy" )`)
2. Sur clic d'une carte interdite : déclenche `flash_alert(draggable)` — un point d'exclamation `!` qui pointe vers la carte qui doit encore être déposée
3. Seules cibles acceptables : `.DC, .rootDrop`
4. À chaque drop sur une de ces cibles, `blockOrNot()` re-vérifie : s'il en reste, on reste bloqué ; s'il n'en reste plus, `unblock()` libère le jeu et incrémente `shots`.

### Conséquence pour le portage

Mon `dropFromPioche` actuel ([src/lib/engine/operations.ts:205](../src/lib/engine/operations.ts#L205)) ajoute la carte des deux côtés en une seule étape. C'est **mauvais pédagogiquement** : l'élève ne fait pas le 2ᵉ geste.

**À refaire** :
- Découper `dropFromPioche` en deux opérations :
  - `dropFromPiocheStart(side)` → pose la carte sur `side`, crée un état « pending » avec une cible obligatoire sur l'autre membre.
  - `completePending(targetId)` → consomme la cible et finit l'opération.
- Ajouter un champ `pendingDrops: PendingDrop[]` au `GameState`.
- Tant que `pendingDrops` n'est pas vide, **toutes les autres actions sont refusées** par le moteur (équivalent du `blocked = true` legacy).
- Côté UI : afficher la `DropZone` (équivalent de `.rootDrop`), highlighter ce qu'il faut faire, et si l'élève clique ailleurs → afficher un `FlashAlert` qui pointe vers la cible.

---

## 2. `.new-power` — marqueurs de niveaux-clés

### Données ([application.coffee:1199-1200](../legacy/js/application.coffee#L1199))

```coffee
for i in ["1-1", "1-3", "1-9", "1-16", "2-1", "2-5", "2-11",
          "3-1", "3-7", "4-1", "4-4", "4-8", "5-1"]
  $( "##{i}" ).append "<div class='new-power'></div>"
```

13 niveaux. Chacun **introduit une nouvelle capacité** ou une nouvelle situation. Le sélecteur de niveaux affiche une petite ampoule (`./css/images/light.png`) en haut-droite du carré.

### Table niveau → capacité introduite

| Niveau | Capacité / situation introduite                                              | Power(s) activé(s)                       |
|--------|------------------------------------------------------------------------------|------------------------------------------|
| 1-1    | Le `0` — éliminer un zéro additif                                            | `deleteUseless` (toujours)                |
| 1-3    | L'opposé — `t` et `-t` s'annulent en se touchant                             | (logique pure)                            |
| 1-9    | La pioche + le drop sur les deux membres                                     | (drop avec `rootDrop`)                    |
| 1-16   | **Inversion du signe d'une carte de pioche par clic**                        | `reversePower`                            |
| 2-1    | Apparition de fractions — `p/p = 1` (simplification num/dén)                  | (logique pure : `droppableFracSimplify`)  |
| 2-5    | Le `1` — éliminer un un multiplicatif (`x.1 = x`)                            | `deleteUseless` étendu                    |
| 2-11   | Slot `_` au dénominateur — multiplier les deux membres par une carte         | `dropdenPower`                            |
| 3-1    | Déplacement d'un terme d'un membre à l'autre (inversion auto du signe)       | `crossPower`                              |
| 3-7    | Slot `_` au numérateur                                                       | `dropnumPower`                            |
| 4-1    | Le nombre — addition de deux littéraux                                       | `addPower`                                |
| 4-4    | Multiplication de littéraux + décomposition en facteurs premiers             | `multPower` + `primeFactorPower`          |
| 4-8    | Une fraction `x.a.3/6` à simplifier par facteurs premiers                    | combo                                     |
| 5-1    | Application de `−1` à une carte (sélectionnée en vert)                       | `negPower`                                |

### Conséquence pour le portage

- Le menu de sélection doit afficher l'ampoule sur ces 13 niveaux.
- La logique : stocker la liste statique (`KEY_LEVELS`) côté TS ; le composant `LevelButton.svelte` la consulte.
- Bonus pédagogique pour la v2 : afficher en passant la souris/maintenant le doigt sur l'ampoule **une bulle d'aide** qui explique *quoi de nouveau* dans ce niveau (la table ci-dessus rendrait service).

---

## 3. `.astuce` — les indices animés

### Données ([application.coffee:1128-1142](../legacy/js/application.coffee#L1128))

```coffee
astuces = ->
  switch "#{chapter}-#{level}"
    when "1-1"  then animation_tap(  $( ".carte[data-valeur='0']" ).first() )
    when "1-3"  then animation_touch($( ".carte[data-valeur='2']" ).first(),
                                     $( ".carte[data-valeur='-2']" ).first())
    when "1-9"  then animation_touch($( ".carte[data-valeur='-g']" ).first(), "lhs")
    when "1-16" then animation_tap(  $( "#pioche .carte[data-valeur='p']" ).first() )
    when "2-1"  then animation_touch($( ".denominateur .carte[data-valeur='p']" ).first(),
                                     $( ".numerateur   .carte[data-valeur='p']" ).first())
    when "2-5"  then animation_tap(  $( ".carte[data-valeur='1']" ).first() )
    when "2-11" then animation_touch($( "#pioche .carte[data-valeur='b']" ).first(),
                                     $( ".carte[data-valeur='_']" ))
    when "3-1"  then animation_touch($( ".carte[data-valeur='t']" ).first(), "lhs")
    when "3-7"  then animation_touch($( "#pioche .carte[data-valeur='d']" ).first(),
                                     $( ".carte[data-valeur='_']" ))
    when "4-1"  then animation_touch($( ".carte[data-valeur='2']" ).first(),
                                     $( ".carte[data-valeur='3']" ))
    when "4-4"  then animation_tap(  $( ".carte[data-valeur='6']" ).first(), "double-tap" )
    when "4-8"  then animation_touch($( ".carte[data-valeur='2']" ).first(),
                                     $( ".carte[data-valeur='3']" ))
    when "5-1"  then animation_tap(  $( ".carte[data-valeur='-1']" ).first(), "double-tap" )
```

Deux primitives :
- **`animation_tap(element, image='tap')`** — une icône doigt (`tap.gif` ou `double-tap.gif`) clignote au-dessus de l'élément, en boucle toutes les 3 secondes.
- **`animation_touch(element1, element2)`** — la clone de `element1` glisse vers `element2`, accompagnée d'une icône doigt (`touch.gif`).

L'animation **s'arrête au premier `mousedown`/`touchstart` n'importe où** (via `$( "body" ).one(...)`). C'est très bien fait : le jeu n'insiste pas.

### Conséquence pour le portage

- Remplacer les GIF par du SVG/CSS animé (Lottie/Motion One ou CSS pur). Mieux qu'un GIF qui se recharge avec `?Math.random()` pour casser le cache.
- API souhaitée :
  ```ts
  hintTap(query: HintQuery): void;
  hintDrag(from: HintQuery, to: HintQuery | "lhs" | "rhs"): void;
  ```
  où `HintQuery` est un sélecteur logique (« la première carte de valeur 0 », « la première carte de pioche », etc.) — résolu côté Svelte à partir du `GameState`.
- Trigger : au montage du `GameScreen` pour le niveau-clé, démarrer l'astuce. À la première interaction utilisateur, arrêter.
- Stockage de la table : un fichier `src/data/astuces.ts` qui mappe `"1-1" → { kind: "tap", target: { kind: "literal", value: 0, first: true } }` etc.

---

## 4. Plan de portage proposé (par priorité didactique)

### P0 — *bloquant pour la fidélité pédagogique*

1. **Refactor `dropFromPioche` en 2 étapes** + ajout d'un état `pendingDrops` au moteur. *Sans ça, le niveau 1-9 et tous les niveaux à pioche perdent leur sens.*
2. **Composant `DropZone.svelte`** (= `.rootDrop`) qui s'affiche en attente, + **`FlashAlert`** qui apparaît si l'élève clique autre part.
3. **Refus côté moteur** de toute opération si `pendingDrops.length > 0` (équivalent `blocked = true`).

### P1 — *visibilité du progrès*

4. **Marqueur `.new-power` dans le menu de sélection** (les 13 niveaux clés ; ampoule SVG à la place du PNG).
5. **Tooltip explicatif** sur l'ampoule : « ici tu vas apprendre à *inverser le signe* d'une carte ».

### P2 — *coaching de l'élève*

6. **Système d'astuces** : table `src/data/astuces.ts` + composant overlay `Astuce.svelte` (animation CSS, pas de GIF).
7. **Stop automatique** au premier `pointerdown`.

### P3 — *finitions*

8. **Variation contextuelle** : si l'élève reste bloqué >30s sans drop accepté, ré-afficher l'astuce du niveau (au lieu de la montrer uniquement au montage).

---

## 5. Ce que j'avais loupé (mea culpa)

Je liste ici les commentaires/codes du legacy qui auraient dû m'alerter mais que j'ai sous-estimés en lecture rapide :

- Le commentaire `# Important : pour préserver l'équivalence, le moteur doit AUSSI poser la carte sur l'AUTRE membre. Dans le jeu legacy, ce 2ᵉ drop est imposé via une « DropCard » (DC)…` — je l'avais écrit moi-même dans `operations.ts` puis simplifié.
- La présence de **trois** classes CSS distinctes (`rootDrop`, `DC`, `US`) qui me criaient « il y a un modèle d'état d'attente complexe ici ».
- Le test `if not blocked` dans la `start` de drag de pioche ([application.coffee:1016](../legacy/js/application.coffee#L1016)) qui indique sans ambiguïté que **l'état de blocage existe entre deux gestes utilisateur**.
- Le mécanisme `flash_alert` (« ! » qui pointe vers la carte à déposer) — c'est *le* signal pédagogique. Quand l'élève clique au mauvais endroit, le jeu lui répond *gentiment* et *visuellement*.

Le legacy est plus fin qu'il en a l'air. La règle générale pour la suite du portage : **ne pas simplifier une mécanique sans avoir d'abord compris son rôle pédagogique**.
