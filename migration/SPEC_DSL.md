# Spec du DSL de niveaux — Aljeb974

> Documentation rétro-ingéniée à partir de [legacy/js/application.coffee](../legacy/js/application.coffee).
> Objectif : disposer d'une grammaire et d'une sémantique formelles pour porter les 100 niveaux vers la nouvelle stack Svelte 5 sans perte d'information.

---

## 1. Vue d'ensemble

Un **niveau** est un état de départ d'équation à manipuler par l'élève jusqu'à isoler `x`. Il est décrit par un objet :

```yaml
{
  lhs:    [Term, ...],    # membre gauche (obligatoire)
  rhs?:   [Term, ...],    # membre droit (optionnel — absent = "pas encore d'égalité affichée")
  pioche?:[Term, ...],    # cartes disponibles à la main (optionnel)
  reveal?:[string, ...],  # cartes à afficher en texte au lieu d'image (optionnel)
  shots:  number          # nombre de coups cible pour 3 étoiles
}
```

Chaque membre est une **liste de termes additifs**. Un `Term` est une fraction (numérateur optionnellement divisé par un dénominateur), elle-même produit de cartes atomiques. L'ensemble forme la grammaire ci-dessous.

---

## 2. Grammaire (EBNF)

```ebnf
Level        = "{" "lhs:" TermList
                  [, "rhs:" TermList ]
                  [, "pioche:" TermList ]
                  [, "reveal:" RevealList ]
                  , "shots:" Integer "}" ;

TermList     = "[" Term { "," Term } "]" ;

Term         = Numerator [ "/" Denominator ] ;
Numerator    = AtomList ;
Denominator  = AtomList | "_" ;        (* "_" = trou à combler *)
AtomList     = Atom { "." Atom } ;     (* "." = produit *)

Atom         = [ "-" ] AtomBase ;
AtomBase     = "x"                     (* l'inconnue *)
             | Letter                  (* a-z sauf x : constante symbolique *)
             | Digit { Digit }         (* littéral entier *)
             | "_" ;                   (* trou (placeholder vide) *)

RevealList   = "[" RevealItem { "," RevealItem } "]" ;
RevealItem   = "\"all\""               (* tout afficher en texte *)
             | "\"numbers\""           (* tous les littéraux numériques en texte *)
             | "\"" Atom "\"" ;        (* une lettre spécifique *)

Letter       = "a" | "b" | ... | "z" ;
Digit        = "0" | ... | "9" ;
Integer      = Digit { Digit } ;
```

### Cas particuliers observés
| Forme                | Sens                                                                  | Exemple        |
|----------------------|-----------------------------------------------------------------------|----------------|
| `"x"`                | terme à 1 atome égal à l'inconnue                                     | niveau 1-1     |
| `"-t"`               | opposé de `t`                                                         | niveau 1-3     |
| `"x.2"` ou `"2.x"`   | produit (commutatif) — `x` multiplié par `2`                          | niveau 4-1+    |
| `"p/p"`              | fraction `p/p` (égale à 1)                                            | niveau 2-1     |
| `"x.6/2.3"`          | (x × 6) / (2 × 3)                                                     | niveau 4-4     |
| `"b.x/_"`            | numérateur `b × x`, dénominateur **trou** à remplir depuis la pioche  | niveau 2-11    |
| `"x._/d"`            | numérateur `x × trou`, dénominateur `d`                               | niveau 3-7     |
| `"-1.-x"`            | (−1) × (−x) — manipulation introduisant le facteur `−1`               | niveau 5-1     |

> Le moteur original utilise `string.split("/")` puis `string.split(".")`. La grammaire ci-dessus est donc *exactement* celle implémentée. Les caractères `.` et `/` ne peuvent jamais apparaître à l'intérieur d'un atome.

---

## 3. Atomes : sémantique mathématique

| Catégorie     | Atomes                                    | Représentation        | Affichage initial                            |
|---------------|-------------------------------------------|-----------------------|----------------------------------------------|
| Inconnue      | `x`                                       | Variable libre        | Carte spéciale `x.png` (animée pulsation)    |
| Constantes    | `a` `b` `c` `d` `e` `f` `g` `h` `i` `j` `k` `l` `m` `p` `q` `r` `s` `t` `u` `v` `w` `z` | Symboles libres (≠0) | Carte "monstre" `<letter>.png`               |
| Littéraux ≥ 0 | `0` `1` `2` … `9`                         | Entiers naturels      | Carte `<digit>.png` (puis chiffre direct)    |
| Opposés       | `-x`, `-a`, `-b`, …, `-1`, `-2`, …        | Inverse additif       | Carte `-<atom>.png`                          |
| Trou          | `_`                                       | Slot vide à remplir   | Carte `DC.png` (= "Drop Card")               |

