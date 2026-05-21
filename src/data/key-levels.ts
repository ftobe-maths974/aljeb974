/**
 * key-levels.ts — Les 13 niveaux qui introduisent une nouvelle mécanique.
 *
 * Cf. legacy/js/application.coffee:1199 (loop `new-power`)
 * et migration/MECHANICS.md §2.
 *
 * Ces niveaux portent un marqueur visuel (ampoule) dans le menu de sélection,
 * et déclenchent une astuce animée au démarrage.
 */

export interface KeyLevel {
  /** Identifiant niveau, ex: "1-1". */
  id: string;
  /** Titre court (affiché dans la bulle d'aide). */
  title: string;
  /** Phrase pédagogique (ce que l'élève va apprendre). */
  hint: string;
}

export const KEY_LEVELS: ReadonlyArray<KeyLevel> = [
  { id: "1-1",  title: "Le zéro",            hint: "Touche un 0 pour le faire disparaître." },
  { id: "1-3",  title: "L'opposé",           hint: "Glisse un terme sur son opposé : ils donnent 0." },
  { id: "1-5",  title: "L'équation = balance", hint: "Les deux plateaux sont en équilibre. Ce que tu fais à gauche, tu dois le faire à droite." },
  { id: "1-9",  title: "La pioche",          hint: "Pose une carte sur les DEUX côtés pour garder l'équilibre." },
  { id: "1-16", title: "Inverser le signe",  hint: "Touche une carte de pioche pour changer son signe." },
  { id: "2-1",  title: "Les fractions",      hint: "Une fraction p/p vaut 1 : superpose-les pour simplifier." },
  { id: "2-5",  title: "Le un multiplicatif", hint: "Touche un « 1 » qui multiplie pour l'effacer (x·1 = x)." },
  { id: "2-11", title: "Multiplier",          hint: "Glisse une carte de la pioche dans le slot pour multiplier les 2 membres." },
  { id: "3-1",  title: "Traverser",           hint: "Glisse un terme de l'autre côté de l'égalité : son signe s'inverse." },
  { id: "3-7",  title: "Multiplier (num)",    hint: "Tu peux aussi déposer dans le numérateur des autres fractions." },
  { id: "4-1",  title: "Additionner",         hint: "Glisse deux nombres l'un sur l'autre pour les additionner." },
  { id: "4-4",  title: "Factoriser",          hint: "Double-touche un nombre pour le décomposer en facteurs premiers." },
  { id: "4-8",  title: "Simplifier",          hint: "Combine factorisations et fractions pour simplifier le tout." },
  { id: "5-1",  title: "Le signe moins",      hint: "Sélectionne une carte puis double-touche le « −1 » pour l'appliquer." },
];

export const KEY_LEVEL_IDS = new Set<string>(KEY_LEVELS.map((l) => l.id));

export function getKeyLevel(id: string): KeyLevel | undefined {
  return KEY_LEVELS.find((l) => l.id === id);
}
