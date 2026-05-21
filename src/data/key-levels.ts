/**
 * key-levels.ts — Les niveaux qui introduisent une nouvelle mécanique.
 *
 * Cf. legacy/js/application.coffee:1199 et migration/MECHANICS.md §2.
 *
 * Ces niveaux portent une ampoule 💡 dans le menu et déclenchent à l'arrivée :
 *  - une bannière "LevelIntro" avec une phrase imagée
 *  - une astuce animée (cf. src/data/astuces.ts)
 */

export interface KeyLevel {
  /** Identifiant niveau, ex: "1-1". */
  id: string;
  /** Titre court (affiché en gras dans la bannière + tooltip menu). */
  title: string;
  /** Phrase pédagogique en langage enfant. */
  hint: string;
  /** Emoji associé pour donner du caractère à la bannière. */
  emoji: string;
}

export const KEY_LEVELS: ReadonlyArray<KeyLevel> = [
  {
    id: "1-1",
    title: "Le zéro",
    hint: "Le zéro, c'est rien du tout. Touche-le, il s'envole en fumée !",
    emoji: "💨",
  },
  {
    id: "1-3",
    title: "Les contraires",
    hint: "Quand un truc rencontre son contraire, ils s'annulent et il reste… zéro !",
    emoji: "🤝",
  },
  {
    id: "1-5",
    title: "La balance",
    hint: "Les deux côtés du = pèsent pareil, comme une balance. Et le zéro, ça ne pèse rien du tout !",
    emoji: "⚖️",
  },
  {
    id: "1-9",
    title: "La pioche",
    hint: "Glisse une carte de la pioche pour la poser. Mais attention : ajoute-la sur les DEUX côtés pour garder l'équilibre.",
    emoji: "🎴",
  },
  {
    id: "1-16",
    title: "Changer le signe",
    hint: "Touche une carte de la pioche pour changer son signe. Plus devient moins, et moins devient plus !",
    emoji: "🔄",
  },
  {
    id: "2-1",
    title: "Les fractions",
    hint: "Quand la même chose est en haut et en bas d'une fraction, glisse-les l'une sur l'autre : elles se transforment en 1 !",
    emoji: "🍰",
  },
  {
    id: "2-5",
    title: "Multiplier par 1",
    hint: "Multiplier par 1 ne change rien. Tu peux faire disparaître les 1 inutiles d'un coup de doigt.",
    emoji: "1️⃣",
  },
  {
    id: "2-11",
    title: "Le slot vide",
    hint: "Tu vois le carré pointillé en bas d'une fraction ? Glisse une carte dedans pour la multiplier.",
    emoji: "📥",
  },
  {
    id: "3-1",
    title: "Traverser le =",
    hint: "Tu peux faire voyager un terme d'un côté à l'autre. Mais en chemin, son signe se retourne !",
    emoji: "🛫",
  },
  {
    id: "3-7",
    title: "Slot du haut",
    hint: "Tu peux aussi déposer une carte au-dessus, dans le numérateur des autres fractions.",
    emoji: "📤",
  },
  {
    id: "4-1",
    title: "Additionner les nombres",
    hint: "Glisse deux nombres l'un sur l'autre : ils s'additionnent pour n'en faire qu'un seul.",
    emoji: "➕",
  },
  {
    id: "4-4",
    title: "Casser un nombre",
    hint: "Double-touche un grand nombre pour le casser en petits morceaux (ses facteurs premiers).",
    emoji: "🔨",
  },
  {
    id: "4-8",
    title: "Tout simplifier",
    hint: "Combine les petits morceaux pour simplifier la fraction au maximum.",
    emoji: "✨",
  },
  {
    id: "5-1",
    title: "Le moins fantôme",
    hint: "Choisis une carte (elle devient verte), puis double-touche le −1 pour lui coller son signe contraire.",
    emoji: "👻",
  },
];

export const KEY_LEVEL_IDS = new Set<string>(KEY_LEVELS.map((l) => l.id));

export function getKeyLevel(id: string): KeyLevel | undefined {
  return KEY_LEVELS.find((l) => l.id === id);
}
