/**
 * operations.ts — opérations immutables sur GameState.
 *
 * Chaque opération renvoie un nouvel état OU lève si l'opération n'est pas
 * légale dans l'état courant (la vérification de légalité côté UI utilise
 * `canX` qui retourne booléen — défini ici aussi).
 *
 * Conventions :
 *  - aucune mutation du paramètre `state`.
 *  - le compteur `shots` est incrémenté uniquement par les opérations « drop »
 *    (cf. legacy/js/application.coffee : ability_to_delete_useless_card
 *     n'incrémente pas shots).
 *  - les vérifications de capabilities (powers) sont la responsabilité de
 *    l'appelant via `capabilitiesFor(chapter, level)` — les opérations
 *    de base ne refusent que sur la logique du jeu, pas sur les powers.
 */

import { atomsEqual, atomsOpposite, flipSign, isZero, isOne, literalValue, fromLiteral } from "./atoms.ts";
import type { Atom, Term } from "./dsl.ts";
import type { CardInstance, EntityId, FractionInstance, GameState, Side } from "./state.ts";
import { locateCard, locateFraction, makeIdSource } from "./state.ts";

/* ─── Gardien : la plupart des op refusent en pending ────────────────────── */

function ensureNotPending(state: GameState, op: string): void {
  if (state.pending) throw new Error(`${op} refusée : drop en cours`);
}

/* ─── Utils internes ──────────────────────────────────────────────────────── */

function replaceAt<T>(arr: T[], idx: number, value: T): T[] {
  const out = arr.slice();
  out[idx] = value;
  return out;
}

function removeAt<T>(arr: T[], idx: number): T[] {
  return arr.slice(0, idx).concat(arr.slice(idx + 1));
}

function updateSide(
  state: GameState,
  side: Side,
  updater: (fractions: FractionInstance[]) => FractionInstance[],
): GameState {
  return { ...state, [side]: updater(state[side]) };
}

/**
 * Retire une carte d'une fraction. Si la fraction se retrouve avec un numérateur
 * vide, elle est entièrement retirée (un dénominateur seul n'a pas de sens).
 * Si seul le dénominateur devient vide, on enlève `denominator` (devient produit simple).
 */
function removeCardAt(
  fractions: FractionInstance[],
  fractionIdx: number,
  where: "numerator" | "denominator",
  cardIdx: number,
): FractionInstance[] {
  const frac = fractions[fractionIdx]!;
  if (where === "numerator") {
    const newNum = removeAt(frac.numerator, cardIdx);
    if (newNum.length === 0) {
      // numérateur vide → on retire toute la fraction
      return removeAt(fractions, fractionIdx);
    }
    return replaceAt(fractions, fractionIdx, { ...frac, numerator: newNum });
  } else {
    const denom = frac.denominator ?? [];
    const newDen = removeAt(denom, cardIdx);
    return replaceAt(fractions, fractionIdx, {
      ...frac,
      denominator: newDen.length === 0 ? undefined : newDen,
    });
  }
}

/* ─── 1. Élimination d'un zéro ────────────────────────────────────────────── */

/**
 * Cliquer sur un `0` : si c'est un atome solitaire de son numérateur (et que la
 * fraction n'est pas la seule du membre, sinon `0` est la valeur du membre),
 * la fraction entière disparaît.
 *
 * Cf. legacy/js/application.coffee:911-914.
 */
export function canDeleteZero(state: GameState, cardId: EntityId): boolean {
  if (state.pending) return false;
  const loc = locateCard(state, cardId);
  if (!loc) return false;
  if (loc.side === "pioche") return false; // pas d'élimination en pioche
  const frac = state[loc.side][loc.fractionIdx]!;
  if (!isZero(frac.numerator[loc.cardIdx]!.atom)) return false;
  // la fraction doit n'avoir que ce seul atome au numérateur, sans dénominateur,
  // et il doit rester au moins une autre fraction sur le même membre.
  if (frac.numerator.length !== 1) return false;
  if (frac.denominator) return false;
  return state[loc.side].length > 1;
}

export function deleteZero(state: GameState, cardId: EntityId): GameState {
  ensureNotPending(state, "deleteZero");
  if (!canDeleteZero(state, cardId)) throw new Error("deleteZero illégale");
  const loc = locateCard(state, cardId)!;
  return updateSide(state, loc.side, (fs) => removeAt(fs, loc.fractionIdx));
}

/**
 * Fraction `0 / d` : numérateur = un seul zéro, avec dénominateur. Comme
 * 0 ÷ (quoi que ce soit) = 0, un clic FAIT DISPARAÎTRE le dénominateur
 * (0/d → 0) ; un second clic (deleteZero) supprime alors le zéro.
 */
export function canClearZeroDenominator(state: GameState, cardId: EntityId): boolean {
  if (state.pending) return false;
  const loc = locateCard(state, cardId);
  if (!loc || loc.side === "pioche" || loc.where !== "numerator") return false;
  const frac = state[loc.side][loc.fractionIdx]!;
  if (frac.numerator.length !== 1) return false;
  if (!isZero(frac.numerator[0]!.atom)) return false;
  return !!frac.denominator;
}

export function clearZeroDenominator(state: GameState, cardId: EntityId): GameState {
  ensureNotPending(state, "clearZeroDenominator");
  if (!canClearZeroDenominator(state, cardId)) {
    throw new Error("clearZeroDenominator illégale");
  }
  const loc = locateCard(state, cardId)!;
  return updateSide(state, loc.side, (fs) => {
    const frac = fs[loc.fractionIdx]!;
    return replaceAt(fs, loc.fractionIdx, { ...frac, denominator: undefined });
  });
}

/**
 * Fraction `… / 1` : dénominateur = un seul « 1 » positif. Diviser par 1 ne
 * change rien → un clic fait disparaître le dénominateur (x/1 → x).
 */
export function canClearOneDenominator(state: GameState, cardId: EntityId): boolean {
  if (state.pending) return false;
  const loc = locateCard(state, cardId);
  if (!loc || loc.side === "pioche" || loc.where !== "denominator") return false;
  const frac = state[loc.side][loc.fractionIdx]!;
  const den = frac.denominator;
  if (!den || den.length !== 1) return false;
  const a = den[0]!.atom;
  return isOne(a) && a.sign === 1;
}

export function clearOneDenominator(state: GameState, cardId: EntityId): GameState {
  ensureNotPending(state, "clearOneDenominator");
  if (!canClearOneDenominator(state, cardId)) {
    throw new Error("clearOneDenominator illégale");
  }
  const loc = locateCard(state, cardId)!;
  return updateSide(state, loc.side, (fs) => {
    const frac = fs[loc.fractionIdx]!;
    return replaceAt(fs, loc.fractionIdx, { ...frac, denominator: undefined });
  });
}

