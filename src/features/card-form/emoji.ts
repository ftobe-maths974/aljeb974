/**
 * emoji.ts — table symbole → emoji pour la « forme cachée » des cartes
 * non révélées (mode emoji). Données pures, éditables librement.
 *
 * L'opposé n'est PAS encodé ici : il est rendu en réutilisant le style
 * d'opposé actif (feature opposite-scheme) appliqué à l'emoji. On indexe donc
 * par la valeur ABSOLUE (lettre ou chiffre sans signe).
 */

/** Lettres a→z. Le « x » (inconnue) = dragon, clin d'œil à DragonBox. */
const LETTERS: Record<string, string> = {
  a: "🦀", b: "🕷️", c: "🦞", d: "🐬", e: "🦅", f: "🦊", g: "🦒",
  h: "🦛", i: "🦔", j: "🪼", k: "🦘", l: "🦁", m: "🐵", n: "🦉",
  o: "🐙", p: "🐧", q: "🦆", r: "🐀", s: "🐍", t: "🐯", u: "🦄",
  v: "🦇", w: "🐺", x: "🐉", y: "🦬", z: "🦓",
};

/** Chiffres. 0 = cible (🎯) comme l'asset legacy ; 1–6 = dés ; 7–9 = chiffres encerclés. */
const DIGITS: Record<string, string> = {
  "0": "🎯",
  "1": "⚀", "2": "⚁", "3": "⚂", "4": "⚃", "5": "⚄", "6": "⚅",
  "7": "🌀", "8": "🎱", "9": "🔮",
};

/** Valeur (lettre ou chiffre, sans signe) → emoji, ou undefined si non couvert. */
export function emojiFor(absValue: string): string | undefined {
  return LETTERS[absValue] ?? DIGITS[absValue];
}
