/**
 * astuces.ts — Animations indicatives au démarrage des niveaux-clés.
 *
 * Reproduction du switch `astuces()` legacy ([application.coffee:1128-1142])
 * sous une forme purement déclarative.
 *
 * AtomQuery cible une carte dans l'état courant ; sa résolution se fait
 * côté DOM via les data-attributes posés par Card.svelte et Fraction.svelte.
 */

export interface AtomQuery {
  /** Valeur sérialisée de l'atome ciblé (ex: "x", "-t", "0", "1", "p", "_"). */
  value: string;
  /** Restriction sur le côté. */
  in?: "pioche" | "lhs" | "rhs";
  /** Restriction sur la position dans la fraction. */
  region?: "numerator" | "denominator";
}

export type AstuceTarget = AtomQuery | "lhs" | "rhs";

export type Astuce =
  | { kind: "tap"; target: AtomQuery; double?: boolean }
  | { kind: "drag"; from: AtomQuery; to: AstuceTarget };

export const ASTUCES: Record<string, Astuce> = {
  "1-1":  { kind: "tap",  target: { value: "0" } },
  "1-3":  { kind: "drag", from: { value: "2" }, to: { value: "-2" } },
  "1-9":  { kind: "drag", from: { value: "-g", in: "pioche" }, to: "lhs" },
  "1-16": { kind: "tap",  target: { value: "p", in: "pioche" } },
  "2-1":  { kind: "drag", from: { value: "p", region: "denominator" }, to: { value: "p", region: "numerator" } },
  "2-5":  { kind: "tap",  target: { value: "1" } },
  "2-11": { kind: "drag", from: { value: "b", in: "pioche" }, to: { value: "_" } },
  "3-1":  { kind: "drag", from: { value: "t" }, to: "lhs" },
  "3-7":  { kind: "drag", from: { value: "d", in: "pioche" }, to: { value: "_" } },
  "4-1":  { kind: "drag", from: { value: "2" }, to: { value: "3" } },
  "4-4":  { kind: "tap",  target: { value: "6" }, double: true },
  "4-8":  { kind: "drag", from: { value: "2" }, to: { value: "3" } },
  "5-1":  { kind: "tap",  target: { value: "-1" }, double: true },
};

/** Construit le sélecteur CSS pour résoudre une AtomQuery via document.querySelector. */
export function astuceSelector(q: AtomQuery): string {
  const escaped = q.value.replace(/"/g, '\\"');
  const parts: string[] = [];
  if (q.in) parts.push(`[data-side="${q.in}"]`);
  if (q.region) parts.push(`[data-region="${q.region}"]`);
  parts.push(`[data-card-value="${escaped}"]`);
  return parts.join(" ");
}