/* ─── 2. Élimination d'un 1 multiplicatif inutile ────────────────────────── */

/**
 * Cliquer sur un `1` : si l'atome est dans un produit de plusieurs cartes
 * (numérateur de longueur ≥ 2), on peut le retirer car 1 est neutre multiplicatif.
 * Si le `1` est solitaire dans le numérateur, on ne peut pas le retirer (c'est la
 * valeur du terme).
 *
 * Cf. legacy/js/application.coffee:907-910 — note: le code legacy permet aussi
 * sur les "1" en dénominateur (équivalent : division par 1 inutile). Idem ici.
 */
export function canDeleteOne(state: GameState, cardId: EntityId): boolean {
  if (state.pending) return false;
  const loc = locateCard(state, cardId);
  if (!loc || loc.side === "pioche") return false;
  const frac = state[loc.side][loc.fractionIdx]!;
  // Numérateur-somme : un « 1 » y est un ADDEND (1+x), pas un facteur → on ne
  // le supprime pas (1+x ≠ x).
  if (loc.where === "numerator" && frac.numeratorSumGroups) return false;
  const list = loc.where === "numerator" ? frac.numerator : frac.denominator ?? [];
  const card = list[loc.cardIdx]!;
  if (!isOne(card.atom)) return false;
  if (card.atom.sign === -1) return false; // -1 garde son rôle de "facteur signe"
  return list.length > 1;
}

export function deleteOne(state: GameState, cardId: EntityId): GameState {
  ensureNotPending(state, "deleteOne");
  if (!canDeleteOne(state, cardId)) throw new Error("deleteOne illégale");
  const loc = locateCard(state, cardId)!;
  return updateSide(state, loc.side, (fs) =>
    removeCardAt(fs, loc.fractionIdx, loc.where, loc.cardIdx),
  );
}

/* ─── 3. Annulation de deux termes opposés ───────────────────────────────── */

/**
 * Glisser un terme `t` sur son opposé `-t` (deux fractions distinctes
 * sur le même membre, chacune réduite à un atome simple) → les deux disparaissent.
 *
 * Cf. legacy/js/application.coffee : droppableFracAddition (ligne 874+).
 * On n'implémente pas encore `addPower` (drop nombre sur nombre → addition).
 */
export function canCancelOpposites(
  state: GameState,
  draggedFractionId: EntityId,
  targetFractionId: EntityId,
): boolean {
  if (state.pending) return false;
  if (draggedFractionId === targetFractionId) return false;
  const dl = locateFraction(state, draggedFractionId);
  const tl = locateFraction(state, targetFractionId);
  if (!dl || !tl) return false;
  if (dl.side !== tl.side) return false;
  if (dl.side === "pioche") return false;

  const dFrac = state[dl.side][dl.fractionIdx]!;
  const tFrac = state[tl.side][tl.fractionIdx]!;

  // chaque fraction doit être réduite à un atome simple (numérateur de 1 carte, pas de dénominateur)
  if (dFrac.numerator.length !== 1 || dFrac.denominator) return false;
  if (tFrac.numerator.length !== 1 || tFrac.denominator) return false;

  return atomsOpposite(dFrac.numerator[0]!.atom, tFrac.numerator[0]!.atom);
}

/**
 * Annule deux termes opposés : `t + (-t)` devient `0` dans la fraction cible,
 * et la fraction draguée disparaît. L'élève doit ensuite cliquer le `0`
 * pour terminer la simplification — cette étape intermédiaire matérialise
 * la propriété « somme d'opposés = élément neutre additif ».
 *
 * Cf. legacy `droppableFracAddition` ([application.coffee:874-902](../../legacy/js/application.coffee#L874-L902)) :
 *   `get_card(carte).moveTo "0"` puis `explosion_effect` sur le draggé.
 */
export function cancelOpposites(
  state: GameState,
  draggedFractionId: EntityId,
  targetFractionId: EntityId,
): GameState {
  ensureNotPending(state, "cancelOpposites");
  if (!canCancelOpposites(state, draggedFractionId, targetFractionId)) {
    throw new Error("cancelOpposites illégale");
  }
  const dl = locateFraction(state, draggedFractionId)!;
  const tl = locateFraction(state, targetFractionId)!;
  const ids = makeIdSource(`co${state.shots + 1}_`);

  const next = { ...state };
  return updateSide(next, dl.side, (fs) => {
    // Étape 1 : la cible devient « 0 » (on garde son id pour la stabilité visuelle).
    const targetFrac = fs[tl.fractionIdx]!;
    const zeroFrac: FractionInstance = {
      id: targetFrac.id,
      numerator: [{ id: ids.next(), atom: fromLiteral(0) }],
    };
    const replaced = replaceAt(fs, tl.fractionIdx, zeroFrac);
    // Étape 2 : la fraction draguée disparaît (son index est resté valide).
    return removeAt(replaced, dl.fractionIdx);
  });
}

/* ─── 4. Inversion du signe d'une carte de la pioche ─────────────────────── */

/**
 * Cliquer sur une carte de la pioche pour inverser son signe.
 * Disponible dès `reversePower` (chap. 2+ ou 1-16+).
 * Pas de contrainte sur le contenu : on inverse n'importe quelle carte de pioche.
 */
export function canReverseInPioche(state: GameState, cardId: EntityId): boolean {
  if (state.pending) return false;
  const loc = locateCard(state, cardId);
  return loc !== null && loc.side === "pioche";
}

export function reverseInPioche(state: GameState, cardId: EntityId): GameState {
  ensureNotPending(state, "reverseInPioche");
  if (!canReverseInPioche(state, cardId)) throw new Error("reverseInPioche illégale");
  const loc = locateCard(state, cardId)!;
  return updateSide(state, loc.side, (fs) => {
    const frac = fs[loc.fractionIdx]!;
    const list = loc.where === "numerator" ? frac.numerator : frac.denominator ?? [];
    const newList = replaceAt(list, loc.cardIdx, {
      ...list[loc.cardIdx]!,
      atom: flipSign(list[loc.cardIdx]!.atom),
    });
    return replaceAt(fs, loc.fractionIdx, {
      ...frac,
      [loc.where]: newList,
    } as FractionInstance);
  });
}

/* ─── 5. Drop d'une carte de la pioche : opération en 2 étapes ───────────── */

/** Crée une FractionInstance avec ids frais à partir d'atomes purs (Term). */
function instantiateTerm(term: Term, ids: ReturnType<typeof makeIdSource>): FractionInstance {
  return {
    id: ids.next(),
    numerator: term.numerator.map((a) => ({ id: ids.next(), atom: a })),
    denominator: term.denominator?.map((a) => ({ id: ids.next(), atom: a })),
  };
}

