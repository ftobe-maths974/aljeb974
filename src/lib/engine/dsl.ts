/**
 * types.ts — Schéma TypeScript + Zod du DSL des niveaux Aljeb974
 *
 * Référence : migration/SPEC_DSL.md
 * Objectif :
 *   1. Typer le format JSON des niveaux (consommé par le moteur Svelte).
 *   2. Fournir un parser/validateur Zod (validation runtime + inférence statique).
 *   3. Fournir un parser de strings DSL ("x.-c.-t/-t.b") → AST.
 *
 * Aucune dépendance DOM. Utilisable côté Node (script de conversion) et côté navigateur.
 */

import { z } from "zod";

/* ─────────────────────────────────────────────────────────────────────────────
 * 1. Atomes : la brique de base
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Les 23 lettres-constantes utilisées par les 100 niveaux (a-z sauf n, o, y).
 * `x` n'est PAS dans cette liste : c'est l'inconnue, traitée à part.
 */
export const SYMBOL_LETTERS = [
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l",
  "m", "p", "q", "r", "s", "t", "u", "v", "w", "z",
] as const;
export type SymbolLetter = (typeof SYMBOL_LETTERS)[number];

/**
 * AST d'un atome (terme indivisible).
 *
 *   Unknown   : la variable à isoler (`x` ou `-x`)
 *   Symbol    : constante symbolique (`a`, `-b`, …)
 *   Literal   : entier littéral (`0`, `1`, `42`, `-3`)
 *   Hole      : trou (`_` ou `-_`, slot à combler depuis la pioche)
 *
 * `sign` factorise l'opposition pour éviter d'avoir 2× les variants.
 */
export type Atom =
  | { kind: "unknown"; sign: 1 | -1 }
  | { kind: "symbol"; sign: 1 | -1; letter: SymbolLetter }
  | { kind: "literal"; sign: 1 | -1; value: number } // value toujours >= 0
  | { kind: "hole"; sign: 1 | -1 };

export const AtomSchema: z.ZodType<Atom> = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("unknown"), sign: z.union([z.literal(1), z.literal(-1)]) }),
  z.object({
    kind: z.literal("symbol"),
    sign: z.union([z.literal(1), z.literal(-1)]),
    letter: z.enum(SYMBOL_LETTERS),
  }),
  z.object({
    kind: z.literal("literal"),
    sign: z.union([z.literal(1), z.literal(-1)]),
    value: z.number().int().nonnegative(),
  }),
  z.object({ kind: z.literal("hole"), sign: z.union([z.literal(1), z.literal(-1)]) }),
]);

/* ─────────────────────────────────────────────────────────────────────────────
 * 2. Termes : produits et fractions
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Un terme additif. Au moins un atome au numérateur.
 * Le dénominateur est soit absent (pas de fraction), soit une liste non vide d'atomes.
 *
 *   numerator   = liste d'atomes multipliés ("." dans la DSL)
 *   denominator = liste d'atomes multipliés, OU undefined si pas de fraction
 */
export interface Term {
  numerator: Atom[];
  denominator?: Atom[];
}

export const TermSchema: z.ZodType<Term> = z.object({
  numerator: z.array(AtomSchema).min(1),
  denominator: z.array(AtomSchema).min(1).optional(),
});

/* ─────────────────────────────────────────────────────────────────────────────
 * 3. Niveau
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Item de `reveal` :
 *   - "all"     : tout afficher en texte
 *   - "numbers" : tous les littéraux en texte
 *   - atome     : un atome précis (ex: "a", "x"). L'opposé "-a" est automatiquement ajouté
 *                 par la closure de révélation (sauf si "all").
 */
export const RevealItemSchema = z.union([
  z.literal("all"),
  z.literal("numbers"),
  z.string().regex(/^-?([a-mp-wxz]|\d+)$/, "atome invalide pour reveal"),
]);
export type RevealItem = z.infer<typeof RevealItemSchema>;

