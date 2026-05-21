/**
 * fx.svelte.ts — Effets visuels transitoires (vapeur à la disparition d'une carte, etc.)
 *
 * Pattern : un store global expose une liste d'« events » avec position et timestamp.
 * Le composant overlay (PuffOverlay.svelte) les rend, et les retire automatiquement
 * après leur durée d'animation.
 */

export interface Puff {
  id: number;
  x: number;
  y: number;
  /** Slogan optionnel affiché au-dessus du Side, aligné en X avec la carte. */
  slogan?: string;
  /** Y du slogan (par défaut au-dessus du pouf). */
  sloganY?: number;
}

/** Calcule un Y « au-dessus du Side parent » à partir d'un élément. */
function sideTopAbove(el: HTMLElement | null): number | undefined {
  const side = el?.closest<HTMLElement>("[data-side]");
  if (!side) return undefined;
  return side.getBoundingClientRect().top - 14;
}

class FxStore {
  puffs = $state<Puff[]>([]);
  private nextId = 1;

  /** Génère un petit nuage de vapeur centré sur (x, y) en page coords. */
  spawnPuff(x: number, y: number, slogan?: string, sloganY?: number, durationMs = 1400) {
    const id = this.nextId++;
    this.puffs = [...this.puffs, { id, x, y, slogan, sloganY }];
    setTimeout(() => {
      this.puffs = this.puffs.filter((p) => p.id !== id);
    }, durationMs);
  }

  /** Helper : spawn une vapeur sur l'élément DOM identifié par cardId. */
  spawnPuffOnCard(cardId: string, slogan?: string) {
    const el = document.querySelector<HTMLElement>(`[data-card-id="${cardId}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    this.spawnPuff(
      r.left + r.width / 2,
      r.top + r.height / 2,
      slogan,
      sideTopAbove(el),
    );
  }

  /** Helper : spawn une vapeur sur la fraction (utilisé quand un terme entier disparaît). */
  spawnPuffOnFraction(fractionId: string, slogan?: string) {
    const el = document.querySelector<HTMLElement>(`[data-fraction-id="${fractionId}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    this.spawnPuff(
      r.left + r.width / 2,
      r.top + r.height / 2,
      slogan,
      sideTopAbove(el),
    );
  }
}

export const fx = new FxStore();
