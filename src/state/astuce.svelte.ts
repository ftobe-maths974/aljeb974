/**
 * astuce.svelte.ts — Store réactif qui gère les animations d'astuce.
 *
 * Cycle :
 *   1. game.loadLevel(c, l) appelle astuce.startForLevel(`${c}-${l}`)
 *   2. Le store cherche l'astuce dans la table, résout les rects DOM
 *      (avec un léger retard pour laisser Svelte rendre les éléments).
 *   3. Une boucle 3s relance l'animation (cf. legacy).
 *   4. Au premier pointerdown global, le store se désactive.
 */

import { ASTUCES, type Astuce, type AstuceTarget, type AtomQuery, astuceSelector } from "../data/astuces.ts";

export interface AstuceResolved {
  config: Astuce;
  /** Rectangle de la cible principale (élément à taper, ou point de départ du drag). */
  fromRect: DOMRect;
  /** Rectangle d'arrivée pour un drag. Null pour un tap. */
  toRect: DOMRect | null;
  /** Compteur d'itérations (pour retrigger l'animation). */
  tick: number;
}

class AstuceStore {
  state = $state<AstuceResolved | null>(null);
  private timer: ReturnType<typeof setInterval> | null = null;
  private stopHandler: ((e: Event) => void) | null = null;

  startForLevel(levelId: string) {
    this.stop();
    const config = ASTUCES[levelId];
    if (!config) return;

    // Petit retard pour laisser le DOM se rendre après loadLevel
    setTimeout(() => this.resolve(config), 120);
  }

  private resolve(config: Astuce) {
    const fromEl = this.findElement(config.kind === "tap" ? config.target : config.from);
    if (!fromEl) return; // élément introuvable : on n'affiche pas l'astuce

    const toEl: HTMLElement | null =
      config.kind === "drag" ? this.findTarget(config.to) : null;
    if (config.kind === "drag" && !toEl) return;

    this.state = {
      config,
      fromRect: fromEl.getBoundingClientRect(),
      toRect: toEl ? toEl.getBoundingClientRect() : null,
      tick: 0,
    };

    // Boucle 3s pour relancer l'animation (cf. legacy `looping 3000`).
    this.timer = setInterval(() => {
      if (this.state) this.state = { ...this.state, tick: this.state.tick + 1 };
    }, 3000);

    // S'arrête à la première interaction (souris/touch) du joueur.
    this.stopHandler = () => this.stop();
    window.addEventListener("pointerdown", this.stopHandler, { once: true, passive: true });
  }

  private findElement(q: AtomQuery): HTMLElement | null {
    return document.querySelector<HTMLElement>(astuceSelector(q));
  }

  private findTarget(t: AstuceTarget): HTMLElement | null {
    if (t === "lhs" || t === "rhs") {
      return document.querySelector<HTMLElement>(`[data-side="${t}"]`);
    }
    return this.findElement(t);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.stopHandler) {
      window.removeEventListener("pointerdown", this.stopHandler);
      this.stopHandler = null;
    }
    this.state = null;
  }
}

export const astuce = new AstuceStore();
