/**
 * seen.svelte.ts — mémoire persistante des niveaux-clés déjà visités, pour ne
 * plus afficher la bannière LevelIntro après le premier passage (comportement
 * wideapp / DragonBox).
 *
 * Stocké dans localStorage. Survit aux refresh, reset au /reset console ou via
 * clear() pour réafficher toutes les bannières.
 */

const STORAGE_KEY = "aljeb974:seen-key-levels";

function load(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function persist(s: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));
  } catch {
    /* QuotaExceeded / privacy mode → ignore */
  }
}

class SeenStore {
  private set = $state<Set<string>>(load());

  has(levelId: string): boolean {
    return this.set.has(levelId);
  }

  mark(levelId: string) {
    if (this.set.has(levelId)) return;
    this.set = new Set([...this.set, levelId]);
    persist(this.set);
  }

  /** Pour debug : `import { seen } from ...; seen.clear()` dans la console. */
  clear() {
    this.set = new Set();
    persist(this.set);
  }
}

export const seen = new SeenStore();

if (typeof window !== "undefined") {
  // Expose à la console pour debugging.
  (window as unknown as { aljebSeen: SeenStore }).aljebSeen = seen;
}
