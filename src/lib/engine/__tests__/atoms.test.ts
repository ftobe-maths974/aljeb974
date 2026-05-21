import { describe, expect, it } from "vitest";
import {
  atomsEqual,
  atomsOpposite,
  flipSign,
  fromLiteral,
  isOne,
  isZero,
  literalValue,
} from "../atoms.ts";
import { parseAtom } from "../dsl.ts";

describe("atoms", () => {
  describe("atomsEqual", () => {
    it("égalité de littéraux", () => {
      expect(atomsEqual(parseAtom("3"), parseAtom("3"))).toBe(true);
      expect(atomsEqual(parseAtom("3"), parseAtom("4"))).toBe(false);
      expect(atomsEqual(parseAtom("-3"), parseAtom("3"))).toBe(false);
    });
    it("égalité de symboles", () => {
      expect(atomsEqual(parseAtom("t"), parseAtom("t"))).toBe(true);
      expect(atomsEqual(parseAtom("t"), parseAtom("-t"))).toBe(false);
      expect(atomsEqual(parseAtom("a"), parseAtom("b"))).toBe(false);
    });
    it("x", () => {
      expect(atomsEqual(parseAtom("x"), parseAtom("x"))).toBe(true);
      expect(atomsEqual(parseAtom("x"), parseAtom("-x"))).toBe(false);
    });
  });

  describe("atomsOpposite", () => {
    it("symboles", () => {
      expect(atomsOpposite(parseAtom("t"), parseAtom("-t"))).toBe(true);
      expect(atomsOpposite(parseAtom("-t"), parseAtom("t"))).toBe(true);
      expect(atomsOpposite(parseAtom("t"), parseAtom("t"))).toBe(false);
    });
    it("littéraux", () => {
      expect(atomsOpposite(parseAtom("2"), parseAtom("-2"))).toBe(true);
      expect(atomsOpposite(parseAtom("2"), parseAtom("-3"))).toBe(false);
    });
    it("x", () => {
      expect(atomsOpposite(parseAtom("x"), parseAtom("-x"))).toBe(true);
    });
    it("kinds différents", () => {
      expect(atomsOpposite(parseAtom("t"), parseAtom("-2"))).toBe(false);
    });
  });

  describe("flipSign", () => {
    it("immutabilité", () => {
      const a = parseAtom("t");
      const b = flipSign(a);
      expect(a.sign).toBe(1);
      expect(b.sign).toBe(-1);
    });
    it("double flip = identité", () => {
      expect(flipSign(flipSign(parseAtom("3"))).sign).toBe(1);
    });
  });

  describe("isZero / isOne", () => {
    it("zéro", () => {
      expect(isZero(parseAtom("0"))).toBe(true);
      expect(isZero(parseAtom("1"))).toBe(false);
    });
    it("un", () => {
      expect(isOne(parseAtom("1"))).toBe(true);
      expect(isOne(parseAtom("-1"))).toBe(true); // |value|=1, signe géré ailleurs
      expect(isOne(parseAtom("2"))).toBe(false);
    });
  });

  describe("literalValue / fromLiteral", () => {
    it("aller-retour", () => {
      expect(literalValue(fromLiteral(7))).toBe(7);
      expect(literalValue(fromLiteral(-3))).toBe(-3);
      expect(literalValue(fromLiteral(0))).toBe(0);
    });
  });
});
