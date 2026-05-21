/**
 * store.svelte.ts — store de localisation.
 *
 * Usage côté composant :
 *   import { t } from "../i18n/store.svelte.ts";
 *   <h1>{t().ui.tagline}</h1>
 *
 * La fonction `t()` retourne l'objet `Messages` de la locale courante.
 * On évite l'API t("ui.tagline") pour ne pas perdre le typage des params.
 *
 * Pour changer de langue : i18n.setLocale("en").
 * La langue est persistée dans localStorage et restaurée au démarrage.
 */

import { fr } from "./locales/fr.ts";
import { en } from "./locales/en.ts";
import type { Messages } from "./types.ts";

export const LOCALES: Record<string, Messages> = {
  fr,
  en,
};

export type LocaleCode = keyof typeof LOCALES & string;

const STORAGE_KEY = "aljeb974:locale";

function detectInitialLocale(): LocaleCode {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in LOCALES) return stored as LocaleCode;
    const browser = navigator.language.slice(0, 2);
    if (browser in LOCALES) return browser as LocaleCode;
  }
  return "fr";
}

class I18nStore {
  locale = $state<LocaleCode>(detectInitialLocale());
  messages = $derived(LOCALES[this.locale] ?? fr);

  setLocale(code: LocaleCode) {
    if (!(code in LOCALES)) return;
    this.locale = code;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        /* QuotaExceeded / privacy mode → ignore */
      }
    }
  }

  get availableLocales(): { code: LocaleCode; label: string; flag: string }[] {
    return Object.entries(LOCALES).map(([code, m]) => ({
      code: code as LocaleCode,
      label: m.meta.label,
      flag: m.meta.flag,
    }));
  }
}

export const i18n = new I18nStore();

/** Shortcut réactif vers les messages de la locale courante. */
export function t(): Messages {
  return i18n.messages;
}