> Les lettres `n`, `o`, `y` ne sont **pas** utilisées dans les 100 niveaux (vérifié).
> Le `0` est neutre additif (cliquable pour disparaître si non-seul).
> Le `1` est neutre multiplicatif (cliquable pour disparaître si non-seul dans un produit).

### Règle d'affichage `reveal`
À l'initialisation, le moteur transforme `reveal` :
```coffee
(level_data.reveal.push("-#{i}") for i in level_data.reveal) if "all" not in level_data.reveal
```
Donc révéler `"a"` révèle automatiquement `"-a"`. Révéler `"all"` court-circuite cette boucle.

Une carte est rendue **en texte** (au lieu de son sprite-monstre) ssi :
- `reveal` contient `"all"`, ou
- `reveal` contient la valeur exacte de la carte, ou
- la carte est numérique ET `reveal` contient `"numbers"`.

C'est le mécanisme pédagogique central : on commence avec des monstres opaques, puis on dévoile progressivement que ce sont des lettres.

---

## 4. Sémantique d'une équation

Soit `eval` la fonction qui calcule la valeur mathématique d'un terme/membre :

```
eval(Atom)          = la valeur du symbole
eval(-Atom)         = -eval(Atom)
eval([a1, ..., an]) = a1 × a2 × ... × an              (numerateur)
eval(num/den)       = eval(num) / eval(den)            (fraction)
eval([T1, ..., Tk]) = T1 + T2 + ... + Tk               (membre = somme)
```

