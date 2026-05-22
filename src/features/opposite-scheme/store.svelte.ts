/**
 * store.svelte.ts — réglage persistant du schéma de cartes opposées.
 *
 * Le schéma actif est stocké dans localStorage et appliqué globalement en
 * posant ses variables CSS sur `document.documentElement` (`<html>`). Aucun
 * composant n'a besoin de connaître les détails : ils consomment les variables.
 *
 * Usage :
 *   import { oppositeScheme } from ".../opposite-scheme";
 *   oppositeScheme.id            // id courant (réactif)
 *   oppositeScheme.set("reflet") // bascule
 */

import {
  ALL_VAR_KEYS,
  DEFAULT_SCHEME_ID,
  getScheme,
  type OppositeScheme,
} from "./schemes.ts";

const STORAGE_KEY = "aljeb974:opposite-scheme";

function loadInitial(): string {
  if (typeof window === "undefined") return DEFAULT_SCHEME_ID;
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_SCHEME_ID;
  } catch {
    return DEFAULT_SCHEME_ID;
  }
}

/** Pose les variables d'un schéma sur un élément (après avoir nettoyé). */
export function applySchemeVars(el: HTMLElement, scheme: OppositeScheme) {
  for (const key of ALL_VAR_KEYS) el.style.removeProperty(key);
  for (const [key, value] of Object.entries(scheme.vars)) {
    el.style.setProperty(key, value);
  }
}

class OppositeSchemeStore {
  id = $state<string>(loadInitial());
  current = $derived(getScheme(this.id));

  constructor() {
    if (typeof window !== "undefined") this.apply();
  }

  set(id: string) {
    this.id = getScheme(id).id; // normalise (retombe sur le défaut si inconnu)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, this.id);
      } catch {
        /* QuotaExceeded / privacy mode → ignore */
      }
      this.apply();
    }
  }

  private apply() {
    applySchemeVars(document.documentElement, getScheme(this.id));
  }
}

export const oppositeScheme = new OppositeSchemeStore();

if (typeof window !== "undefined") {
  (window as unknown as { aljebOpposite: OppositeSchemeStore }).aljebOpposite =
    oppositeScheme;
}