/** Convertit une instance en Term immuable (sans ids). */
function instanceToTerm(f: FractionInstance): Term {
  return {
    numerator: f.numerator.map((c) => c.atom),
    denominator: f.denominator?.map((c) => c.atom),
  };
}

/**
 * Première étape du drop depuis la pioche : pose la carte sur `targetSide`
 * et entre en mode « pending » — il faut maintenant la poser AUSSI sur l'autre
 * côté pour préserver l'équivalence.
 *
 * Cf. legacy `droppableSide` ([application.coffee:978-984](../../legacy/js/application.coffee#L978-L984))
 * et migration/MECHANICS.md §1.
 */
export function startPiocheDrop(
  state: GameState,
  fractionId: EntityId,
  targetSide: "lhs" | "rhs",
): GameState {
  ensureNotPending(state, "startPiocheDrop");
  const loc = locateFraction(state, fractionId);
  if (!loc) throw new Error(`fraction ${fractionId} introuvable`);
  if (loc.side !== "pioche") throw new Error("startPiocheDrop : fraction pas en pioche");

  const piocheFrac = state.pioche[loc.fractionIdx]!;
  const otherSide: "lhs" | "rhs" = targetSide === "lhs" ? "rhs" : "lhs";
  const ids = makeIdSource(`d${state.shots + 1}_a_`);
  const cardToInsert = instanceToTerm(piocheFrac);

  return {
    ...state,
    [targetSide]: [...state[targetSide], instantiateTerm(cardToInsert, ids)],
    pending: {
      piocheFractionId: fractionId,
      remainingTargets: [otherSide],
      cardToInsert,
    },
  };
}

/**
 * Deuxième étape (ou n-ième) : pose la carte de pioche sur un des côtés
 * encore en attente. Quand tous les côtés sont servis, le pending est levé,
 * `shots` est incrémenté, et la carte est retirée de la pioche si `dropOnce`.
 */
export function completePiocheDrop(
  state: GameState,
  side: "lhs" | "rhs",
  opts: { dropOnce: boolean },
): GameState {
  if (!state.pending) throw new Error("completePiocheDrop : aucun pending");
  const idx = state.pending.remainingTargets.indexOf(side);
  if (idx < 0) throw new Error(`completePiocheDrop : côté ${side} pas attendu`);

  const ids = makeIdSource(`d${state.shots + 1}_b_`);
  const clone = instantiateTerm(state.pending.cardToInsert, ids);
  const newRemaining = state.pending.remainingTargets.filter((_, i) => i !== idx);
  const isDone = newRemaining.length === 0;

  if (isDone) {
    // Opération close : on incrémente shots, retire de la pioche si besoin.
    const piocheLoc = locateFraction(state, state.pending.piocheFractionId);
    return {
      ...state,
      pending: null,
      [side]: [...state[side], clone],
      pioche:
        opts.dropOnce && piocheLoc
          ? removeAt(state.pioche, piocheLoc.fractionIdx)
          : state.pioche,
    };
  }

  return {
    ...state,
    [side]: [...state[side], clone],
    pending: { ...state.pending, remainingTargets: newRemaining },
  };
}

/**
 * Annule un drop en cours (échappatoire). Retire les cartes déjà posées et
 * efface le pending. Utile pour un bouton « ↺ » côté UI si l'élève change d'avis.
 *
 * Implémentation simple : on conserve l'invariant que `cardToInsert` est ce qui
 * a été ajouté à *chaque côté absent* des `remainingTargets`. On retire donc
 * la *dernière* fraction de chaque côté ayant déjà reçu la carte.
 */
export function cancelPending(state: GameState): GameState {
  if (!state.pending) return state;
  const allSides: ("lhs" | "rhs")[] = ["lhs", "rhs"];
  const filledSides = allSides.filter((s) => !state.pending!.remainingTargets.includes(s));
  let next: GameState = { ...state, pending: null };
  for (const s of filledSides) {
    next = { ...next, [s]: next[s].slice(0, -1) };
  }
  return next;
}

/* ─── 6. Cross-side : déplacer un terme d'un membre à l'autre ────────────── */

/**
 * Drop d'un terme d'un côté vers l'autre. Le moteur inverse automatiquement
 * son signe (équivalent à « ajouter l'opposé des deux côtés »).
 * Disponible dès `crossPower` (chap. 3+).
 *
 * Cf. legacy/js/application.coffee:985-1003 (branche "lhs"/"rhs" du droppableSide).
 *
 * Simplification : on n'invertit que le premier atome du numérateur (comportement
 * legacy quand le terme est ≥ 2 cartes). Si le terme est solitaire ou est `±1`,
 * on inverse cet atome direct.
 */
export function canMoveAcross(state: GameState, fractionId: EntityId): boolean {
  if (state.pending) return false;
  const loc = locateFraction(state, fractionId);
  return loc !== null && (loc.side === "lhs" || loc.side === "rhs");
}

export function moveAcross(state: GameState, fractionId: EntityId): GameState {
  ensureNotPending(state, "moveAcross");
  if (!canMoveAcross(state, fractionId)) throw new Error("moveAcross illégale");
  const loc = locateFraction(state, fractionId)!;
  const fromSide = loc.side as "lhs" | "rhs";
  const toSide: "lhs" | "rhs" = fromSide === "lhs" ? "rhs" : "lhs";
  const frac = state[fromSide][loc.fractionIdx]!;

  // Inverser le signe : 1ᵉʳ atome de CHAQUE groupe-addend (pour une somme,
  // -(3x+5) = -3x-5), sinon le 1ᵉʳ atome du produit.
  const groupStarts = new Set<number>();
  {
    let idx = 0;
    for (const g of frac.numeratorSumGroups ?? [frac.numerator.length]) {
      groupStarts.add(idx);
      idx += g;
    }
  }
  const flipped: FractionInstance = {
    ...frac,
    numerator: frac.numerator.map((c, i) =>
      groupStarts.has(i) ? { ...c, atom: flipSign(c.atom) } : c,
    ),
  };

  let next = {
    ...state,
    [fromSide]: removeAt(state[fromSide], loc.fractionIdx),
    [toSide]: [...state[toSide], flipped],
  };

  // Si le membre source devient vide, on ajoute un `0` pour le représenter
  // (legacy : insertion d'une fraction "0").
  if (next[fromSide].length === 0) {
    const ids = makeIdSource(`z${state.shots + 1}_`);
    next = {
      ...next,
      [fromSide]: [
        {
          id: ids.next(),
          numerator: [{ id: ids.next(), atom: fromLiteral(0) }],
        },
      ],
    };
  }

  return next;
}

/* ─── 7. Addition de deux littéraux (addPower) ───────────────────────────── */

