/**
 * parseEquation.ts — parseur d'équation pour le bac à sable.
 *
 * Convertit une chaîne (ex : « a/b + 3x - (-6)*x = 5 ») vers le modèle moteur :
 * une somme de termes signés, chaque terme étant un PRODUIT d'atomes au
 * numérateur, optionnellement divisé par un PRODUIT d'atomes au dénominateur.
 *
 * Limite du modèle (produit/produit) : pas de SOMME dans une fraction
 * (« (3+x)/(d+f) » est rejeté). Les sommes entre parenthèses au niveau d'un
 * membre sont en revanche distribuées (« -(a+b) » → « -a -b »).
 *
 * Syntaxe acceptée :
 *   - termes séparés par + / -, signe de tête autorisé
 *   - multiplication implicite (3x, 2g, ab) ou explicite (*)
 *   - coefficients entiers, parenthèses de nombre signé : (-6), (-1)
 *   - inconnue x ; lettres a–m, p–w, z
 *   - fraction num/den (num et den = produits)
 */

import type { Atom, Term, SymbolLetter } from "./engine/index.ts";
import { SYMBOL_LETTERS } from "./engine/index.ts";

const LETTERS = new Set<string>(SYMBOL_LETTERS);

export class ParseError extends Error {}

export interface ParsedEquation {
  lhs: Term[];
  rhs?: Term[];
}

export function parseEquation(input: string): ParsedEquation {
  const s = input.replace(/\s+/g, "").replace(/·/g, "*").replace(/−/g, "-");
  if (!s) throw new ParseError("Équation vide.");
  const sides = splitTopLevel(s, "=");
  if (sides.length > 2) throw new ParseError("Un seul « = » autorisé.");
  const lhs = parseSum(sides[0]!);
  if (lhs.length === 0) throw new ParseError("Membre gauche vide.");
  const rhs = sides.length === 2 ? parseSum(sides[1]!) : undefined;
  if (rhs && rhs.length === 0) throw new ParseError("Membre droit vide.");
  return { lhs, rhs };
}

/* ── Helpers de découpage (en respectant la profondeur de parenthèses) ──────── */

function splitTopLevel(s: string, ch: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (depth === 0 && c === ch) {
      out.push(s.slice(start, i));
      start = i + 1;
    }
    if (depth < 0) throw new ParseError("Parenthèses non équilibrées.");
  }
  if (depth !== 0) throw new ParseError("Parenthèses non équilibrées.");
  out.push(s.slice(start));
  return out;
}

/** Index du premier `ch` à profondeur 0, ou -1. */
function topIndexOf(s: string, ch: string): number {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (depth === 0 && c === ch) return i;
  }
  return -1;
}

/** True si une somme/différence existe à profondeur 0 (hors signe de tête). */
function hasTopLevelSum(s: string): boolean {
  let depth = 0;
  for (let i = 1; i < s.length; i++) {
    const c = s[i]!;
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (depth === 0 && (c === "+" || c === "-")) return true;
  }
  return false;
}

/** True si toute la chaîne est une seule paire de parenthèses englobantes. */
function isFullyWrapped(s: string): boolean {
  if (s[0] !== "(" || s[s.length - 1] !== ")") return false;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")") {
      depth--;
      if (depth === 0) return i === s.length - 1;
    }
  }
  return false;
}

function matchParen(s: string, open: number): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new ParseError("Parenthèses non équilibrées.");
}

/* ── Parsing ────────────────────────────────────────────────────────────────── */

function parseSum(str: string): Term[] {
  const terms: Term[] = [];
  let depth = 0;
  let start = 0;
  let sign = 1;
  if (str[0] === "+" || str[0] === "-") {
    sign = str[0] === "-" ? -1 : 1;
    start = 1;
  }
  const flush = (end: number, s: number) => {
    const piece = str.slice(start, end);
    if (piece === "") return;
    for (const t of parseTerm(piece, s)) terms.push(t);
  };
  for (let i = start; i < str.length; i++) {
    const c = str[i]!;
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (depth === 0 && (c === "+" || c === "-")) {
      flush(i, sign);
      sign = c === "-" ? -1 : 1;
      start = i + 1;
    }
    if (depth < 0) throw new ParseError("Parenthèses non équilibrées.");
  }
  flush(str.length, sign);
  return terms;
}

