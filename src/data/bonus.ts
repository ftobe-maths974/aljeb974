/**
 * bonus.ts — chapitre « Bonus » défini en code (pas dans levels.json, qui est
 * généré par `npm run convert` depuis le legacy). Contient le niveau Sandbox :
 * une équation riche (nombres, lettres, fraction) à manipuler librement, avec
 * tous les pouvoirs activables/désactivables (cf. state/sandbox.svelte.ts).
 */

import type { Level } from "../lib/engine/index.ts";

export const SANDBOX_CHAPTER = 6;
export const SANDBOX_LEVEL = 1;

/** Vrai si (chapter, level) désigne le bac à sable. */
export function isSandbox(chapter: number, level: number): boolean {
  return chapter === SANDBOX_CHAPTER && level === SANDBOX_LEVEL;
}

const sandboxLevel: Level = {
  // x + 6 + a  =  b + (-3) + 2/p
  lhs: [
    { numerator: [{ kind: "unknown", sign: 1 }] },
    { numerator: [{ kind: "literal", sign: 1, value: 6 }] },
    { numerator: [{ kind: "symbol", sign: 1, letter: "a" }] },
  ],
  rhs: [
    { numerator: [{ kind: "symbol", sign: 1, letter: "b" }] },
    { numerator: [{ kind: "literal", sign: -1, value: 3 }] },
    {
      numerator: [{ kind: "literal", sign: 1, value: 2 }],
      denominator: [{ kind: "symbol", sign: 1, letter: "p" }],
    },
  ],
  // Pioche réutilisable (dropOnce off en sandbox) : de quoi tout tester.
  pioche: [
    { numerator: [{ kind: "literal", sign: 1, value: 1 }] },
    { numerator: [{ kind: "literal", sign: -1, value: 1 }] },
    { numerator: [{ kind: "literal", sign: 1, value: 2 }] },
    { numerator: [{ kind: "symbol", sign: 1, letter: "c" }] },
  ],
  shots: 999,
};

/** Chapitre bonus, forme identique aux chapitres de levels.json. */
export const bonusChapter = {
  index: SANDBOX_CHAPTER,
  title: "Bonus",
  levels: { "1": sandboxLevel } as Record<string, Level>,
};