/**
 * Drop d'un littéral sur un autre littéral du même membre → leurs valeurs
 * s'ajoutent dans la cible, le dragué disparaît. Disponible dès `addPower`
 * (chap. 4+).
 */
export function canAddLiterals(
  state: GameState,
  draggedFractionId: EntityId,
  targetFractionId: EntityId,
): boolean {
  if (state.pending) return false;
  if (draggedFractionId === targetFractionId) return false;
  const dl = locateFraction(state, draggedFractionId);
  const tl = locateFraction(state, targetFractionId);
  if (!dl || !tl) return false;
  if (dl.side !== tl.side || dl.side === "pioche") return false;
  const dFrac = state[dl.side][dl.fractionIdx]!;
  const tFrac = state[tl.side][tl.fractionIdx]!;
  if (dFrac.numerator.length !== 1 || dFrac.denominator) return false;
  if (tFrac.numerator.length !== 1 || tFrac.denominator) return false;
  return dFrac.numerator[0]!.atom.kind === "literal" && tFrac.numerator[0]!.atom.kind === "literal";
}

/* ─── 7.5. Drop d'une carte de pioche dans un trou « _ » (dropdenPower) ───── */

/**
 * Quand l'élève dépose une carte de pioche sur un trou `_` d'une fraction,
 * deux effets simultanés :
 *  1. Le trou est REMPLACÉ par les atomes de la carte de pioche (numérateur
 *     du pioche-fraction).
 *  2. Pour préserver l'équivalence, les MÊMES atomes sont AJOUTÉS dans la
 *     même région (num ou dén) de TOUTES les autres fractions non-pioche.
 *     Si la région n'existe pas (pas de dénominateur), elle est créée.
 *
 * V1 simplifiée : pas de mécanisme « DC + remplissages successifs » comme
 * le legacy. L'équivalence est appliquée automatiquement aux autres fractions.
 *
 * Cf. legacy `droppableFrac` ([application.coffee:828-845](../../legacy/js/application.coffee#L828-L845)).
 */
export function canFillHole(
  state: GameState,
  piocheFractionId: EntityId,
  holeCardId: EntityId,
): boolean {
  if (state.pending) return false;
  const pLoc = locateFraction(state, piocheFractionId);
  if (!pLoc || pLoc.side !== "pioche") return false;
  const hLoc = locateCard(state, holeCardId);
  if (!hLoc || hLoc.side === "pioche") return false;
  const frac = state[hLoc.side][hLoc.fractionIdx]!;
  const list = hLoc.where === "numerator" ? frac.numerator : frac.denominator;
  return list?.[hLoc.cardIdx]?.atom.kind === "hole";
}

export function fillHole(
  state: GameState,
  piocheFractionId: EntityId,
  holeCardId: EntityId,
  opts: { dropOnce: boolean },
): GameState {
  ensureNotPending(state, "fillHole");
  if (!canFillHole(state, piocheFractionId, holeCardId)) {
    throw new Error("fillHole illégale");
  }
  const pLoc = locateFraction(state, piocheFractionId)!;
  const hLoc = locateCard(state, holeCardId)!;
  const piocheFrac = state.pioche[pLoc.fractionIdx]!;
  const atoms = piocheFrac.numerator.map((c) => c.atom);
  const where = hLoc.where;
  const ids = makeIdSource(`fh${state.shots + 1}_`);

  const fillTarget = (f: FractionInstance): FractionInstance => {
    const list = where === "numerator" ? f.numerator : (f.denominator ?? []);
    const replacements = atoms.map((a) => ({ id: ids.next(), atom: a }));
    const newList = [
      ...list.slice(0, hLoc.cardIdx),
      ...replacements,
      ...list.slice(hLoc.cardIdx + 1),
    ];
    return where === "numerator"
      ? { ...f, numerator: newList }
      : { ...f, denominator: newList.length > 0 ? newList : undefined };
  };

  const appendToOther = (f: FractionInstance): FractionInstance => {
    const list = where === "numerator" ? f.numerator : (f.denominator ?? []);
    const additions = atoms.map((a) => ({ id: ids.next(), atom: a }));
    const newList = [...list, ...additions];
    return where === "numerator"
      ? { ...f, numerator: newList }
      : { ...f, denominator: newList };
  };

  const transformSide = (side: "lhs" | "rhs"): FractionInstance[] =>
    state[side].map((f, fi) =>
      side === hLoc.side && fi === hLoc.fractionIdx ? fillTarget(f) : appendToOther(f),
    );

  return {
    ...state,
    lhs: transformSide("lhs"),
    rhs: transformSide("rhs"),
    pioche: opts.dropOnce ? removeAt(state.pioche, pLoc.fractionIdx) : state.pioche,
  };
}

/* ─── 7.6. Multiplier toutes les fractions par une carte (drop au numérateur) ─ */

/**
 * Drop d'une carte de pioche sur la zone numérateur d'une fraction →
 * ajoute cette carte au NUMÉRATEUR de chaque fraction des deux membres.
 * Équivalent à multiplier par la carte des deux côtés.
 */
export function canMultiplyAllNum(
  state: GameState,
  piocheFractionId: EntityId,
): boolean {
  if (state.pending) return false;
  const loc = locateFraction(state, piocheFractionId);
  return loc !== null && loc.side === "pioche";
}

export function multiplyAllNum(
  state: GameState,
  piocheFractionId: EntityId,
  opts: { dropOnce: boolean },
): GameState {
  ensureNotPending(state, "multiplyAllNum");
  if (!canMultiplyAllNum(state, piocheFractionId)) {
    throw new Error("multiplyAllNum illégale");
  }
  const pLoc = locateFraction(state, piocheFractionId)!;
  const piocheFrac = state.pioche[pLoc.fractionIdx]!;
  const atoms = piocheFrac.numerator.map((c) => c.atom);
  const ids = makeIdSource(`mul${state.shots + 1}_`);

  const appendNum = (f: FractionInstance): FractionInstance => {
    // Fraction-somme : on DISTRIBUE le facteur sur chaque groupe ((3x+5)·k =
    // 3x·k + 5·k), en l'ajoutant à la fin de chaque groupe.
    if (f.numeratorSumGroups) {
      const newNum: CardInstance[] = [];
      const newSizes: number[] = [];
      let idx = 0;
      for (const g of f.numeratorSumGroups) {
        newNum.push(...f.numerator.slice(idx, idx + g));
        newNum.push(...atoms.map((a) => ({ id: ids.next(), atom: a })));
        newSizes.push(g + atoms.length);
        idx += g;
      }
      return { ...f, numerator: newNum, numeratorSumGroups: newSizes };
    }
    const additions = atoms.map((a) => ({ id: ids.next(), atom: a }));
    return { ...f, numerator: [...f.numerator, ...additions] };
  };

  return {
    ...state,
    lhs: state.lhs.map(appendNum),
    rhs: state.rhs.map(appendNum),
    pioche: opts.dropOnce ? removeAt(state.pioche, pLoc.fractionIdx) : state.pioche,
  };
}