function parseTerm(piece: string, sign: number): Term[] {
  // Groupe parenthésé complet → on distribue (et applique le signe).
  if (isFullyWrapped(piece)) {
    const inner = parseSum(piece.slice(1, -1));
    return sign === -1 ? inner.map(negateTerm) : inner;
  }
  // Fraction ?
  const slash = topIndexOf(piece, "/");
  if (slash >= 0) {
    const numStr = piece.slice(0, slash);
    const denStr = piece.slice(slash + 1);
    if (topIndexOf(denStr, "/") >= 0) {
      throw new ParseError("Une seule barre de fraction par terme.");
    }
    const numerator = parseProduct(numStr);
    const denominator = parseProduct(denStr);
    applySignToFirst(numerator, sign);
    return [{ numerator, denominator }];
  }
  const numerator = parseProduct(piece);
  applySignToFirst(numerator, sign);
  return [{ numerator }];
}

/** Parse un PRODUIT d'atomes (pas de somme). */
function parseProduct(str: string): Atom[] {
  if (str === "") throw new ParseError("Facteur manquant.");
  const atoms: Atom[] = [];
  let pendingSign = 1;
  let i = 0;
  const push = (a: Atom) => {
    if (pendingSign === -1) {
      a.sign = (a.sign * -1) as 1 | -1;
      pendingSign = 1;
    }
    atoms.push(a);
  };
  while (i < str.length) {
    const c = str[i]!;
    if (c === "*") { i++; continue; }
    if (c === "-") { pendingSign *= -1; i++; continue; }
    if (c === "+") { i++; continue; }
    if (c === "(") {
      const end = matchParen(str, i);
      const inner = str.slice(i + 1, end);
      if (hasTopLevelSum(inner)) {
        throw new ParseError(
          `Somme interdite dans une fraction/produit : « (${inner}) ». Le modèle ne gère que des produits.`,
        );
      }
      const sub = parseProduct(inner);
      // le signe en attente s'applique au 1ᵉʳ atome du sous-produit
      applySignToFirst(sub, pendingSign);
      pendingSign = 1;
      for (const a of sub) atoms.push(a);
      i = end + 1;
      continue;
    }
    if (c >= "0" && c <= "9") {
      let j = i;
      while (j < str.length && str[j]! >= "0" && str[j]! <= "9") j++;
      push({ kind: "literal", sign: 1, value: parseInt(str.slice(i, j), 10) });
      i = j;
      continue;
    }
    const lower = c.toLowerCase();
    if (lower >= "a" && lower <= "z") {
      if (lower === "x") push({ kind: "unknown", sign: 1 });
      else if (LETTERS.has(lower))
        push({ kind: "symbol", sign: 1, letter: lower as SymbolLetter });
      else
        throw new ParseError(
          `Lettre « ${lower} » non autorisée (utilise a–m, p–w, z, ou x).`,
        );
      i++;
      continue;
    }
    throw new ParseError(`Caractère inattendu : « ${c} ».`);
  }
  if (atoms.length === 0) throw new ParseError("Produit vide.");
  return atoms;
}

/* ── Signe ──────────────────────────────────────────────────────────────────── */

function applySignToFirst(atoms: Atom[], sign: number): void {
  if (sign === -1 && atoms.length > 0) {
    atoms[0]!.sign = (atoms[0]!.sign * -1) as 1 | -1;
  }
}

function negateTerm(t: Term): Term {
  const numerator = t.numerator.map((a, idx) =>
    idx === 0 ? ({ ...a, sign: (a.sign * -1) as 1 | -1 } as Atom) : a,
  );
  return { ...t, numerator };
}
