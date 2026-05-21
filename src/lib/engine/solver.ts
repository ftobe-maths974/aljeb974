/**
 * solver.ts — état de victoire et notation 3 étoiles.
 *
 * Cf. legacy/js/application.coffee:664-753 (checkSuccess + count_beurk).
 */

import { atomsOpposite, isLiteral } from "./atoms.ts";
import type { FractionInstance, GameState } from "./state.ts";

/**
 * Le niveau est résolu lorsqu'il existe **exactement une** occurrence de `x`
 * dans tout l'état (lhs ∪ rhs), et que cette occurrence est :
 *   - dans une fraction réduite à un atome unique,
 *   - sans dénominateur,
 *   - **seule fraction de son côté**.
 *
 * L'autre côté contient alors la valeur calculée de `x`.
 */
export function isSolved(state: GameState): boolean {
  let xCount = 0;
  let xSide: "lhs" | "rhs" | null = null;
  let xFracOK = false;

  const scan = (fractions: FractionInstance[], side: "lhs" | "rhs") => {
    for (const f of fractions) {
      for (const c of f.numerator) {
        if (c.atom.kind === "unknown") {
          xCount += 1;
          xSide = side;
          xFracOK =
            f.numerator.length === 1 &&
            !f.denominator &&
            fractions.length === 1 &&
            c.atom.sign === 1; // x positif, pas -x
        }
      }
      for (const c of f.denominator ?? []) {
        if (c.atom.kind === "unknown") xCount += 1;
      }
    }
  };

  scan(state.lhs, "lhs");
  scan(state.rhs, "rhs");

  return xCount === 1 && xSide !== null && xFracOK;
}

/**
 * Compte les « beurks » : pénalités de propreté dans la solution finale.
 * Plus c'est bas, mieux c'est ; 0 = solution propre.
 *
 * Pénalités (équivalent legacy count_beurk):
 *  - un `1` non solitaire au numérateur (multiplication par 1 inutile, hors `-1`)
 *  - un `1` quelconque au dénominateur (division par 1)
 *  - un `0` quelque part
 *  - une paire opposée non simplifiée au même membre
 *  - une paire numérateur/dénominateur identique non simplifiée
 *
 * Pour rester pur (sans accès aux flags `chapter` etc.), on applique TOUTES
 * les règles ; l'appelant peut moduler s'il le souhaite.
 */
export function countBeurks(state: GameState): number {
  let beurks = 0;
  const sides: FractionInstance[][] = [state.lhs, state.rhs];

  for (const side of sides) {
    // (a) `1` non solitaire en numérateur, `1` en dénominateur, `0` n'importe où
    for (const f of side) {
      for (let i = 0; i < f.numerator.length; i++) {
        const a = f.numerator[i]!.atom;
        if (isLiteral(a) && a.value === 1 && a.sign === 1 && f.numerator.length > 1) beurks++;
        if (isLiteral(a) && a.value === 0) beurks++;
      }
      for (const c of f.denominator ?? []) {
        if (isLiteral(c.atom) && c.atom.value === 1) beurks++;
        if (isLiteral(c.atom) && c.atom.value === 0) beurks++;
      }

      // (b) atomes opposés au sein d'un même num/dén (ex: `t.-t/x`)
      const checkPairs = (list: { atom: import("./dsl.ts").Atom }[]) => {
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            if (atomsOpposite(list[i]!.atom, list[j]!.atom)) beurks++;
          }
        }
      };
      checkPairs(f.numerator);
      if (f.denominator) checkPairs(f.denominator);

      // (c) atome identique au numérateur et dénominateur
      if (f.denominator) {
        for (const n of f.numerator) {
          for (const d of f.denominator) {
            if (n.atom.kind === d.atom.kind && n.atom.sign === d.atom.sign) {
              if (n.atom.kind === "symbol" && d.atom.kind === "symbol" && n.atom.letter === d.atom.letter) beurks++;
              if (n.atom.kind === "literal" && d.atom.kind === "literal" && n.atom.value === d.atom.value) beurks++;
              if (n.atom.kind === "unknown" || n.atom.kind === "hole") beurks++;
            }
          }
        }
      }
    }

    // (d) paires de fractions opposées simples au même membre (`t` et `-t` non annulés)
    for (let i = 0; i < side.length; i++) {
      const fi = side[i]!;
      if (fi.numerator.length !== 1 || fi.denominator) continue;
      for (let j = i + 1; j < side.length; j++) {
        const fj = side[j]!;
        if (fj.numerator.length !== 1 || fj.denominator) continue;
        if (atomsOpposite(fi.numerator[0]!.atom, fj.numerator[0]!.atom)) beurks++;
      }
    }
  }

  return beurks;
}

/**
 * Étoiles obtenues : on part de 3 et on retire 1 par pénalité indépendante.
 *  - 1 étoile perdue si la solution n'est pas « propre » (countBeurks > 0,
 *    typiquement quand un plateau n'est pas complètement simplifié).
 *  - 1 étoile perdue si l'élève a dépassé la cible de coups.
 * Minimum 1 étoile si résolu (ne descend jamais à 0 quand isSolved).
 */
export function stars(state: GameState): 0 | 1 | 2 | 3 {
  if (!isSolved(state)) return 0;
  let s = 3;
  if (countBeurks(state) > 0) s -= 1;
  if (state.shots > state.shotsTarget) s -= 1;
  return Math.max(1, s) as 1 | 2 | 3;
}