/* ─── 7.7. Diviser les deux membres par une carte (drop sous l'équation) ──── */

/**
 * Drop d'une carte de pioche dans la zone « sous l'équation » → toutes les
 * fractions des deux membres se voient ajouter cette carte au dénominateur
 * (créé si nécessaire). C'est l'opération « ÷ atom » appliquée à l'ensemble
 * de l'équation, équivalente à multiplier par 1/atom des deux côtés.
 *
 * Différence avec fillHole : pas de trou _ requis, on agit sur toutes les
 * fractions globalement.
 */
export function canDivideAll(
  state: GameState,
  piocheFractionId: EntityId,
): boolean {
  if (state.pending) return false;
  const loc = locateFraction(state, piocheFractionId);
  return loc !== null && loc.side === "pioche";
}

export function divideAll(
  state: GameState,
  piocheFractionId: EntityId,
  opts: { dropOnce: boolean },
): GameState {
  ensureNotPending(state, "divideAll");
  if (!canDivideAll(state, piocheFractionId)) {
    throw new Error("divideAll illégale");
  }
  const pLoc = locateFraction(state, piocheFractionId)!;
  const piocheFrac = state.pioche[pLoc.fractionIdx]!;
  const atoms = piocheFrac.numerator.map((c) => c.atom);
  const ids = makeIdSource(`div${state.shots + 1}_`);

  const appendDen = (f: FractionInstance): FractionInstance => {
    const existing = f.denominator ?? [];
    const additions = atoms.map((a) => ({ id: ids.next(), atom: a }));
    return { ...f, denominator: [...existing, ...additions] };
  };

  return {
    ...state,
    lhs: state.lhs.map(appendDen),
    rhs: state.rhs.map(appendDen),
    pioche: opts.dropOnce ? removeAt(state.pioche, pLoc.fractionIdx) : state.pioche,
  };
}

/* ─── 8. Simplification de fraction : numérateur / dénominateur identiques ─ */

/**
 * Glisser une carte de DÉNOMINATEUR sur une carte de NUMÉRATEUR (ou l'inverse)
 * de la MÊME fraction, avec la même valeur d'atome → la cible (numérateur)
 * devient « 1 », la draguée (dénominateur) disparaît. Si le dénominateur
 * devient vide, le champ `denominator` est retiré.
 *
 * C'est la simplification `p/p = 1` enseignée au niveau 2-1.
 * Cf. legacy `droppableFracSimplify` ([application.coffee:850-870](../../legacy/js/application.coffee#L850-L870)).
 */
export function canSimplifyFraction(
  state: GameState,
  sourceCardId: EntityId,
  targetCardId: EntityId,
): boolean {
  if (state.pending) return false;
  if (sourceCardId === targetCardId) return false;
  const sLoc = locateCard(state, sourceCardId);
  const tLoc = locateCard(state, targetCardId);
  if (!sLoc || !tLoc) return false;
  if (sLoc.side === "pioche" || tLoc.side === "pioche") return false;
  if (sLoc.side !== tLoc.side || sLoc.fractionIdx !== tLoc.fractionIdx) return false;
  if (sLoc.where === tLoc.where) return false; // un dans num, l'autre dans dén
  const frac = state[sLoc.side][sLoc.fractionIdx]!;
  // Pas de simplification num↔dén sur un numérateur-somme non réduit.
  if (frac.numeratorSumGroups) return false;
  const sList = sLoc.where === "numerator" ? frac.numerator : frac.denominator!;
  const tList = tLoc.where === "numerator" ? frac.numerator : frac.denominator!;
  return atomsEqual(sList[sLoc.cardIdx]!.atom, tList[tLoc.cardIdx]!.atom);
}

export function simplifyFraction(
  state: GameState,
  sourceCardId: EntityId,
  targetCardId: EntityId,
): GameState {
  ensureNotPending(state, "simplifyFraction");
  if (!canSimplifyFraction(state, sourceCardId, targetCardId)) {
    throw new Error("simplifyFraction illégale");
  }
  const sLoc = locateCard(state, sourceCardId)!;
  const tLoc = locateCard(state, targetCardId)!;
  // shots est compté par l'UI (recordShot), comme toutes les autres opérations.
  return updateSide(state, sLoc.side, (fs) => {
    const frac = fs[sLoc.fractionIdx]!;
    const numIdx = sLoc.where === "numerator" ? sLoc.cardIdx : tLoc.cardIdx;
    const denIdx = sLoc.where === "denominator" ? sLoc.cardIdx : tLoc.cardIdx;
    // Le numérateur cible devient « 1 » (on garde l'id pour la stabilité visuelle)
    const numCard = frac.numerator[numIdx]!;
    const newNum = replaceAt(frac.numerator, numIdx, { id: numCard.id, atom: fromLiteral(1) });
    // Le dénominateur source disparaît
    const newDen = removeAt(frac.denominator!, denIdx);
    return replaceAt(fs, sLoc.fractionIdx, {
      ...frac,
      numerator: newNum,
      denominator: newDen.length === 0 ? undefined : newDen,
    });
  });
}

/* ─── 8.3. Multiplication intra-fraction (multPower, chap. 4+) ────────────── */

/**
 * Drag d'une carte sur une autre carte du MÊME numérateur (ou même
 * dénominateur) — toutes deux littérales — pour multiplier leurs valeurs.
 * La cible devient le produit, la source disparaît. Cf. droppableFracSimplify
 * branche « siblings » ([application.coffee:864-867](../../legacy/js/application.coffee#L864-L867)).
 */
export function canMultiplyInFraction(
  state: GameState,
  sourceCardId: EntityId,
  targetCardId: EntityId,
): boolean {
  if (state.pending) return false;
  if (sourceCardId === targetCardId) return false;
  const sLoc = locateCard(state, sourceCardId);
  const tLoc = locateCard(state, targetCardId);
  if (!sLoc || !tLoc) return false;
  if (sLoc.side === "pioche" || tLoc.side === "pioche") return false;
  if (sLoc.side !== tLoc.side || sLoc.fractionIdx !== tLoc.fractionIdx) return false;
  if (sLoc.where !== tLoc.where) return false; // doivent être dans la MÊME région
  const frac = state[sLoc.side][sLoc.fractionIdx]!;
  // Numérateur-somme : les cartes s'additionnent (clic), pas se multiplient.
  if (frac.numeratorSumGroups) return false;
  const list = sLoc.where === "numerator" ? frac.numerator : frac.denominator!;
  const sCard = list[sLoc.cardIdx]!;
  const tCard = list[tLoc.cardIdx]!;
  return sCard.atom.kind === "literal" && tCard.atom.kind === "literal";
}

