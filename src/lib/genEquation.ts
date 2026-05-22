/**
 * genEquation.ts — générateurs d'équations linéaires pour le bac à sable.
 *
 * Construit directement les termes du modèle (pas via le parseur texte), ce qui
 * permet les coefficients fractionnaires (a/b)x = numérateur [a, x] / dén [b].
 * Renvoie aussi une chaîne d'affichage pour le prompt.
 *
 * Coefficients dans [-6, 6] (zéro compris pour les numérateurs ; dénominateurs
 * non nuls). On garantit au moins un terme en x dans l'équation.
 */

import type { Atom, Term } from "./engine/index.ts";

export interface GeneratedEquation {
  lhs: Term[];
  rhs: Term[];
  display: string;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randNonZero(min: number, max: number): number {
  let n = 0;
  while (n === 0) n = randInt(min, max);
  return n;
}

function lit(n: number): Atom {
  return { kind: "literal", sign: n < 0 ? -1 : 1, value: Math.abs(n) };
}
function signed<T extends Atom>(a: T, sign: 1 | -1): T {
  return { ...a, sign: (a.sign * sign) as 1 | -1 };
}

/* ── ax + b = cx + d ────────────────────────────────────────────────────────── */

function intXTerm(coef: number): Term | null {
  if (coef === 0) return null;
  if (Math.abs(coef) === 1) {
    return { numerator: [{ kind: "unknown", sign: coef < 0 ? -1 : 1 }] };
  }
  return { numerator: [lit(coef), { kind: "unknown", sign: 1 }] };
}
function intConstTerm(k: number, hasX: boolean): Term | null {
  if (k === 0 && hasX) return null; // pas de « 0 » parasite à côté d'un terme en x
  return { numerator: [lit(k)] };
}
function intSideStr(coef: number, k: number): string {
  const parts: string[] = [];
  if (coef !== 0) parts.push(coef === 1 ? "x" : coef === -1 ? "-x" : `${coef}x`);
  if (k !== 0 || parts.length === 0) parts.push(`${k}`);
  return joinSigned(parts);
}

export function genLinearInt(): GeneratedEquation {
  let a = 0, c = 0;
  let b = 0, d = 0;
  // au moins un terme en x dans l'équation
  do {
    a = randInt(-6, 6);
    c = randInt(-6, 6);
    b = randInt(-6, 6);
    d = randInt(-6, 6);
  } while (a === 0 && c === 0);
  const lhs = [intXTerm(a), intConstTerm(b, a !== 0)].filter((t): t is Term => !!t);
  const rhs = [intXTerm(c), intConstTerm(d, c !== 0)].filter((t): t is Term => !!t);
  return { lhs, rhs, display: `${intSideStr(a, b)} = ${intSideStr(c, d)}` };
}

/* ── (a/b)x + c/d = (e/f)x + g/h ─────────────────────────────────────────────── */

function fracXTerm(num: number, den: number): Term | null {
  if (num === 0) return null;
  const s: 1 | -1 = num * den < 0 ? -1 : 1;
  return {
    numerator: [signed(lit(Math.abs(num)), s), { kind: "unknown", sign: 1 }],
    denominator: [lit(Math.abs(den))],
  };
}
function fracConstTerm(num: number, den: number, hasX: boolean): Term | null {
  if (num === 0) return hasX ? null : { numerator: [lit(0)] };
  const s: 1 | -1 = num * den < 0 ? -1 : 1;
  return {
    numerator: [signed(lit(Math.abs(num)), s)],
    denominator: [lit(Math.abs(den))],
  };
}
function fracSideStr(aNum: number, aDen: number, cNum: number, cDen: number): string {
  const parts: string[] = [];
  if (aNum !== 0) {
    const sign = aNum * aDen < 0 ? "-" : "";
    parts.push(`${sign}(${Math.abs(aNum)}/${Math.abs(aDen)})x`);
  }
  if (cNum !== 0) {
    const sign = cNum * cDen < 0 ? "-" : "";
    parts.push(`${sign}${Math.abs(cNum)}/${Math.abs(cDen)}`);
  } else if (parts.length === 0) {
    parts.push("0");
  }
  return joinSigned(parts);
}

export function genLinearFrac(): GeneratedEquation {
  let aN = 0, eN = 0;
  let aD = 1, cN = 0, cD = 1, eD = 1, gN = 0, gD = 1;
  do {
    aN = randInt(-6, 6); aD = randNonZero(-6, 6);
    cN = randInt(-6, 6); cD = randNonZero(-6, 6);
    eN = randInt(-6, 6); eD = randNonZero(-6, 6);
    gN = randInt(-6, 6); gD = randNonZero(-6, 6);
  } while (aN === 0 && eN === 0);
  const lhs = [fracXTerm(aN, aD), fracConstTerm(cN, cD, aN !== 0)].filter((t): t is Term => !!t);
  const rhs = [fracXTerm(eN, eD), fracConstTerm(gN, gD, eN !== 0)].filter((t): t is Term => !!t);
  return {
    lhs,
    rhs,
    display: `${fracSideStr(aN, aD, cN, cD)} = ${fracSideStr(eN, eD, gN, gD)}`,
  };
}

/* ── util ───────────────────────────────────────────────────────────────────── */

function joinSigned(parts: string[]): string {
  return parts
    .map((p, i) => {
      if (i === 0) return p;
      return p.startsWith("-") ? ` - ${p.slice(1)}` : ` + ${p}`;
    })
    .join("");
}
