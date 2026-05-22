/**
 * sandbox.svelte.ts — pouvoirs (superpowers) configurables du niveau Sandbox.
 *
 * Par défaut tout est activé (full-power), sauf dropOnce (pioche réutilisable)
 * et stylePower (vue balance normale). Chaque pouvoir est togglable et persisté.
 * Le game store utilise ces capacités quand on est dans le bac à sable.
 */

import type { Capabilities } from "../lib/engine/index.ts";

const STORAGE_KEY = "aljeb974:sandbox-powers";

const DEFAULTS: Capabilities = {
  dropOnce: false, // pioche réutilisable pour expérimenter
  reversePower: true,
  dropdenPower: true,
  dropnumPower: true,
  crossPower: true,
  multPower: true,
  addPower: true,
  addFractionPower: true,
  addTermsPower: true,
  primeFactorPower: true,
  negPower: true,
  stylePower: false,
};

/** Pouvoirs exposés dans l'UI (ordre + libellés FR/EN). */
export const SANDBOX_POWERS: {
  key: keyof Capabilities;
  label: { fr: string; en: string };
}[] = [
  { key: "crossPower", label: { fr: "Traverser le =", en: "Cross the =" } },
  { key: "reversePower", label: { fr: "Prendre l'opposé (pioche)", en: "Take opposite (pile)" } },
  { key: "negPower", label: { fr: "Multiplier par −1", en: "Multiply by −1" } },
  { key: "addPower", label: { fr: "Additionner (nombres)", en: "Add (numbers)" } },
  { key: "addTermsPower", label: { fr: "Regrouper termes semblables (2x+5x)", en: "Combine like terms (2x+5x)" } },
  { key: "addFractionPower", label: { fr: "Additionner fractions (même dén.)", en: "Add fractions (same den.)" } },
  { key: "multPower", label: { fr: "Multiplier", en: "Multiply" } },
  { key: "primeFactorPower", label: { fr: "Décomposer (facteurs)", en: "Factorize" } },
  { key: "dropnumPower", label: { fr: "Déposer au numérateur", en: "Drop in numerator" } },
  { key: "dropdenPower", label: { fr: "Déposer au dénominateur", en: "Drop in denominator" } },
  { key: "dropOnce", label: { fr: "Pioche à usage unique", en: "Single-use pile" } },
  { key: "stylePower", label: { fr: "Affichage linéaire (+, =)", en: "Linear display (+, =)" } },
];

function load(): Capabilities {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

class SandboxStore {
  powers = $state<Capabilities>(load());

  toggle(key: keyof Capabilities) {
    this.powers = { ...this.powers, [key]: !this.powers[key] };
    this.persist();
  }

  reset() {
    this.powers = { ...DEFAULTS };
    this.persist();
  }

  private persist() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.powers));
    } catch {
      /* QuotaExceeded / privacy → ignore */
    }
  }
}

export const sandbox = new SandboxStore();
