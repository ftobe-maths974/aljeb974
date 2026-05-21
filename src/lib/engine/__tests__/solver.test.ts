import { describe, expect, it } from "vitest";
import { countBeurks, isSolved, stars } from "../solver.ts";
import { initialState } from "../state.ts";
import { cancelOpposites, deleteZero, dropFromPioche } from "../operations.ts";
import { parseTerm } from "../dsl.ts";
import type { Level, RevealItem } from "../dsl.ts";

interface LevelInput {
  lhs: string[];
  rhs?: string[];
  pioche?: string[];
  reveal?: RevealItem[];
  shots: number;
}

const lvl = (data: LevelInput): Level => ({
  lhs: data.lhs.map(parseTerm),
  rhs: data.rhs?.map(parseTerm),
  pioche: data.pioche?.map(parseTerm),
  reveal: data.reveal,
  shots: data.shots,
});

describe("isSolved", () => {
  it("retourne false sur l'état initial du niveau 1-1", () => {
    const s = initialState(lvl({ lhs: ["x", "0", "0"], shots: 2 }), "1-1");
    expect(isSolved(s)).toBe(false);
  });

  it("retourne true après avoir retiré les deux zéros (niveau 1-1)", () => {
    let s = initialState(lvl({ lhs: ["x", "0", "0"], shots: 2 }), "1-1");
    s = deleteZero(s, s.lhs[1]!.numerator[0]!.id);
    s = deleteZero(s, s.lhs[1]!.numerator[0]!.id); // après le premier delete, le 2e zéro est à l'index 1
    // ce niveau n'a pas de rhs : isSolved demande x seul de son côté
    expect(isSolved(s)).toBe(true);
  });

  it("rejette x avec d'autres termes à côté", () => {
    const s = initialState(lvl({ lhs: ["x", "t"], rhs: ["s"], shots: 1 }), "test");
    expect(isSolved(s)).toBe(false);
  });

  it("rejette -x seul (signe doit être positif)", () => {
    const s = initialState(lvl({ lhs: ["-x"], rhs: ["t"], shots: 1 }), "test");
    expect(isSolved(s)).toBe(false);
  });
});

describe("countBeurks", () => {
  it("zéro beurk sur une solution propre", () => {
    const s = initialState(lvl({ lhs: ["x"], rhs: ["t"], shots: 1 }), "test");
    expect(countBeurks(s)).toBe(0);
  });

  it("pénalité pour une paire opposée non simplifiée", () => {
    const s = initialState(lvl({ lhs: ["x"], rhs: ["t", "-t", "s"], shots: 1 }), "test");
    expect(countBeurks(s)).toBe(1);
  });

  it("pénalité pour un 0 restant", () => {
    const s = initialState(lvl({ lhs: ["x"], rhs: ["t", "0"], shots: 1 }), "test");
    expect(countBeurks(s)).toBe(1);
  });

  it("pénalité pour un 1 inutile dans un produit", () => {
    const s = initialState(lvl({ lhs: ["x"], rhs: ["t.1"], shots: 1 }), "test");
    expect(countBeurks(s)).toBe(1);
  });
});

describe("stars", () => {
  it("3 étoiles si propre et dans la cible", () => {
    let s = initialState(lvl({ lhs: ["x", "0", "0"], shots: 2 }), "1-1");
    s = deleteZero(s, s.lhs[1]!.numerator[0]!.id);
    s = deleteZero(s, s.lhs[1]!.numerator[0]!.id);
    expect(stars(s)).toBe(3);
  });

  it("0 étoiles si non résolu", () => {
    const s = initialState(lvl({ lhs: ["x", "0"], shots: 1 }), "test");
    expect(stars(s)).toBe(0);
  });
});

describe("scenario : niveau 1-3 résolu en 4 coups (cible)", () => {
  it("3 étoiles attendues", () => {
    // niveau 1-3 : lhs = [x, 2, -2, t, -t], shots cible = 4
    // solution attendue : annuler (2,-2), annuler (t,-t) — déjà 2 coups
    // mais ces deux annulations ne consomment que 2 shots, pas 4. La cible est large.
    let s = initialState(
      lvl({ lhs: ["x", "2", "-2", "t", "-t"], shots: 4 }),
      "1-3",
    );
    // 1. annuler 2, -2
    s = cancelOpposites(s, s.lhs[1]!.id, s.lhs[2]!.id);
    expect(s.lhs.length).toBe(3); // x, t, -t
    // 2. annuler t, -t (positions 1, 2 maintenant)
    s = cancelOpposites(s, s.lhs[1]!.id, s.lhs[2]!.id);
    expect(s.lhs.length).toBe(1); // x seul
    // Même sans rhs, le niveau est résolu : x est isolé sur son côté.
    // C'est le comportement du legacy pour les premiers niveaux du chapitre 1.
    expect(isSolved(s)).toBe(true);
    expect(s.shots).toBe(2); // sous la cible de 4 → 3 étoiles
    expect(stars(s)).toBe(3);
  });
});

describe("scenario : niveau 1-5 résolu (avec rhs)", () => {
  it("isolation de x à droite", () => {
    // niveau 1-5 : lhs=[p], rhs=[x, g, -g, t, -t]
    let s = initialState(
      lvl({ lhs: ["p"], rhs: ["x", "g", "-g", "t", "-t"], shots: 4 }),
      "1-5",
    );
    // annuler g, -g
    s = cancelOpposites(s, s.rhs[1]!.id, s.rhs[2]!.id);
    expect(s.rhs.length).toBe(3); // x, t, -t
    // annuler t, -t (indices 1, 2)
    s = cancelOpposites(s, s.rhs[1]!.id, s.rhs[2]!.id);
    expect(s.rhs.length).toBe(1); // x seul
    expect(isSolved(s)).toBe(true);
    expect(s.shots).toBe(2);
    expect(stars(s)).toBe(3); // 2 ≤ 4
  });
});

describe("scenario : niveau 1-9 (drop depuis pioche)", () => {
  it("résolution complète", () => {
    // niveau 1-9 : lhs=[x, g], rhs=[s], pioche=[-g]
    // solution : drop -g sur lhs → lhs=[x, g, -g], rhs=[s, -g]
    //           puis annuler g, -g sur lhs → lhs=[x], rhs=[s, -g]
    let s = initialState(
      lvl({ lhs: ["x", "g"], rhs: ["s"], pioche: ["-g"], shots: 3 }),
      "1-9",
    );
    s = dropFromPioche(s, s.pioche[0]!.id, "lhs", { dropOnce: true });
    expect(s.lhs.length).toBe(3); // x, g, -g
    expect(s.rhs.length).toBe(2); // s, -g
    expect(s.pioche.length).toBe(0);
    s = cancelOpposites(s, s.lhs[1]!.id, s.lhs[2]!.id);
    expect(s.lhs.length).toBe(1);
    expect(isSolved(s)).toBe(true);
  });
});