export function multiplyInFraction(
  state: GameState,
  sourceCardId: EntityId,
  targetCardId: EntityId,
): GameState {
  ensureNotPending(state, "multiplyInFraction");
  if (!canMultiplyInFraction(state, sourceCardId, targetCardId)) {
    throw new Error("multiplyInFraction illégale");
  }
  const sLoc = locateCard(state, sourceCardId)!;
  const tLoc = locateCard(state, targetCardId)!;
  const frac = state[sLoc.side][sLoc.fractionIdx]!;
  const list = sLoc.where === "numerator" ? frac.numerator : frac.denominator!;
  const sVal = literalValue(list[sLoc.cardIdx]!.atom);
  const tVal = literalValue(list[tLoc.cardIdx]!.atom);
  const product = sVal * tVal;
  // Cible devient le produit (id conservé), source retirée.
  const newCard = { id: list[tLoc.cardIdx]!.id, atom: fromLiteral(product) };
  let newList = replaceAt(list, tLoc.cardIdx, newCard);
  newList = removeAt(newList, sLoc.cardIdx);
  const newFrac =
    sLoc.where === "numerator"
      ? { ...frac, numerator: newList }
      : { ...frac, denominator: newList };
  return updateSide(state, sLoc.side, (fs) => replaceAt(fs, sLoc.fractionIdx, newFrac));
}

/* ─── 8.4. Multiplication par −1 / prendre l'opposé (negPower, chap. 5+) ─── */

/**
 * Glisser une carte « −1 » sur une autre carte de la même région (num ou dén)
 * d'une même fraction → la cible voit son signe inversé, le « −1 » disparaît.
 * Multiplication par −1 = prendre l'opposé.
 */
export function canApplyNegOne(
  state: GameState,
  sourceCardId: EntityId,
  targetCardId: EntityId,
): boolean {
  if (state.pending) return false;
  if (sourceCardId === targetCardId) return false;
  const sLoc = locateCard(state, sourceCardId);
  const tLoc = locateCard(state, targetCardId);
  if (!sLoc || !tLoc) return false;
  if (sLoc.side === "pioche" || tLoc.side === "pioche") return false;
  if (sLoc.side !== tLoc.side || sLoc.fractionIdx !== tLoc.fractionIdx) return false;
  if (sLoc.where !== tLoc.where) return false;
  const frac = state[sLoc.side][sLoc.fractionIdx]!;
  const list = sLoc.where === "numerator" ? frac.numerator : frac.denominator!;
  const sCard = list[sLoc.cardIdx]!;
  return sCard.atom.kind === "literal" && sCard.atom.value === 1 && sCard.atom.sign === -1;
}

export function applyNegOne(
  state: GameState,
  sourceCardId: EntityId,
  targetCardId: EntityId,
): GameState {
  ensureNotPending(state, "applyNegOne");
  if (!canApplyNegOne(state, sourceCardId, targetCardId)) {
    throw new Error("applyNegOne illégale");
  }
  const sLoc = locateCard(state, sourceCardId)!;
  const tLoc = locateCard(state, targetCardId)!;
  const frac = state[sLoc.side][sLoc.fractionIdx]!;
  const list = sLoc.where === "numerator" ? frac.numerator : frac.denominator!;
  const tCard = list[tLoc.cardIdx]!;
  // Cible : signe inversé (id conservé)
  const flipped = { id: tCard.id, atom: flipSign(tCard.atom) };
  let newList = replaceAt(list, tLoc.cardIdx, flipped);
  // Source (-1) : retirée
  newList = removeAt(newList, sLoc.cardIdx);
  const newFrac =
    sLoc.where === "numerator"
      ? { ...frac, numerator: newList }
      : { ...frac, denominator: newList };
  return updateSide(state, sLoc.side, (fs) => replaceAt(fs, sLoc.fractionIdx, newFrac));
}

/* ─── 8.5. Factorisation en facteurs premiers (primeFactorPower, chap. 4+) ─ */

/**
 * Décompose un entier en ses facteurs premiers.
 * Cf. legacy primeFactorization ([application.coffee:604-617](../../legacy/js/application.coffee#L604-L617)).
 */
function primeFactorize(n: number): number[] {
  const factors: number[] = [];
  let v = n;
  let p = 2;
  while (v > 1) {
    if (v % p === 0) {
      factors.push(p);
      v /= p;
    } else {
      p += p === 2 ? 1 : 2;
      if (p * p > v) {
        factors.push(v);
        break;
      }
    }
  }
  return factors;
}

/**
 * Cliquer (double-tap) sur une carte la décompose :
 * - Littéral positif > 3        → facteurs premiers (ex: 6 → 2, 3).
 * - Littéral négatif, |v| > 1   → -1 + facteurs premiers (ex: -6 → -1, 2, 3 ;
 *                                 -2 → -1, 2).
 * - Symbole / unknown négatif   → -1 + atome positif (ex: -t → -1, t ;
 *                                 -x → -1, x). Permet d'isoler le signe
 *                                 pour l'absorber via negPower.
 * Cas exclus : 0, 1, -1 (atomiques) ; +t, +x (rien à extraire).
 */
export function canFactorize(state: GameState, cardId: EntityId): boolean {
  if (state.pending) return false;
  const loc = locateCard(state, cardId);
  if (!loc || loc.side === "pioche") return false;
  const frac = state[loc.side][loc.fractionIdx]!;
  const list = loc.where === "numerator" ? frac.numerator : frac.denominator;
  const card = list?.[loc.cardIdx];
  if (!card) return false;
  const a = card.atom;
  if (a.kind === "literal") {
    if (a.sign === 1) return a.value > 3;
    return a.value > 1; // négatif : -1 + facteurs (au moins 2 cartes)
  }
  // Symbole / unknown : décomposable ssi négatif (extraction du -1).
  // hole : non décomposable.
  if (a.kind === "symbol" || a.kind === "unknown") return a.sign === -1;
  return false;
}