Un **niveau est résolu** lorsque l'élève atteint un état où :
- exactement un terme contient `x` et c'est `x` tout seul (numérateur `[x]`, sans dénominateur, seul terme de son côté).
- (l'autre côté contient alors la valeur de `x`)

Cf. [application.coffee:664-673](../legacy/js/application.coffee#L664-L673) (fonction `checkSuccess`).

### Critère 3 étoiles
À la victoire, le moteur appelle `count_beurk()` ([application.coffee:679-725](../legacy/js/application.coffee#L679-L725)) qui pénalise :
- les `1` non solitaires restants dans un numérateur (multiplication par 1 inutile)
- les `0` restants
- les `1` au dénominateur (division par 1 inutile)
- les paires opposées (`t` et `-t`) non simplifiées
- les paires identiques numérateur/dénominateur (`t/t`) non simplifiées (chapitre > 2)
- les termes opposés au même membre (`a` et `-a` non éliminés)

Score :
| Beurks | Coups (`shots`) ≤ cible | Étoiles |
|--------|-------------------------|---------|
| 0      | Oui                     | 3       |
| 0      | Non                     | 2       |
| ≥ 1    | —                       | 1       |

---

## 5. Powers (capacités progressives)

Les capacités du moteur sont activées par paliers selon `(chapter, level)`. Toutes les conditions sont extraites de [application.coffee:1160-1169](../legacy/js/application.coffee#L1160-L1169).

| Power                 | Activation                                              | Effet                                                                 |
|-----------------------|---------------------------------------------------------|-----------------------------------------------------------------------|
| `deleteUseless` (1/0) | Toujours actif                                          | Clic sur `0` ou `1` non solitaire → la carte disparaît                |
| `dropOnce`            | Vrai chap. 1, faux dès chap. 2                          | Cartes pioche consommées (`true`) vs réutilisables (`false`)          |
| `reversePower`        | Chap. 2+, OU chap. 1 niveau ≥ 16                        | Clic sur carte pioche → inverse son signe                             |
| `dropdenPower`        | (Chap. 2 niveau ≥ 11) OU (chap. 3+ sauf 3-7)            | Drop dans un dénominateur autorisé                                    |
| `dropnumPower`        | Chap. 4+ OU (chap. 3 niveau ≥ 7)                        | Drop dans un numérateur autorisé                                      |
| `crossPower`          | Chap. 3+                                                | Glisser un terme d'un membre à l'autre (le signe s'inverse)           |
| `multPower`           | Chap. 4+                                                | Drop d'un nombre sur un autre → multiplication numérique              |
| `addPower`            | Chap. 4+                                                | Drop d'un nombre sur un autre → addition numérique                    |
| `primeFactorPower`    | Chap. 4+ (niveau ≥ 4)                                   | Clic sur nombre > 3 → décomposition en facteurs premiers              |
| `negPower`            | Chap. 5+                                                | Clic sur le `−1` extrait pour annuler une carte                       |
| `stylePower`          | Niveaux explicites *2-19, 2-20, 3-17..20, 4-17..20, 5-17..20* | Rendu linéaire (notation usuelle `+`, `=`) au lieu de cartes flottantes |

> ⚠️ Bug observé dans `multPower` et `primeFactorPower` ([application.coffee:1165, 1169](../legacy/js/application.coffee#L1165-L1169)) : la deuxième clause `(chapter > 3 and level > N)` est **redondante** (toujours fausse vu la première). À corriger à la migration — probablement censé être `chapter == 3 and level > N`.

---

## 6. Champ `shots`

Nombre cible de **drag-drop validés** pour décrocher la 3ᵉ étoile.
- Incrémenté à chaque drop accepté (`unblock`, `droppableSide`, `primeFactorPower`).
- **Pas** incrémenté par les clics d'élimination de `0`/`1`.
- Comparé à `level_data.shots` dans `count_beurk`.

---

## 7. Cas limites pédagogiques

Quelques niveaux exploitent volontairement des cas mathématiques particuliers :

| Niveau     | Configuration              | Pédagogie                                        |
|------------|----------------------------|--------------------------------------------------|
| 1-1        | `lhs=["x","0","0"]`        | Premier zéro, première équation                  |
| 1-3        | `+["t","-t"]`              | Découverte de l'opposé                           |
| 1-9        | `pioche=["-g"]`            | Première utilisation de la pioche                |
| 1-13       | `reveal=["a"]`             | Première lettre révélée comme symbole            |
| 2-1        | Première fraction          | Découverte du dénominateur                       |
| 2-5        | `lhs=["x.1"]`              | Découverte du `1` neutre multiplicatif           |
| 5-14, 5-15 | `lhs=["x"]`, `rhs=["x","x"]` | Cas `x = 2x` → unique solution `x = 0`         |

---

## 8. Différences avec DragonBox Algebra commercial

- Pas d'opérateurs `+`/`−` explicites : ils sont implicites entre éléments d'une `TermList` (sauf en `stylePower`).
- Le `1` apparaît **comme carte** dans Aljeb974 ; chez DragonBox il s'écrit `1·t/t` en intermédiaire.
- Pas de mode "édition libre" / "création de niveau".
- Pas de chapitres 6+ (couverture Common Core 6.EE → 8.EE seulement, pas HSA.REI complet).

---

## 9. Décisions de portage

| Sujet                     | Choix proposé                                                              |
|---------------------------|----------------------------------------------------------------------------|
| Format de stockage        | `levels.json` (généré depuis CoffeeScript original par script de migration) |
| Validation                | Zod (schéma TypeScript) — voir [types.ts](./types.ts)                      |
| Parser de termes          | Module pur `parseTerm(s: string): Term` testé avec Vitest                  |
| Représentation runtime    | Arbre immuable (pas de string-as-state) ; structural sharing pour undo     |
| Powers                    | Map déclarative `(chapter,level) → Capabilities` (corrige le bug de mult)  |
| Reveal                    | Calcul de la closure (incluant `-X`) à l'init, mémoïsé                     |
| Internationalisation      | Toutes les chaînes du menu / victoire / hints externalisées (FR/EN/Créole) |
| Assets                    | SVG paramétrable `<Card value="t" />` (génère le monstre via seed `t`)     |

---

## 10. Glossaire

- **carte / card** : élément atomique affiché (lettre, chiffre, opposé)
- **fraction** : conteneur d'un numérateur (+ dénominateur optionnel)
- **terme** : synonyme de fraction dans un membre (= un élément additif)
- **membre / side** : `lhs` ou `rhs`
- **pioche** : reserve de cartes disponibles
- **drop** : déposer une carte (pioche → membre, ou membre → membre)
- **beurk** : pénalité à la victoire (déchet non simplifié)
- **shots** : nombre de drops effectués