export const LevelSchema = z.object({
  /** Membre gauche, au moins 1 terme. */
  lhs: z.array(TermSchema).min(1),

  /** Membre droit, optionnel pour les premiers niveaux (pas encore d'égalité). */
  rhs: z.array(TermSchema).min(1).optional(),

  /** Pioche : cartes/termes disponibles à la main. */
  pioche: z.array(TermSchema).optional(),

  /** Liste de symboles à afficher en texte au lieu de leur sprite. */
  reveal: z.array(RevealItemSchema).optional(),

  /** Cible de coups pour 3 étoiles. */
  shots: z.number().int().positive(),
});
export type Level = z.infer<typeof LevelSchema>;

/* ─────────────────────────────────────────────────────────────────────────────
 * 4. Chapitre + jeu complet
 * ──────────────────────────────────────────────────────────────────────────── */

export const ChapterSchema = z.object({
  /** Index 1-based identique au champ `chapter` du moteur d'origine. */
  index: z.number().int().min(1).max(5),

  /** Titre lisible (optionnel — peut servir à l'i18n). */
  title: z.string().optional(),

  /** Niveaux indexés 1..20. */
  levels: z.record(z.string().regex(/^\d+$/), LevelSchema),
});
export type Chapter = z.infer<typeof ChapterSchema>;

export const GameSchema = z.object({
  version: z.string(),
  chapters: z.array(ChapterSchema),
});
export type Game = z.infer<typeof GameSchema>;

/* ─────────────────────────────────────────────────────────────────────────────
 * 5. Capacités (powers) — calculées dérivées du couple (chapter, level)
 * ──────────────────────────────────────────────────────────────────────────── */

export interface Capabilities {
  /** Les cartes de la pioche sont consommées (true) ou réutilisables (false). */
  dropOnce: boolean;
  /** Clic sur carte de pioche inverse son signe. */
  reversePower: boolean;
  /** Drop autorisé dans un dénominateur. */
  dropdenPower: boolean;
  /** Drop autorisé dans un numérateur. */
  dropnumPower: boolean;
  /** Glisser un terme d'un membre à l'autre (inversion de signe automatique). */
  crossPower: boolean;
  /** Drop nombre sur nombre = multiplication numérique. */
  multPower: boolean;
  /** Drop nombre sur nombre opposé = addition numérique. */
  addPower: boolean;
  /** Clic sur nombre > 3 = décomposition en facteurs premiers. */
  primeFactorPower: boolean;
  /** Clic sur carte sélectionnée puis appliquer `-1` ailleurs. */
  negPower: boolean;
  /** Rendu linéaire avec opérateurs `+`/`=` visibles. */
  stylePower: boolean;
}

/**
 * Calcule les capacités pour un niveau donné.
 * Reproduit la table de [legacy/js/application.coffee:1160-1169] AVEC corrections de bugs.
 */
export function capabilitiesFor(chapter: number, level: number): Capabilities {
  const id = `${chapter}-${level}`;
  return {
    dropOnce: chapter < 2,
    reversePower: chapter > 1 || (chapter === 1 && level > 15),
    // bug fix : exclusion explicite de 3-7
    dropdenPower:
      (chapter === 2 && level > 10) || (chapter > 2 && id !== "3-7"),
    // bug fix : le original avait deux clauses dont la 2e était inatteignable.
    dropnumPower: chapter > 3 || (chapter === 3 && level > 6),
    crossPower: chapter > 2,
    // bug fix idem : la 2e clause (chapter > 3 && level > 7) était redondante.
    multPower: chapter > 3,
    addPower: chapter > 3,
    primeFactorPower: chapter > 3, // ou (chapter > 3 && level > 3) — équivalent à chapter > 3
    negPower: chapter > 4,
    stylePower: STYLE_POWER_LEVELS.has(id),
  };
}

const STYLE_POWER_LEVELS = new Set<string>([
  "2-19", "2-20",
  "3-17", "3-18", "3-19", "3-20",
  "4-17", "4-18", "4-19", "4-20",
  "5-17", "5-18", "5-19", "5-20",
]);