export function factorize(state: GameState, cardId: EntityId): GameState {
  ensureNotPending(state, "factorize");
  if (!canFactorize(state, cardId)) throw new Error("factorize illégale");
  const loc = locateCard(state, cardId)!;
  const frac = state[loc.side][loc.fractionIdx]!;
  const list = loc.where === "numerator" ? frac.numerator : frac.denominator!;
  const card = list[loc.cardIdx]!;
  const atom = card.atom;
  const ids = makeIdSource(`pf${state.shots + 1}_`);
  const minusOne = () => ({
    id: ids.next(),
    atom: { kind: "literal" as const, sign: -1 as const, value: 1 },
  });
  let replacements: { id: string; atom: Atom }[];
  if (atom.kind === "literal") {
    const factors = primeFactorize(atom.value);
    replacements = [
      ...(atom.sign === -1 ? [minusOne()] : []),
      ...factors.map((f) => ({
        id: ids.next(),
        atom: { kind: "literal" as const, sign: 1 as const, value: f },
      })),
    ];
  } else {
    // Symbole ou unknown négatif : -1 + atome rendu positif.
    replacements = [
      minusOne(),
      { id: ids.next(), atom: { ...atom, sign: 1 as const } },
    ];
  }
  if (replacements.length < 2) return state;
  const newList = [...list.slice(0, loc.cardIdx), ...replacements, ...list.slice(loc.cardIdx + 1)];
  const newFrac =
    loc.where === "numerator"
      ? { ...frac, numerator: newList }
      : { ...frac, denominator: newList };
  return updateSide(state, loc.side, (fs) => replaceAt(fs, loc.fractionIdx, newFrac));
}

/* ─── 9. Addition de deux littéraux (addPower, chap. 4+) ───────────────────── */

export function addLiterals(
  state: GameState,
  draggedFractionId: EntityId,
  targetFractionId: EntityId,
): GameState {
  ensureNotPending(state, "addLiterals");
  if (!canAddLiterals(state, draggedFractionId, targetFractionId)) {
    throw new Error("addLiterals illégale");
  }
  const dl = locateFraction(state, draggedFractionId)!;
  const tl = locateFraction(state, targetFractionId)!;
  const dFrac = state[dl.side][dl.fractionIdx]!;
  const tFrac = state[tl.side][tl.fractionIdx]!;
  const sum = literalValue(dFrac.numerator[0]!.atom) + literalValue(tFrac.numerator[0]!.atom);
  const newTarget: FractionInstance = {
    ...tFrac,
    numerator: [{ id: tFrac.numerator[0]!.id, atom: fromLiteral(sum) }],
  };
  const next = { ...state };
  return updateSide(next, dl.side, (fs) => {
    const removed = removeAt(fs, dl.fractionIdx);
    // l'index de la cible peut avoir bougé si on a retiré avant elle
    const newTargetIdx = dl.fractionIdx < tl.fractionIdx ? tl.fractionIdx - 1 : tl.fractionIdx;
    return replaceAt(removed, newTargetIdx, newTarget);
  });
}

/* ─── 9.5. Addition de fractions de même dénominateur (addFractionPower) ───── */

/** Deux fractions ont-elles exactement le même dénominateur (produit d'atomes) ? */
function sameDenominator(a: FractionInstance, b: FractionInstance): boolean {
  const da = a.denominator;
  const db = b.denominator;
  if (!da || !db || da.length !== db.length) return false;
  return da.every((c, i) => atomsEqual(c.atom, db[i]!.atom));
}

/** Découpe le numérateur (plat) en groupes-addends selon numeratorSumGroups. */
function numeratorGroups(frac: FractionInstance): CardInstance[][] {
  const sizes = frac.numeratorSumGroups ?? [frac.numerator.length];
  const groups: CardInstance[][] = [];
  let idx = 0;
  for (const g of sizes) {
    groups.push(frac.numerator.slice(idx, idx + g));
    idx += g;
  }
  return groups;
}

/** Clé littérale de chaque groupe, ou null si un groupe n'est pas réductible. */
function numeratorGroupKeys(frac: FractionInstance): string[] | null {
  const keys: string[] = [];
  for (const g of numeratorGroups(frac)) {
    const s = splitAtoms(g.map((c) => c.atom));
    if (!s) return null;
    keys.push(s.key);
  }
  return keys;
}

/**
 * Drop d'une fraction sur une autre de MÊME dénominateur → on concatène les
 * numérateurs en SOMME NON CALCULÉE sur le dénominateur commun (ex.
 * 3x/2 + 5/2 → (3x+5)/2). Numérateurs quelconques. L'élève réduit au clic.
 */
export function canAddFractions(
  state: GameState,
  draggedFractionId: EntityId,
  targetFractionId: EntityId,
): boolean {
  if (state.pending) return false;
  if (draggedFractionId === targetFractionId) return false;
  const dl = locateFraction(state, draggedFractionId);
  const tl = locateFraction(state, targetFractionId);
  if (!dl || !tl) return false;
  if (dl.side !== tl.side || dl.side === "pioche") return false;
  const dFrac = state[dl.side][dl.fractionIdx]!;
  const tFrac = state[tl.side][tl.fractionIdx]!;
  if (!dFrac.denominator || !tFrac.denominator) return false;
  return sameDenominator(dFrac, tFrac);
}

export function addFractions(
  state: GameState,
  draggedFractionId: EntityId,
  targetFractionId: EntityId,
): GameState {
  ensureNotPending(state, "addFractions");
  if (!canAddFractions(state, draggedFractionId, targetFractionId)) {
    throw new Error("addFractions illégale");
  }
  const dl = locateFraction(state, draggedFractionId)!;
  const tl = locateFraction(state, targetFractionId)!;
  const dFrac = state[dl.side][dl.fractionIdx]!;
  const tFrac = state[tl.side][tl.fractionIdx]!;
  const ids = makeIdSource(`af${state.shots + 1}_`);
  const clone = (c: CardInstance): CardInstance => ({ id: ids.next(), atom: c.atom });
  // Concatène dragué puis cible (lecture gauche→droite). Les groupes existants
  // (si déjà des sommes) sont préservés.
  const numerator = [...dFrac.numerator.map(clone), ...tFrac.numerator.map(clone)];
  const numeratorSumGroups = [
    ...(dFrac.numeratorSumGroups ?? [dFrac.numerator.length]),
    ...(tFrac.numeratorSumGroups ?? [tFrac.numerator.length]),
  ];
  const newTarget: FractionInstance = {
    id: tFrac.id,
    numerator,
    denominator: tFrac.denominator,
    numeratorSumGroups,
  };
  const next = { ...state };
  return updateSide(next, dl.side, (fs) => {
    const removed = removeAt(fs, dl.fractionIdx);
    const newTargetIdx = dl.fractionIdx < tl.fractionIdx ? tl.fractionIdx - 1 : tl.fractionIdx;
    return replaceAt(removed, newTargetIdx, newTarget);
  });
}

/* ─── 9.7. Réduction d'un numérateur-somme (clic : combine les termes semblables) */

