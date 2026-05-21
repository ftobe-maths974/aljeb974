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
}

class FxStore {
  puffs = $state<Puff[]>([]);
  private nextId = 1;

  /** Génère un petit nuage de vapeur centré sur (x, y) en page coords. */
  spawnPuff(x: number, y: number, durationMs = 700) {
    const id = this.nextId++;
    this.puffs = [...this.puffs, { id, x, y }];
    setTimeout(() => {
      this.puffs = this.puffs.filter((p) => p.id !== id);
    }, durationMs);
  }

  /** Helper : spawn une vapeur sur l'élément DOM identifié par cardId. */
  spawnPuffOnCard(cardId: string) {
    const el = document.querySelector<HTMLElement>(`[data-card-id="${cardId}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    this.spawnPuff(r.left + r.width / 2, r.top + r.height / 2);
  }
}

export const fx = new FxStore();