/* ─────────────────────────────────────────────────────────────────────────────
 * 6. Parser du DSL textuel  ("x.-c.-t/-t.b" → Term)
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Parse une chaîne d'atome (`"x"`, `"-t"`, `"42"`, `"_"`, `"-_"`).
 * Lève si la chaîne ne représente pas un atome valide.
 */
export function parseAtom(s: string): Atom {
  if (s.length === 0) throw new Error("atome vide");

  let sign: 1 | -1 = 1;
  let body = s;
  if (body[0] === "-") {
    sign = -1;
    body = body.slice(1);
  }
  if (body.length === 0) throw new Error(`atome invalide: "${s}"`);

  if (body === "x") return { kind: "unknown", sign };
  if (body === "_") return { kind: "hole", sign };
  if (/^\d+$/.test(body)) {
    return { kind: "literal", sign, value: Number.parseInt(body, 10) };
  }
  if (/^[a-mp-wxz]$/.test(body) && body !== "x") {
    return { kind: "symbol", sign, letter: body as SymbolLetter };
  }
  throw new Error(`atome non reconnu : "${s}"`);
}

/**
 * Parse une chaîne de terme (`"x.6/2.3"`, `"b.x/_"`, `"p/p"`, `"-1"`).
 *
 * Règles :
 *  - Découpage sur "/" : numérateur / dénominateur (au plus une "/").
 *  - Découpage sur "." de chaque côté : liste d'atomes.
 *  - Tout atome est validé par parseAtom().
 */
export function parseTerm(s: string): Term {
  if (s.length === 0) throw new Error("terme vide");

  const slashCount = (s.match(/\//g) ?? []).length;
  if (slashCount > 1) throw new Error(`terme avec >1 fraction : "${s}"`);

  const [numStr, denStr] = s.split("/");
  if (numStr === undefined || numStr.length === 0) {
    throw new Error(`numérateur vide : "${s}"`);
  }
  const numerator = numStr.split(".").map(parseAtom);
  if (denStr === undefined) return { numerator };

  if (denStr.length === 0) throw new Error(`dénominateur vide : "${s}"`);
  const denominator = denStr.split(".").map(parseAtom);
  return { numerator, denominator };
}

/**
 * Sérialise un Atom en chaîne DSL (réciproque de parseAtom).
 */
export function serializeAtom(a: Atom): string {
  const prefix = a.sign === -1 ? "-" : "";
  switch (a.kind) {
    case "unknown": return prefix + "x";
    case "hole":    return prefix + "_";
    case "symbol":  return prefix + a.letter;
    case "literal": return prefix + a.value.toString();
  }
}

/**
 * Sérialise un Term en chaîne DSL (réciproque de parseTerm).
 */
export function serializeTerm(t: Term): string {
  const num = t.numerator.map(serializeAtom).join(".");
  if (!t.denominator) return num;
  const den = t.denominator.map(serializeAtom).join(".");
  return `${num}/${den}`;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 7. Closure de révélation
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Étend `reveal` en y ajoutant les opposés (`a` ⇒ `-a` aussi),
 * sauf si `"all"` y figure (auquel cas la closure est inutile).
 * Reproduit [legacy/js/application.coffee:1155].
 */
export function revealClosure(reveal: readonly RevealItem[] | undefined): Set<string> {
  const set = new Set<string>(reveal ?? []);
  if (set.has("all")) return set;
  for (const item of reveal ?? []) {
    if (item === "numbers") continue;
    if (!item.startsWith("-")) set.add("-" + item);
  }
  return set;
}

/**
 * Décide si une carte doit être affichée en texte (true) ou en sprite-monstre (false),
 * compte tenu du `reveal` du niveau.
 */
export function shouldRevealAsText(
  atom: Atom,
  revealSet: ReadonlySet<string>,
): boolean {
  if (revealSet.has("all")) return true;
  if (atom.kind === "literal" && revealSet.has("numbers")) return true;
  return revealSet.has(serializeAtom(atom));
}
