# Pédagogie — Faiblesses élèves détectables via Aljeb974

> Document de cadrage pédagogique : quelles **fragilités classiques** des élèves dans la résolution d'équations Aljeb974 peut révéler, mesurer, et idéalement réparer.
> Cible : 6ᵉ → 3ᵉ, public francophone (potentiellement créolophone) — Réunion.
> Référence didactique : standards Common Core 6.EE.B → HSA.REI.B.3 (PDF de spec DragonBox), travaux Vergnaud (champs conceptuels), Brousseau (situations didactiques).

---

## 0. Pourquoi ce jeu, pédagogiquement

L'équation algébrique est un **objet épistémologique paradoxal** pour un élève :
1. C'est une *égalité* (donc statique, balance), MAIS
2. on la *transforme* (donc dynamique, on agit dessus).

La majorité des erreurs élèves vient du non-recouvrement de ces deux registres. Aljeb974 (et DragonBox) résolvent cela par une **manipulation tactile concrète** où la balance et la transformation cohabitent visuellement.

**Mais** : le jeu peut aussi **masquer** des fragilités, en automatisant les règles que l'élève devrait, à terme, savoir énoncer. C'est pourquoi *mesurer* est essentiel — un élève "qui réussit le jeu" n'est pas un élève "qui comprend les équations".

---

## 1. Catalogue des 14 fragilités détectables

Pour chaque fragilité : **(F)** le nom, **(M)** la manifestation dans le jeu, **(I)** les indicateurs mesurables, **(D)** le diagnostic didactique, **(R)** remédiation suggérée.

### F1 — Cécité aux opposés
- **M** : niveau 1-3 (`x + t + (-t) + 2 + (-2)`). L'élève laisse les paires `t, -t` côte à côte sans les annihiler.
- **I** : temps de latence avant le 1er clic d'opposition ; nombre de drops parasites avant la première neutralisation.
- **D** : confusion entre soustraction comme opération et opposé comme objet (« je ne vois pas que `t` et `-t` peuvent disparaître ensemble »). L'élève traite encore les algébriques comme des nombres signés isolés.
- **R** : insister sur la verbalisation « *l'opposé de t est −t* » ; introduire la droite graduée symbolique.

