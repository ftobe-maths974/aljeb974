/**
 * atoms.ts — opérations utilitaires sur les Atoms (égalité, opposition, signe).
 * Pures, sans état.
 */

import type { Atom } from "./dsl.ts";

/** Égalité structurelle de deux atomes (kind, valeur, signe). */
export function atomsEqual(a: Atom, b: Atom): boolean {
  if (a.kind !== b.kind) return false;
  if (a.sign !== b.sign) return false;
  if (a.kind === "symbol" && b.kind === "symbol") return a.letter === b.letter;
  if (a.kind === "literal" && b.kind === "literal") return a.value === b.value;
  return true; // unknown ou hole : kind+sign suffit
}

/** Deux atomes sont opposés ssi même base mais signe inversé (ex: `t` et `-t`). */
export function atomsOpposite(a: Atom, b: Atom): boolean {
  if (a.kind !== b.kind) return false;
  if (a.sign === b.sign) return false;
  if (a.kind === "symbol" && b.kind === "symbol") return a.letter === b.letter;
  if (a.kind === "literal" && b.kind === "literal") return a.value === b.value;
  return true; // unknown ou hole : opposés ssi signes différents
}

/** Retourne l'opposé d'un atome (immutable). */
export function flipSign(a: Atom): Atom {
  return { ...a, sign: (a.sign === 1 ? -1 : 1) as 1 | -1 };
}

/** True ssi atome littéral. */
export function isLiteral(a: Atom): a is Extract<Atom, { kind: "literal" }> {
  return a.kind === "literal";
}

/** True ssi atome représente la valeur 0 (un littéral à value 0, ignore signe). */
export function isZero(a: Atom): boolean {
  return a.kind === "literal" && a.value === 0;
}

/**
 * True ssi atome représente la valeur 1 (littéral à |value|=1).
 * Note : -1 est considéré comme "neutre multiplicatif négatif", on le distingue
 * via le signe au cas par cas dans les opérations.
 */
export function isOne(a: Atom): boolean {
  return a.kind === "literal" && a.value === 1;
}

/**
 * Valeur signée d'un littéral. Lève si l'atome n'est pas littéral.
 * Utile pour les opérations arithmétiques (multPower, addPower).
 */
export function literalValue(a: Atom): number {
  if (a.kind !== "literal") throw new Error(`literalValue sur non-littéral: ${a.kind}`);
  return a.sign * a.value;
}

/** Crée un atome littéral à partir d'un entier signé. */
export function fromLiteral(n: number): Atom {
  return n >= 0
    ? { kind: "literal", sign: 1, value: n }
    : { kind: "literal", sign: -1, value: -n };
}
