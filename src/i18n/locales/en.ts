/**
 * en.ts — English locale. Must match the shape of fr.ts.
 * Verified at compile-time via the `Messages` type in ../types.ts.
 */

import type { Messages } from "../types.ts";

export const en: Messages = {
  meta: {
    code: "en",
    label: "English",
    flag: "🇬🇧",
  },

  ui: {
    tagline: "Learn to solve equations by moving cards around.",
    playFirstLevel: "Play level 1-1",
    chooseLevel: "Pick a level",
    chooseLevelTitle: "Pick a level",
    backHome: "← Home",
    backMenu: "← Menu",
    chapter: "Chapter",
    levelHeader: (chapter, level) => `Level ${chapter}-${level}`,
    coupsRecap: (s, t) => `${s}/${t} move${s > 1 || t > 1 ? "s" : ""}`,
    restart: "⟲",
    loading: "Loading…",
    badges: {
      dsl: "✓ DSL parsed",
      engine: "✓ pure TS engine",
      tests: "✓ 37 tests green",
    },
    githubLink: "github.com/ftobe-maths974/aljeb974",
  },

  orientation: {
    title: "Turn your phone",
    sub: "Aljeb974 is played in landscape.",
  },

  pending: {
    message: "Drop the same card on the other side to keep the balance.",
    cancel: "Cancel",
  },

  flash: {
    line1: "Drop this card",
    line2: "on the other side too",
  },

  drop: {
    hintTop: "Drop",
    hintBottom: "here too",
  },

  victory: {
    title: "Nice!",
    starsLabel: (n) => `${n} star${n > 1 ? "s" : ""} out of 3`,
    coupsRecap: (s, t) => `${s} move${s > 1 ? "s" : ""} out of ${t}.`,
    next: "Next →",
    menu: "Menu",
    restart: "Replay",
  },

  solution: {
    title: "You found it!",
    confirm: "See my stars ✨",
  },

  fx: {
    zeroNothing: "Zero is nothing!",
    oneNoChange: "One changes nothing!",
    oppositesCancel: "Opposites cancel out!",
    balanceRestored: "Balance restored!",
  },

  keyLevels: {
    "1-1":  { title: "Zero",          hint: "Zero is nothing. Touch it, it puffs away!" },
    "1-3":  { title: "Opposites",     hint: "When something meets its opposite, they cancel and leave… zero!" },
    "1-5":  { title: "The balance equation", hint: "= is like a scale: both pans are in balance. Your goal: weigh x!" },
    "1-9":  { title: "The deck",      hint: "Drag a deck card to drop it. But careful: add it on BOTH sides to keep the balance." },
    "1-16": { title: "Flip the sign", hint: "Tap a deck card to flip its sign. Plus becomes minus, minus becomes plus!" },
    "2-1":  { title: "Fractions",     hint: "When the same thing is at the top and bottom of a fraction, drag them onto each other: they turn into 1!" },
    "2-5":  { title: "Times one",     hint: "Multiplying by 1 doesn't change anything. Tap useless 1s to remove them." },
    "2-11": { title: "Empty slot",    hint: "See that dotted square below a fraction? Drag a card in to multiply." },
    "3-1":  { title: "Crossing =",    hint: "You can send a term from one side to the other. But on the way, its sign flips!" },
    "3-7":  { title: "Top slot",      hint: "You can also drop a card above, into the numerator of other fractions." },
    "4-1":  { title: "Add numbers",   hint: "Drag two numbers onto each other: they add up into one." },
    "4-4":  { title: "Break a number",hint: "Double-tap a big number to break it into smaller pieces (prime factors)." },
    "4-8":  { title: "Simplify all",  hint: "Combine the pieces to simplify the fraction as much as possible." },
    "5-1":  { title: "Ghost minus",   hint: "Pick a card (it turns green), then double-tap the −1 to give it the opposite sign." },
  },
};