export function canReduceNumeratorSum(state: GameState, cardId: EntityId): boolean {
  if (state.pending) return false;
  const loc = locateCard(state, cardId);
  if (!loc || loc.side === "pioche" || loc.where !== "numerator") return false;
  const frac = state[loc.side][loc.fractionIdx]!;
  if (!frac.numeratorSumGroups || frac.numeratorSumGroups.length < 2) return false;
  const keys = numeratorGroupKeys(frac);
  if (!keys) return false;
  // Réductible s'il existe au moins deux groupes de même clé.
  return new Set(keys).size < keys.length;
}

export function reduceNumeratorSum(state: GameState, cardId: EntityId): GameState {
  ensureNotPending(state, "reduceNumeratorSum");
  if (!canReduceNumeratorSum(state, cardId)) {
    throw new Error("reduceNumeratorSum illégale");
  }
  const loc = locateCard(state, cardId)!;
  const frac = state[loc.side][loc.fractionIdx]!;
  // Combine les groupes de même clé (ordre de 1ʳᵉ apparition), somme des coefs.
  const order: string[] = [];
  const acc = new Map<string, { coef: number; symbolic: Atom[] }>();
  for (const g of numeratorGroups(frac)) {
    const s = splitAtoms(g.map((c) => c.atom))!;
    if (!acc.has(s.key)) {
      acc.set(s.key, { coef: 0, symbolic: s.symbolic });
      order.push(s.key);
    }
    acc.get(s.key)!.coef += s.coef;
  }
  const ids = makeIdSource(`rn${state.shots + 1}_`);
  const groupAtoms = order.map((k) => buildTermAtoms(acc.get(k)!.coef, acc.get(k)!.symbolic));
  const numerator = groupAtoms.flat().map((a) => ({ id: ids.next(), atom: a }));
  const sizes = groupAtoms.map((g) => g.length);
  const reduced: FractionInstance = {
    id: frac.id,
    numerator,
    denominator: frac.denominator,
    numeratorSumGroups: sizes.length > 1 ? sizes : undefined,
  };
  return updateSide(state, loc.side, (fs) => replaceAt(fs, loc.fractionIdx, reduced));
}

/* ─── 9.6. Addition de termes semblables sans dénominateur (addTermsPower) ──── */

/**
 * Décompose un terme SANS dénominateur en (coefficient numérique, partie
 * littérale ordonnée sign-strippée). Renvoie null si le terme a un dénominateur
 * ou contient un trou.
 */
/** Décompose un PRODUIT d'atomes en (coef numérique, clé littérale ordonnée,
 *  partie symbolique sign-strippée). null si un atome est un trou. */
function splitAtoms(
  atoms: Atom[],
): { coef: number; key: string; symbolic: Atom[] } | null {
  let coef = 1;
  const symbolic: Atom[] = [];
  for (const a of atoms) {
    if (a.kind === "literal") {
      coef *= a.sign * a.value;
    } else if (a.kind === "unknown" || a.kind === "symbol") {
      coef *= a.sign;
      symbolic.push({ ...a, sign: 1 });
    } else {
      return null; // hole : pas additionnable
    }
  }
  const key = symbolic
    .map((a) => (a.kind === "unknown" ? "x" : (a as { letter: string }).letter))
    .join(".");
  return { coef, key, symbolic };
}

/** Atomes d'un terme depuis (coef, partie symbolique), normalisé : coef ±1
 *  implicite, coef 0 → littéral 0, partie pure → littéral. */
function buildTermAtoms(coef: number, symbolic: Atom[]): Atom[] {
  if (symbolic.length === 0 || coef === 0) return [fromLiteral(coef)];
  if (coef === 1) return symbolic.map((a) => ({ ...a }));
  if (coef === -1) {
    return symbolic.map((a, i) => (i === 0 ? { ...a, sign: -1 as const } : { ...a }));
  }
  return [fromLiteral(coef), ...symbolic.map((a) => ({ ...a }))];
}

function splitTerm(
  frac: FractionInstance,
): { coef: number; key: string; symbolic: Atom[] } | null {
  if (frac.denominator || frac.numeratorSumGroups) return null;
  return splitAtoms(frac.numerator.map((c) => c.atom));
}

/**
 * Drop d'un terme sur un autre, SANS dénominateur, dont les parties littérales
 * sont RIGOUREUSEMENT identiques (mêmes atomes, même ordre) — ou deux nombres.
 * Les coefficients s'ajoutent. Ex : 2x + 5x = 7x, 2 + 3 = 5, ab + ab = 2ab.
 * Refus si les parties ne sont pas dans la même forme (ex : xy vs yx).
 */
export function canAddTerms(
  state: GameState,
  draggedFractionId: EntityId,
  targetFractionId: EntityId,
): boolean {
  if (state.pending) return false;
  if (draggedFractionId === targetFractionId) return false;
  const dl = locateFraction(state, draggedFractionId);
  const tl = locateFraction(state, targetFractionId);
  if (!dl || !tl) return false;
  if (dl.side !== tl.side || dl.side === "pioche") return false;
  const ds = splitTerm(state[dl.side][dl.fractionIdx]!);
  const ts = splitTerm(state[tl.side][tl.fractionIdx]!);
  if (!ds || !ts) return false;
  return ds.key === ts.key;
}

export function addTerms(
  state: GameState,
  draggedFractionId: EntityId,
  targetFractionId: EntityId,
): GameState {
  ensureNotPending(state, "addTerms");
  if (!canAddTerms(state, draggedFractionId, targetFractionId)) {
    throw new Error("addTerms illégale");
  }
  const dl = locateFraction(state, draggedFractionId)!;
  const tl = locateFraction(state, targetFractionId)!;
  const tFrac = state[tl.side][tl.fractionIdx]!;
  const ds = splitTerm(state[dl.side][dl.fractionIdx]!)!;
  const ts = splitTerm(tFrac)!;
  const sum = ds.coef + ts.coef;
  const ids = makeIdSource(`at${state.shots + 1}_`);

  let atoms: Atom[];
  if (ts.symbolic.length === 0 || sum === 0) {
    // partie numérique pure, ou somme nulle → un simple nombre
    atoms = [fromLiteral(sum)];
  } else if (sum === 1) {
    atoms = ts.symbolic; // 1·(partie) → partie
  } else if (sum === -1) {
    atoms = ts.symbolic.map((a, i) => (i === 0 ? { ...a, sign: -1 as const } : a));
  } else {
    atoms = [fromLiteral(sum), ...ts.symbolic];
  }
  const newTarget: FractionInstance = {
    id: tFrac.id,
    numerator: atoms.map((a) => ({ id: ids.next(), atom: a })),
  };
  const next = { ...state };
  return updateSide(next, dl.side, (fs) => {
    const removed = removeAt(fs, dl.fractionIdx);
    const newTargetIdx = dl.fractionIdx < tl.fractionIdx ? tl.fractionIdx - 1 : tl.fractionIdx;
    return replaceAt(removed, newTargetIdx, newTarget);
  });
}