### F2 — Non-préservation de l'équivalence
- **M** : à partir du chapitre 3 (`crossPower`), l'élève fait glisser un terme d'un côté à l'autre sans comprendre que **le jeu inverse automatiquement son signe**. Test : sur papier, il oublie la règle.
- **I** : ratio "réussites in-game" / "réussites papier équivalent" (à mesurer hors app).
- **D** : *l'élève apprend la règle de transposition comme un truc* sans la dériver de "j'enlève/j'ajoute la même chose des deux côtés". Cf. Brousseau, *effet Topaze*.
- **R** : étape intermédiaire dans le jeu où la double opération (j'ajoute `-t` à droite ET à gauche) serait **explicite** avant d'être automatisée. C'est une vraie amélioration à ajouter v2 — un mode "balance manuelle" optionnel.

### F3 — Confusion neutre additif (0) / neutre multiplicatif (1)
- **M** : niveau 2-5 (`x.1 = m`). L'élève clique-t-il sur le `1` ? Aux niveaux suivants confond-il `0` (qui se mange par addition) et `1` (qui se mange par produit) ?
- **I** : taux d'erreur de clic `0` vs `1` quand les deux sont présents (niveaux mixtes : 2-2, 4-15…).
- **D** : `0` et `1` ne sont pas thématisés comme *éléments neutres* à l'école primaire, juste comme nombres. L'algèbre les rend structurels.
- **R** : afficher dans le HUD le rôle du neutre activé (« multiplication par 1 = sans effet »).

### F4 — Inverse additif vs inverse multiplicatif
- **M** : niveaux à partir du chapitre 2 où coexistent `-x` (opposé) et `x/x = 1` (carte vs sa propre fraction). Confusion classique.
- **I** : drops erronés sur la mauvaise zone (numérateur vs zone d'addition).
- **D** : un élève qui a écrit `−x = 1/x` au moins une fois sur papier (et c'est fréquent en seconde) bute ici.
- **R** : visuels résolument différents : opposé = couleur miroir, inverse = position superposée.

### F5 — Fraction comme « deux nombres superposés »
- **M** : niveaux 2-1 à 2-10. L'élève manipule le numérateur et le dénominateur de manière indépendante sans simplifier `t/t = 1`, `p/p = 1`.
- **I** : nombre de `beurks` "dénominateur non simplifié" à la fin d'un niveau ; nombre de fractions restantes type `k/k`.
- **D** : la fraction n'est pas perçue comme **un nombre unique** (Vergnaud, *champ conceptuel des structures multiplicatives*). L'élève fait des opérations parallèles haut/bas.
- **R** : animations qui matérialisent la fusion `t/t → 1`. Renforcer l'analogie balance.

### F6 — Méconnaissance de la distributivité
- **M** : niveaux 4-2+ avec `r.s` à un membre, `x.m` à l'autre. L'élève doit comprendre que `r·s = x·m ⇒ x = r·s/m`.
- **I** : ratio de réussite chapitres 4-5 ; nombre de tentatives avant trouver la bonne factorisation.
- **D** : la distributivité est sous-enseignée comme **propriété structurelle** (vs comme calcul mnémotechnique). Cf. exercices 6.EE.A.3 du Common Core.
- **R** : niveaux dédiés où le double-tap fait *apparaître visuellement* la distribution `2.(x+3) ↔ 2x + 6`.

### F7 — Mauvaise gestion du signe « − »
- **M** : chapitre 5 entier. Niveau 5-1 : `(-1)·(-x) = t`. L'élève « sait que moins par moins fait plus » mais l'applique mal en contexte.
- **I** : taux d'échec spécifique au chapitre 5 ; nombre de revers de signe nécessaires.
- **D** : la règle des signes est **mémorisée procéduralement** sans *contexte additif* (Glaeser, *épistémologie des nombres relatifs*). Avec une variable, ça craque.
- **R** : ajouter un *replay* visuel : l'inverseur de signe pourrait montrer une rotation, pas une simple substitution.

### F8 — Variable comme « valeur cachée à deviner » vs « objet de calcul »
- **M** : niveaux où `x` apparaît plusieurs fois (5-14, 5-15 : `x = x + x`). Beaucoup d'élèves cherchent une valeur particulière au lieu de manipuler `x` comme un objet.
- **I** : temps passé sur 5-14, 5-15 ; sont-ils résolus du premier coup ou abandonnés ?
- **D** : conception "*x est un nombre que je cherche*" au lieu de "*x est un nom*". Cf. Kuchemann, échelle des conceptions de la variable.
- **R** : niveau d'éveil à plusieurs occurrences de `x` dès le chapitre 1 (actuellement absent).

### F9 — Le piège de la solution nulle
- **M** : niveaux 5-14 (`x = 2x`). La solution est `x = 0`, mais l'élève peut tenter de diviser par `x` (interdit si `x = 0`).
- **I** : nombre d'élèves qui *abandonnent* sur 5-14 sans même essayer ; nombre de tentatives `x/x`.
- **D** : *x* est traité comme **automatiquement non nul** par l'élève — une heuristique implicite.
- **R** : verbalisation post-niveau : « vous venez de prouver que `x = 0` est possible ».

### F10 — Linéarité erronée (additivité fantôme)
- **M** : niveau 4-4 (`x.6/(2.3) = b`). L'élève peut croire `(x+6)/(2+3)`. Pas exactement testable par le jeu (qui force la notation), mais détectable par les `shots` excessifs.
- **I** : `shots/target` ratio sur les niveaux avec produits complexes.
- **D** : la *linéarité parasite* (`(a+b)² = a² + b²`, `1/(a+b) = 1/a + 1/b`) est l'erreur n°1 en lycée. Source : Sfard, dual nature of math concepts.
- **R** : exos hors-jeu pour vérifier que l'élève distingue produit et somme.

### F11 — Cognition spatiale du membre = symétrie
- **M** : tendance à appliquer une opération uniquement *visuellement plus accessible* (côté gauche, plus près du doigt droit pour un droitier).
- **I** : asymétrie statistique gauche/droite des drops par élève.
- **D** : biais ergonomique qui *renforce* la confusion équivalence (cf. F2). Plus subtil.
- **R** : tests A/B avec membres permutés ; ajustements d'interface (zones droppables symétriques visuellement).

### F12 — Procéduralisation sans conceptualisation
- **M** : l'élève termine les 100 niveaux mais ne sait pas résoudre `2x + 3 = 7` sur papier.
- **I** : score in-app vs score test diagnostique externe (à concevoir).
- **D** : risque connu de toute *gamification mathématique* (cf. critique de DragonBox dans Pope & Mangram 2015 — l'app fait progresser sur l'app, pas toujours sur le papier).
- **R** : intercaler des **bridges papier** entre chapitres ; mode « écris l'équation » avant chaque niveau ; mode « écris ce que tu viens de faire » après chaque niveau.

### F13 — Compréhension du `=` comme opérateur (« le résultat »)
- **M** : héritage du primaire — `3 + 4 = 7` lu comme « 3+4 donne 7 ». L'élève cherche un *côté résultat*. Quand le jeu présente `t = x + s`, il essaye de "calculer" le côté droit.
- **I** : ordre d'attaque du premier drop (à droite si l'élève cherche un résultat, à gauche si l'élève sait que les deux côtés sont équivalents).
- **D** : ***Conception unidirectionnelle de l'égalité***. Cf. Knuth et al., *The importance of equal sign understanding* (2006).
- **R** : niveaux où l'inconnue est *à droite* dès le chapitre 1 (1-5 le fait déjà — bien !).

### F14 — Charge cognitive face à l'imbrication
- **M** : niveaux 5-5, 5-13, 5-18+ avec fractions de fractions et facteurs multiples.
- **I** : abandon ; pic d'erreurs.
- **D** : limite de mémoire de travail (Cowan : 4 ± 1 items). Pas une fragilité conceptuelle mais une fragilité **opérationnelle**.
- **R** : option « afficher la forme linéaire » à tout moment, pas seulement aux niveaux `stylePower`.

---

## 2. Synthèse — heatmap fragilité × chapitre

|  Fragilité \ Chapitre | 1 | 2 | 3 | 4 | 5 | Notation `stylePower` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| F1 Opposés cécité            | ●● |  ●  |    |    |    |    |
| F2 Équivalence               |    |    | ●● | ●● | ●● | ●● |
| F3 0 vs 1 neutres            | ●● | ●● | ●  |    |    |    |
| F4 Inverse add/mult          |    | ●● | ●● |    |    |    |
| F5 Fraction = nombre         |    | ●● | ●  | ●  |    |    |
| F6 Distributivité            |    |    |    | ●● | ●  | ●● |
| F7 Signes                    |    |    |    |    | ●● | ●  |
| F8 Variable comme objet      |    |    |    |    | ●● |    |
| F9 Solution nulle            |    |    |    |    | ●● |    |
| F10 Linéarité fantôme        |    |    |    | ●● | ●  |    |
| F11 Asymétrie spatiale       |  ●  | ●  | ●  | ●  | ●  |    |
| F12 Procédural vs concept    |  ●  | ●  | ●  | ●  | ●  |    |
| F13 `=` unidirectionnel      | ●● | ●  |    |    |    |    |
| F14 Charge cognitive         |    |    |    | ●  | ●● | ●  |

(●● = fragilité saillante / centrale du chapitre · ● = fragilité présente mais secondaire)

---

## 3. Ce qu'il faudrait **mesurer** pour exploiter ce diagnostic

Voici les **événements à logguer** dans la v2 pour transformer le jeu en outil de diagnostic enseignant :

```ts
type GameEvent =
  | { t: "level_start"; chapter: number; level: number; ts: number }
  | { t: "drop"; from: Position; to: Position; card: string; ts: number }
  | { t: "click_delete"; card: string; ts: number }
  | { t: "click_reverse"; card: string; ts: number }
  | { t: "click_factor"; card: string; result: string[]; ts: number }
  | { t: "drop_rejected"; from: Position; to: Position; reason: string; ts: number }
  | { t: "hint_shown"; level_id: string; ts: number }
  | { t: "level_won"; shots: number; target: number; beurks: number; stars: number; ts: number }
  | { t: "level_abandoned"; ts: number };
```

Avec ces événements, on calcule :
- **Profil élève** : tableau fragilité × score (faible/moyen/fort) → tableau de bord prof.
- **Pace de groupe** : médiane des temps par niveau → repère pour calibrer la séance.
- **Erreurs typiques** : clustering des séquences d'actions → erreurs récurrentes.

Côté RGPD/CNIL pour un usage scolaire : tout local (IndexedDB), export CSV par l'enseignant à la demande. Pas de cloud par défaut.

---

## 4. Recommandations d'évolution pour la v2 (par ordre de priorité didactique)

1. **Mode « écris ce que tu fais »** (haut impact, faible effort) : à chaque drop, afficher en surimpression la transformation effectuée (`+ 5 des deux côtés`, etc.). Combat F2, F12, F13.
2. **Bridge papier inter-chapitre** (haut impact, moyen effort) : 3 exos PDF générés depuis les niveaux du chapitre, à imprimer.
3. **Replay verbalisé** (moyen impact, faible effort) : à la fin d'un niveau, séquence audio/textuelle qui décrit ce qui a été fait.
4. **Niveau 0** introduisant `x` comme **objet** avec plusieurs occurrences (combat F8).
5. **Mode prof / tableau de bord** (haut impact, gros effort) : consulter les profils élèves.
6. **Indices adaptatifs** : remplacer les `astuces()` codées en dur par un système qui se déclenche quand l'élève bloque (>30s sans drop accepté, >2x shots cible).
7. **Internationalisation** : version créole réunionnaise pour les élèves allophones — vrai différenciateur sur l'académie de la Réunion.
8. **Accessibilité keyboard-only** (pour DYS et moteurs) : navigation Tab + Espace.

---

## 5. Limites de l'outil

À garder en tête (avec honnêteté intellectuelle) :
- Aljeb974 ne couvre pas les *inéquations*, les *systèmes*, les *équations produit-nul*.
- Le formalisme `+`/`=` est *masqué jusqu'au stylePower* — un élève qui ne fait que les 12 derniers niveaux ne voit jamais la notation classique.
- La *modélisation* (passer d'un énoncé à une équation) est totalement hors-jeu. C'est pourtant 50% du travail mathématique réel.
- Le jeu *automatise* les règles d'équivalence — c'est sa force pédagogique mais aussi son risque (F12).

Une utilisation idéale : **15 min de jeu + 15 min de transposition papier**, à chaque séance.

---

## 6. Pistes recherche / suite

- Mise en place d'une **étude AB** Aljeb974-seul vs Aljeb974+bridge papier sur 2 classes de 5ᵉ à la Réunion.
- Collaboration avec [LIM (Université de la Réunion)](https://lim.univ-reunion.fr/) ou [IRES de la Réunion](https://ires-reunion.univ-reunion.fr/) pour valider les indicateurs F1-F14.
- Publication didactique courte (Petit x, ou *Bulletin APMEP*) sur le retour terrain.
