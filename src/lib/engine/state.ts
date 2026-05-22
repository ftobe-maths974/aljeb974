/**
 * state.ts — l'état immuable d'une partie en cours sur un niveau.
 *
 * Conventions :
 *  - chaque entité a un `id` stable (string), généré à l'initialisation.
 *    Les opérations préservent les ids quand elles ne créent pas de nouvelle entité.
 *  - tout est immutable : les opérations renvoient un *nouveau* GameState
 *    (structural sharing pour le reste).
 */

import type { Atom, Level, Term } from "./dsl.ts";

/**
 * État de « drop en attente » — modélise le block mode du legacy :
 * la carte de pioche a été posée d'un côté de l'équation, et il faut maintenant
 * la poser AUSSI sur l'autre côté pour préserver l'équivalence.
 *
 * Tant que `pending` est non-null, toutes les autres opérations sont refusées
 * par le moteur (équivalent du flag `blocked = true` du legacy).
 *
 * Cf. migration/MECHANICS.md §1.
 */
export interface PendingState {
  /** Id de la fraction de pioche qui doit être déposée sur chaque cible restante. */
  piocheFractionId: EntityId;
  /** Membres qui n'ont pas encore reçu la carte. Vide → l'opération sera close. */
  remainingTargets: ("lhs" | "rhs")[];
  /** Forme structurale de la carte à insérer (atomes, sans ids). */
  cardToInsert: Term;
}

/** Identifiant unique d'une entité (carte/fraction/membre) dans un état donné. */
export type EntityId = string;

/**
 * Une carte (Atom + id stable). Identifie une instance précise d'atome
 * dans une fraction donnée, pour permettre les opérations ciblées.
 */
export interface CardInstance {
  id: EntityId;
  atom: Atom;
}

/** Une fraction instanciée (numérateur + dénominateur optionnel, ids inclus). */
export interface FractionInstance {
  id: EntityId;
  numerator: CardInstance[];
  denominator?: CardInstance[];
  /**
   * État transitoire : le numérateur est une SOMME NON CALCULÉE (chaque carte
   * est un addend littéral, à additionner), issue de la fusion de fractions de
   * même dénominateur. L'élève clique pour réduire. Tant que true, la fraction
   * n'est éligible qu'à la réduction (les autres opérations la refusent).
   */
  numeratorIsSum?: boolean;
}

/** Désigne un côté de l'équation. */
export type Side = "lhs" | "rhs" | "pioche";

/** L'état complet d'une partie en cours. */
export interface GameState {
  /** Identifiant du niveau (ex: "3-7"). */
  levelId: string;
  /** Membre gauche : liste ordonnée de fractions (somme additive). */
  lhs: FractionInstance[];
  /** Membre droit. Peut être vide si niveau sans `=` (chapitre 1 niveau 1-2). */
  rhs: FractionInstance[];
  /** Cartes disponibles dans la pioche (vide si niveau sans pioche). */
  pioche: FractionInstance[];
  /** Compteur de drops effectués (utilisé pour l'objectif 3 étoiles). */
  shots: number;
  /** Cible de drops pour 3 étoiles. */
  shotsTarget: number;
  /** Vrai dès qu'isSolved a retourné vrai (figé jusqu'au reset). */
  won: boolean;
  /** Drop de pioche en cours, attente du 2ᵉ geste de l'élève. Null hors-block-mode. */
  pending: PendingState | null;
}

/* ─── Génération d'ids stables ────────────────────────────────────────────── */

/**
 * Source d'identifiants. Une instance par GameState garantit l'unicité
 * dans la durée de vie de cet état. Utilisée seulement à l'initialisation
 * et lors des opérations qui créent de nouvelles entités.
 */
export interface IdSource {
  next(): EntityId;
}

export function makeIdSource(prefix = "e"): IdSource {
  let n = 0;
  return {
    next() {
      n += 1;
      return `${prefix}${n}`;
    },
  };
}

/* ─── Initialisation à partir d'un Level ──────────────────────────────────── */

function termsToFractions(terms: Term[], ids: IdSource): FractionInstance[] {
  return terms.map((t) => ({
    id: ids.next(),
    numerator: t.numerator.map((a) => ({ id: ids.next(), atom: a })),
    denominator: t.denominator
      ? t.denominator.map((a) => ({ id: ids.next(), atom: a }))
      : undefined,
  }));
}

/** Construit l'état initial d'une partie à partir d'un Level + son identifiant. */
export function initialState(level: Level, levelId: string): GameState {
  const ids = makeIdSource();
  return {
    levelId,
    lhs: termsToFractions(level.lhs, ids),
    rhs: level.rhs ? termsToFractions(level.rhs, ids) : [],
    pioche: level.pioche ? termsToFractions(level.pioche, ids) : [],
    shots: 0,
    shotsTarget: level.shots,
    won: false,
    pending: null,
  };
}

/* ─── Helpers de recherche ────────────────────────────────────────────────── */

/** Trouve la fraction contenant une carte par id. Retourne {side, fractionIdx, where, cardIdx} ou null. */
export interface CardLocation {
  side: Side;
  fractionIdx: number;
  where: "numerator" | "denominator";
  cardIdx: number;
}

export function locateCard(state: GameState, cardId: EntityId): CardLocation | null {
  const sides: Side[] = ["lhs", "rhs", "pioche"];
  for (const side of sides) {
    const fractions = state[side];
    for (let fi = 0; fi < fractions.length; fi++) {
      const frac = fractions[fi]!;
      const ni = frac.numerator.findIndex((c) => c.id === cardId);
      if (ni >= 0) return { side, fractionIdx: fi, where: "numerator", cardIdx: ni };
      if (frac.denominator) {
        const di = frac.denominator.findIndex((c) => c.id === cardId);
        if (di >= 0) return { side, fractionIdx: fi, where: "denominator", cardIdx: di };
      }
    }
  }
  return null;
}

/** Trouve une fraction par id. */
export function locateFraction(
  state: GameState,
  fractionId: EntityId,
): { side: Side; fractionIdx: number } | null {
  const sides: Side[] = ["lhs", "rhs", "pioche"];
  for (const side of sides) {
    const fi = state[side].findIndex((f) => f.id === fractionId);
    if (fi >= 0) return { side, fractionIdx: fi };
  }
  return null;
}
