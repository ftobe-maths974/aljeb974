/**
 * key-levels.ts — Identifiants des niveaux qui introduisent une nouvelle mécanique.
 *
 * Les titres et hints affichés sont localisés (cf. src/i18n/locales/*.ts).
 * Cette table contient uniquement les identifiants + l'emoji (qui reste universel).
 *
 * Cf. legacy/js/application.coffee:1199 et migration/MECHANICS.md §2.
 */

export interface KeyLevel {
  id: string;
  emoji: string;
}

export const KEY_LEVELS: ReadonlyArray<KeyLevel> = [
  { id: "1-1",  emoji: "💨" },
  { id: "1-3",  emoji: "🤝" },
  { id: "1-5",  emoji: "⚖️" },
  { id: "1-9",  emoji: "🎴" },
  { id: "1-16", emoji: "🔄" },
  { id: "2-1",  emoji: "🍰" },
  { id: "2-5",  emoji: "1️⃣" },
  { id: "2-11", emoji: "📥" },
  { id: "3-1",  emoji: "🛫" },
  { id: "3-7",  emoji: "📤" },
  { id: "4-1",  emoji: "➕" },
  { id: "4-4",  emoji: "🔨" },
  { id: "4-8",  emoji: "✨" },
  { id: "5-1",  emoji: "👻" },
];

export const KEY_LEVEL_IDS = new Set<string>(KEY_LEVELS.map((l) => l.id));

export function getKeyLevel(id: string): KeyLevel | undefined {
  return KEY_LEVELS.find((l) => l.id === id);
}
