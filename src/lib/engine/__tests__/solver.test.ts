import { describe, expect, it } from "vitest";
import { countBeurks, isSolved, stars } from "../solver.ts";
import { initialState } from "../state.ts";
import {
  cancelOpposites,
  completePiocheDrop,
  deleteZero,
  startPiocheDrop,
} from "../operations.ts";
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

describe("scenario : niveau 1-3 résolu (avec étape 0 intermédiaire)", () => {
  it("3 étoiles : 2 cancelOpposites + 2 deleteZero (cible = 4)", () => {
    // lhs = [x, 2, -2, t, -t], shots cible = 4
    // séquence pédagogique :
    //   1. drag 2 sur -2 → x, 0, t, -t           (shots=1)
    //   2. clic sur le 0 → x, t, -t              (shots inchangé)
    //   3. drag t sur -t → x, 0                  (shots=2)
    //   4. clic sur le 0 → x                     (shots inchangé)
    let s = initialState(
      lvl({ lhs: ["x", "2", "-2", "t", "-t"], shots: 4 }),
      "1-3",
    );
    s = cancelOpposites(s, s.lhs[1]!.id, s.lhs[2]!.id);
    expect(s.lhs.length).toBe(4);
    s = deleteZero(s, s.lhs[1]!.numerator[0]!.id);
    expect(s.lhs.length).toBe(3); // x, t, -t
    s = cancelOpposites(s, s.lhs[1]!.id, s.lhs[2]!.id);
    expect(s.lhs.length).toBe(2); // x, 0
    s = deleteZero(s, s.lhs[1]!.numerator[0]!.id);
    expect(s.lhs.length).toBe(1); // x seul
    expect(isSolved(s)).toBe(true);
    expect(s.shots).toBe(2);
    expect(stars(s)).toBe(3);
  });
});

describe("scenario : niveau 1-5 résolu (avec rhs)", () => {
  it("isolation de x à droite (via 2 cancel + 2 deleteZero)", () => {
    // niveau 1-5 : lhs=[p], rhs=[x, g, -g, t, -t]
    let s = initialState(
      lvl({ lhs: ["p"], rhs: ["x", "g", "-g", "t", "-t"], shots: 4 }),
      "1-5",
    );
    s = cancelOpposites(s, s.rhs[1]!.id, s.rhs[2]!.id); // g sur -g → x, 0, t, -t
    s = deleteZero(s, s.rhs[1]!.numerator[0]!.id);       // → x, t, -t
    s = cancelOpposites(s, s.rhs[1]!.id, s.rhs[2]!.id); // t sur -t → x, 0
    s = deleteZero(s, s.rhs[1]!.numerator[0]!.id);       // → x
    expect(s.rhs.length).toBe(1);
    expect(isSolved(s)).toBe(true);
    expect(s.shots).toBe(2);
    expect(stars(s)).toBe(3); // 2 ≤ 4
  });
});

describe("scenario : niveau 1-9 (drop depuis pioche en 2 étapes)", () => {
  it("résolution complète", () => {
    // niveau 1-9 : lhs=[x, g], rhs=[s], pioche=[-g]
    let s = initialState(
      lvl({ lhs: ["x", "g"], rhs: ["s"], pioche: ["-g"], shots: 3 }),
      "1-9",
    );
    s = startPiocheDrop(s, s.pioche[0]!.id, "lhs");
    expect(s.pending).not.toBeNull();
    s = completePiocheDrop(s, "rhs", { dropOnce: true });
    expect(s.lhs.length).toBe(3); // x, g, -g
    expect(s.rhs.length).toBe(2); // s, -g
    expect(s.pioche.length).toBe(0);
    expect(s.pending).toBeNull();
    // annuler g et -g du lhs → lhs = [x, 0], puis supprimer le 0 → [x]
    s = cancelOpposites(s, s.lhs[1]!.id, s.lhs[2]!.id);
    expect(s.lhs.length).toBe(2);
    s = deleteZero(s, s.lhs[1]!.numerator[0]!.id);
    expect(s.lhs.length).toBe(1);
    expect(isSolved(s)).toBe(true);
  });
});
