import { describe, expect, it } from "vitest";
import {
  cancelOpposites,
  canCancelOpposites,
  canDeleteOne,
  canDeleteZero,
  deleteOne,
  deleteZero,
  dropFromPioche,
  moveAcross,
  reverseInPioche,
} from "../operations.ts";
import { initialState } from "../state.ts";
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

describe("deleteZero", () => {
  it("supprime un zéro solitaire d'un membre à plusieurs fractions", () => {
    // Niveau 1-1 : x + 0 + 0
    const s = initialState(lvl({ lhs: ["x", "0", "0"], shots: 2 }), "1-1");
    const zeroId = s.lhs[1]!.numerator[0]!.id;
    expect(canDeleteZero(s, zeroId)).toBe(true);
    const s2 = deleteZero(s, zeroId);
    expect(s2.lhs.length).toBe(2);
    // shots inchangés (deleteZero n'incrémente pas)
    expect(s2.shots).toBe(0);
    // état initial inchangé
    expect(s.lhs.length).toBe(3);
  });

  it("refuse de supprimer le dernier zéro d'un membre", () => {
    const s = initialState(lvl({ lhs: ["0"], shots: 1 }), "test");
    const zeroId = s.lhs[0]!.numerator[0]!.id;
    expect(canDeleteZero(s, zeroId)).toBe(false);
  });
});

describe("deleteOne", () => {
  it("supprime un 1 dans un produit (x.1)", () => {
    // niveau 2-5 : lhs=["x.1"]
    const s = initialState(lvl({ lhs: ["x.1"], rhs: ["m"], shots: 1 }), "2-5");
    const oneId = s.lhs[0]!.numerator[1]!.id;
    expect(canDeleteOne(s, oneId)).toBe(true);
    const s2 = deleteOne(s, oneId);
    expect(s2.lhs[0]!.numerator.length).toBe(1);
    expect(s2.lhs[0]!.numerator[0]!.atom.kind).toBe("unknown");
  });

  it("refuse de supprimer un 1 solitaire", () => {
    const s = initialState(lvl({ lhs: ["x"], rhs: ["1"], shots: 1 }), "test");
    const oneId = s.rhs[0]!.numerator[0]!.id;
    expect(canDeleteOne(s, oneId)).toBe(false);
  });
});

describe("cancelOpposites", () => {
  it("annule t et -t au même membre", () => {
    // niveau 1-3 : x + 2 + (-2) + t + (-t)
    const s = initialState(lvl({ lhs: ["x", "2", "-2", "t", "-t"], shots: 4 }), "1-3");
    const tFrac = s.lhs[3]!.id;
    const minusTFrac = s.lhs[4]!.id;
    expect(canCancelOpposites(s, tFrac, minusTFrac)).toBe(true);
    const s2 = cancelOpposites(s, tFrac, minusTFrac);
    expect(s2.lhs.length).toBe(3); // x, 2, -2 restent
    expect(s2.shots).toBe(1);
  });

  it("refuse si les fractions sont sur des côtés différents", () => {
    const s = initialState(lvl({ lhs: ["t"], rhs: ["-t"], shots: 1 }), "test");
    expect(canCancelOpposites(s, s.lhs[0]!.id, s.rhs[0]!.id)).toBe(false);
  });

  it("refuse si même fraction", () => {
    const s = initialState(lvl({ lhs: ["t", "-t"], shots: 1 }), "test");
    const t = s.lhs[0]!.id;
    expect(canCancelOpposites(s, t, t)).toBe(false);
  });
});

describe("reverseInPioche", () => {
  it("inverse le signe d'une carte de pioche", () => {
    const s = initialState(lvl({ lhs: ["x"], pioche: ["g"], shots: 1 }), "test");
    const gId = s.pioche[0]!.numerator[0]!.id;
    const s2 = reverseInPioche(s, gId);
    expect(s2.pioche[0]!.numerator[0]!.atom.sign).toBe(-1);
    expect(s.pioche[0]!.numerator[0]!.atom.sign).toBe(1); // état initial inchangé
  });
});

describe("dropFromPioche", () => {
  it("pose la carte des deux côtés, retire de la pioche si dropOnce", () => {
    // niveau 1-9 : lhs=[x,g], rhs=[s], pioche=[-g] — dropOnce vrai en chapitre 1
    const s = initialState(
      lvl({ lhs: ["x", "g"], rhs: ["s"], pioche: ["-g"], shots: 3 }),
      "1-9",
    );
    const negG = s.pioche[0]!.id;
    const s2 = dropFromPioche(s, negG, "lhs", { dropOnce: true });
    expect(s2.lhs.length).toBe(3); // x, g, -g
    expect(s2.rhs.length).toBe(2); // s, -g
    expect(s2.pioche.length).toBe(0); // consommée
    expect(s2.shots).toBe(1);
  });

  it("garde la carte en pioche si dropOnce=false (chap. 2+)", () => {
    const s = initialState(
      lvl({ lhs: ["x"], rhs: ["s"], pioche: ["g"], shots: 1 }),
      "test",
    );
    const g = s.pioche[0]!.id;
    const s2 = dropFromPioche(s, g, "lhs", { dropOnce: false });
    expect(s2.pioche.length).toBe(1);
  });
});

describe("moveAcross", () => {
  it("déplace un terme avec inversion de signe", () => {
    // x + g = s → x = s - g (en glissant g vers la droite)
    const s = initialState(lvl({ lhs: ["x", "g"], rhs: ["s"], shots: 1 }), "test");
    const gId = s.lhs[1]!.id;
    const s2 = moveAcross(s, gId);
    expect(s2.lhs.length).toBe(1);
    expect(s2.rhs.length).toBe(2);
    // Le g déplacé doit être devenu -g
    const movedAtom = s2.rhs[1]!.numerator[0]!.atom;
    expect(movedAtom.kind).toBe("symbol");
    expect(movedAtom.sign).toBe(-1);
  });

  it("ajoute un 0 si le membre source devient vide", () => {
    const s = initialState(lvl({ lhs: ["x"], rhs: ["t"], shots: 1 }), "test");
    const t = s.rhs[0]!.id;
    const s2 = moveAcross(s, t);
    expect(s2.rhs.length).toBe(1);
    expect(s2.rhs[0]!.numerator[0]!.atom.kind).toBe("literal");
    expect((s2.rhs[0]!.numerator[0]!.atom as { value: number }).value).toBe(0);
  });
});
