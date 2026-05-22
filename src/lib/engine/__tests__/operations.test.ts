import { describe, expect, it } from "vitest";
import {
  addFractions,
  addTerms,
  canAddFractions,
  canAddTerms,
  canClearOneDenominator,
  canClearZeroDenominator,
  canReduceNumeratorSum,
  clearOneDenominator,
  clearZeroDenominator,
  reduceNumeratorSum,
  cancelOpposites,
  cancelPending,
  canCancelOpposites,
  canDeleteOne,
  canDeleteZero,
  completePiocheDrop,
  deleteOne,
  deleteZero,
  moveAcross,
  reverseInPioche,
  startPiocheDrop,
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
  it("produit un 0 intermédiaire + retire la fraction draguée", () => {
    // niveau 1-3 : x + 2 + (-2) + t + (-t)
    const s = initialState(lvl({ lhs: ["x", "2", "-2", "t", "-t"], shots: 4 }), "1-3");
    const tFrac = s.lhs[3]!.id;       // dragué
    const minusTFrac = s.lhs[4]!.id;  // cible
    expect(canCancelOpposites(s, tFrac, minusTFrac)).toBe(true);
    const s2 = cancelOpposites(s, tFrac, minusTFrac);
    // 4 fractions restent : x, 2, -2, 0 (le -t est devenu 0, le t est consommé)
    expect(s2.lhs.length).toBe(4);
    const zeroAtom = s2.lhs[3]!.numerator[0]!.atom;
    expect(zeroAtom.kind).toBe("literal");
    expect((zeroAtom as { value: number }).value).toBe(0);
    // Le compteur de coups est désormais géré par la couche UI, pas le moteur.
    expect(s2.shots).toBe(0);
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

describe("startPiocheDrop + completePiocheDrop (block mode)", () => {
  it("le drop se fait en 2 étapes : pose d'abord lhs, puis pending exige rhs", () => {
    // niveau 1-9 : lhs=[x,g], rhs=[s], pioche=[-g] — dropOnce vrai en chapitre 1
    const s = initialState(
      lvl({ lhs: ["x", "g"], rhs: ["s"], pioche: ["-g"], shots: 3 }),
      "1-9",
    );
    const negG = s.pioche[0]!.id;
    const s2 = startPiocheDrop(s, negG, "lhs");
    expect(s2.lhs.length).toBe(3); // x, g, -g posé immédiatement
    expect(s2.rhs.length).toBe(1); // pas encore (rhs en attente)
    expect(s2.pioche.length).toBe(1); // toujours là tant que pending
    expect(s2.shots).toBe(0); // shots géré par l'UI désormais
    expect(s2.pending).not.toBeNull();
    expect(s2.pending!.remainingTargets).toEqual(["rhs"]);

    // 2ᵉ étape : finir sur rhs
    const s3 = completePiocheDrop(s2, "rhs", { dropOnce: true });
    expect(s3.lhs.length).toBe(3);
    expect(s3.rhs.length).toBe(2); // s, -g
    expect(s3.pioche.length).toBe(0); // consommée
    expect(s3.shots).toBe(0); // shots géré par l'UI désormais
    expect(s3.pending).toBeNull();
  });

  it("garde la carte en pioche si dropOnce=false (chap. 2+)", () => {
    const s = initialState(
      lvl({ lhs: ["x"], rhs: ["s"], pioche: ["g"], shots: 1 }),
      "test",
    );
    const g = s.pioche[0]!.id;
    const s2 = startPiocheDrop(s, g, "lhs");
    const s3 = completePiocheDrop(s2, "rhs", { dropOnce: false });
    expect(s3.pioche.length).toBe(1);
    expect(s3.pending).toBeNull();
  });

  it("refuse les autres opérations tant que pending", () => {
    const s = initialState(lvl({ lhs: ["x"], rhs: ["s"], pioche: ["g"], shots: 1 }), "t");
    const s2 = startPiocheDrop(s, s.pioche[0]!.id, "lhs");
    // tentative de moveAcross alors qu'on est en pending → refusée
    expect(() => moveAcross(s2, s2.rhs[0]!.id)).toThrow(/drop en cours/);
    // tentative de deleteOne sur une carte → refusée
    expect(() => deleteOne(s2, s2.lhs[0]!.numerator[0]!.id)).toThrow(/drop en cours/);
  });

  it("cancelPending défait la pose partielle", () => {
    const s = initialState(lvl({ lhs: ["x"], rhs: ["s"], pioche: ["g"], shots: 1 }), "t");
    const s2 = startPiocheDrop(s, s.pioche[0]!.id, "lhs");
    expect(s2.lhs.length).toBe(2);
    const s3 = cancelPending(s2);
    expect(s3.lhs.length).toBe(1);
    expect(s3.pending).toBeNull();
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

describe("addFractions", () => {
  it("fusionne en somme NON calculée (3/p + 2/p → (3+2)/p)", () => {
    const s = initialState(lvl({ lhs: ["3/p", "2/p", "x"], shots: 9 }), "test");
    const dragged = s.lhs[0]!.id;
    const target = s.lhs[1]!.id;
    expect(canAddFractions(s, dragged, target)).toBe(true);
    const s2 = addFractions(s, dragged, target);
    expect(s2.lhs.length).toBe(2); // une fraction de moins
    const sum = s2.lhs[0]!;
    expect(sum.numeratorIsSum).toBe(true);
    expect(sum.numerator).toHaveLength(2); // 3 et 2 concaténés, non calculés
    expect((sum.numerator[0]!.atom as { value: number }).value).toBe(3);
    expect((sum.numerator[1]!.atom as { value: number }).value).toBe(2);
    expect(sum.denominator?.[0]!.atom.kind).toBe("symbol");

    // Réduction au clic : (3+2)/p → 5/p
    const reduceId = sum.numerator[0]!.id;
    expect(canReduceNumeratorSum(s2, reduceId)).toBe(true);
    const s3 = reduceNumeratorSum(s2, reduceId);
    const red = s3.lhs[0]!;
    expect(red.numeratorIsSum).toBeFalsy();
    expect(red.numerator).toHaveLength(1);
    expect((red.numerator[0]!.atom as { value: number }).value).toBe(5);
    expect(red.denominator?.[0]!.atom.kind).toBe("symbol");
  });

  it("refuse si les dénominateurs diffèrent", () => {
    const s = initialState(lvl({ lhs: ["3/p", "2/q"], shots: 9 }), "test");
    expect(canAddFractions(s, s.lhs[0]!.id, s.lhs[1]!.id)).toBe(false);
  });
});

describe("addTerms", () => {
  it("regroupe des termes semblables (2x + 5x = 7x)", () => {
    const s = initialState(lvl({ lhs: ["2.x", "5.x", "1"], shots: 9 }), "test");
    const dragged = s.lhs[0]!.id;
    const target = s.lhs[1]!.id;
    expect(canAddTerms(s, dragged, target)).toBe(true);
    const s2 = addTerms(s, dragged, target);
    expect(s2.lhs.length).toBe(2);
    const r = s2.lhs[0]!;
    expect(r.numerator).toHaveLength(2);
    expect((r.numerator[0]!.atom as { value: number }).value).toBe(7);
    expect(r.numerator[1]!.atom.kind).toBe("unknown");
  });

  it("refuse des parties littérales différentes (2x + 3t)", () => {
    const s = initialState(lvl({ lhs: ["2.x", "3.t"], shots: 9 }), "test");
    expect(canAddTerms(s, s.lhs[0]!.id, s.lhs[1]!.id)).toBe(false);
  });

  it("refuse une forme non identique (xt vs tx)", () => {
    const s = initialState(lvl({ lhs: ["x.t", "t.x"], shots: 9 }), "test");
    expect(canAddTerms(s, s.lhs[0]!.id, s.lhs[1]!.id)).toBe(false);
  });
});

describe("clearZeroDenominator", () => {
  it("0/d : un clic retire le dénominateur, puis deleteZero devient possible", () => {
    const s = initialState(lvl({ lhs: ["0/p", "x"], shots: 9 }), "test");
    const zeroId = s.lhs[0]!.numerator[0]!.id;
    expect(canClearZeroDenominator(s, zeroId)).toBe(true);
    expect(canDeleteZero(s, zeroId)).toBe(false); // bloqué tant qu'il y a un dén.
    const s2 = clearZeroDenominator(s, zeroId);
    expect(s2.lhs[0]!.denominator).toBeUndefined();
    expect(canDeleteZero(s2, s2.lhs[0]!.numerator[0]!.id)).toBe(true);
  });

  it("refuse si le numérateur n'est pas 0", () => {
    const s = initialState(lvl({ lhs: ["2/p", "x"], shots: 9 }), "test");
    expect(canClearZeroDenominator(s, s.lhs[0]!.numerator[0]!.id)).toBe(false);
  });
});

describe("clearOneDenominator", () => {
  it("x/1 : un clic sur le dénominateur 1 le fait disparaître", () => {
    const s = initialState(lvl({ lhs: ["x/1", "t"], shots: 9 }), "test");
    const oneId = s.lhs[0]!.denominator![0]!.id;
    expect(canClearOneDenominator(s, oneId)).toBe(true);
    const s2 = clearOneDenominator(s, oneId);
    expect(s2.lhs[0]!.denominator).toBeUndefined();
    expect(s2.lhs[0]!.numerator[0]!.atom.kind).toBe("unknown");
  });

  it("refuse si le dénominateur n'est pas 1", () => {
    const s = initialState(lvl({ lhs: ["x/2", "t"], shots: 9 }), "test");
    expect(canClearOneDenominator(s, s.lhs[0]!.denominator![0]!.id)).toBe(false);
  });
});
