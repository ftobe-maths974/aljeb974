/**
 * schemes.ts — registre des schémas de visualisation des cartes opposées.
 *
 * SOURCE UNIQUE DE VÉRITÉ. Pour ajouter / modifier un schéma, il suffit
 * d'éditer ce fichier : aucun autre code de l'app n'a besoin de changer.
 *
 * Principe d'isolation : un schéma n'est qu'un jeu de variables CSS posées sur
 * un élément (le `<html>` pour le rendu global, un wrapper pour l'aperçu).
 * `Card.svelte` consomme ces variables via `var(--opp-…, fallback)`, où le
 * fallback reproduit exactement le look historique. Card.svelte ne connaît donc
 * aucun nom de schéma — on peut tout faire évoluer ici sans le toucher.
 *
 * Contrat de variables (toutes optionnelles, fallback = look « couleur ») :
 *   --opp-neg-bg            fond de la carte négative
 *   --opp-neg-border-color  couleur de bordure de la carte négative
 *   --opp-neg-shadow        ombre (overlay) — sert à creuser (inset)
 *   --opp-neg-x-bg          fond spécifique de l'inconnue x négative
 *   --opp-neg-fg            couleur du glyphe TEXTE (transparent = creux)
 *   --opp-neg-stroke        contour du glyphe TEXTE (-webkit-text-stroke)
 *   --opp-neg-filter        filtre appliqué à l'EMOJI négatif (les vars fg/stroke
 *                           n'ont pas d'effet sur un emoji couleur)
 *   --opp-neg-transform     transform du glyphe texte ET emoji (ex. scaleY(-1))
 */

export interface OppositeScheme {
  id: string;
  label: { fr: string; en: string };
  description: { fr: string; en: string };
  /** Variables CSS appliquées sur l'élément de portée. */
  vars: Record<string, string>;
}

export const OPPOSITE_SCHEMES: OppositeScheme[] = [
  {
    id: "solid-ghost",
    label: { fr: "Plein / creux", en: "Solid / hollow" },
    description: {
      fr: "Le positif est plein, l'opposé est la même carte « évidée » : un creux au glyphe gravé.",
      en: "Positive is solid; the opposite is the same card hollowed out, with an engraved glyph.",
    },
    vars: {
      "--opp-neg-bg": "#1b2531",
      "--opp-neg-border-color": "rgba(255, 255, 255, 0.14)",
      "--opp-neg-shadow":
        "inset 0 2px 5px rgba(0, 0, 0, 0.55), inset 0 -1px 0 rgba(255, 255, 255, 0.06)",
      "--opp-neg-x-bg": "#2a1c12",
      "--opp-neg-fg": "transparent",
      "--opp-neg-stroke": "1.5px rgba(255, 255, 255, 0.6)",
      // Emoji : pas de « creux » possible sur un glyphe couleur → effet spectral.
      "--opp-neg-filter": "grayscale(1) opacity(0.45)",
    },
  },
  {
    id: "negatif-photo",
    label: { fr: "Négatif photo", en: "Photo negative" },
    description: {
      fr: "Inversion noir/blanc, comme un négatif photographique (clin d'œil aux cartes-chiffres d'origine).",
      en: "Black/white inversion, like a photographic negative (nod to the original number cards).",
    },
    vars: {
      "--opp-neg-bg": "#0f1722",
      "--opp-neg-border-color": "rgba(255, 255, 255, 0.25)",
      "--opp-neg-x-bg": "#0f1722",
      "--opp-neg-fg": "#ffffff",
      "--opp-neg-filter": "invert(1)",
    },
  },
  {
    id: "reflet",
    label: { fr: "Reflet (miroir)", en: "Reflection (mirror)" },
    description: {
      fr: "Même carte, même couleur, mais le glyphe est retourné — comme un reflet sur l'eau.",
      en: "Same card, same color, but the glyph is flipped — like a reflection on water.",
    },
    vars: {
      "--opp-neg-bg": "#fef3c7",
      "--opp-neg-border-color": "rgba(0, 0, 0, 0.15)",
      "--opp-neg-x-bg": "linear-gradient(135deg, #f59e0b, #fb923c)",
      "--opp-neg-transform": "scaleY(-1)",
    },
  },
  {
    id: "couleur-classique",
    label: { fr: "Couleur (classique)", en: "Color (classic)" },
    description: {
      fr: "Le rendu historique : fond pêche et signe « − ». Sert de base de comparaison.",
      en: "The historical look: peach background and a “−” sign. Baseline for comparison.",
    },
    vars: {
      "--opp-neg-bg": "#fed7aa",
      "--opp-neg-border-color": "rgba(0, 0, 0, 0.15)",
      "--opp-neg-x-bg": "linear-gradient(135deg, #ea580c, #9a3412)",
    },
  },
];

export const DEFAULT_SCHEME_ID = "negatif-photo";

/** Toutes les variables connues — sert au store pour nettoyer avant d'appliquer. */
export const ALL_VAR_KEYS: string[] = [
  ...new Set(OPPOSITE_SCHEMES.flatMap((s) => Object.keys(s.vars))),
];

export function getScheme(id: string): OppositeScheme {
  return (
    OPPOSITE_SCHEMES.find((s) => s.id === id) ??
    OPPOSITE_SCHEMES.find((s) => s.id === DEFAULT_SCHEME_ID)!
  );
}

/** Variables d'un schéma sous forme de chaîne `style` inline (pour l'aperçu). */
export function schemeStyle(scheme: OppositeScheme): string {
  return Object.entries(scheme.vars)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
}
