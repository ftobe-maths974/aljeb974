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

import { atomsOpposite, flipSign, isZero, isOne, literalValue, fromLiteral } from "./atoms.ts";
import type { Atom, Term } from "./dsl.ts";
import type { EntityId, FractionInstance, GameState, Side } from "./state.ts";
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
  // retirer les deux fractions du même membre (en partant de l'index le plus grand)
  const [a, b] = dl.fractionIdx > tl.fractionIdx
    ? [dl.fractionIdx, tl.fractionIdx]
    : [tl.fractionIdx, dl.fractionIdx];
  const next = { ...state, shots: state.shots + 1 };
  return updateSide(next, dl.side, (fs) => removeAt(removeAt(fs, a), b));
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
      shots: state.shots + 1,
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

  // inverser le signe du premier atome du numérateur
  const flipped: FractionInstance = {
    ...frac,
    numerator: replaceAt(frac.numerator, 0, {
      ...frac.numerator[0]!,
      atom: flipSign(frac.numerator[0]!.atom),
    }),
  };

  let next = {
    ...state,
    shots: state.shots + 1,
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
  const next = { ...state, shots: state.shots + 1 };
  return updateSide(next, dl.side, (fs) => {
    const removed = removeAt(fs, dl.fractionIdx);
    // l'index de la cible peut avoir bougé si on a retiré avant elle
    const newTargetIdx = dl.fractionIdx < tl.fractionIdx ? tl.fractionIdx - 1 : tl.fractionIdx;
    return replaceAt(removed, newTargetIdx, newTarget);
  });
}
