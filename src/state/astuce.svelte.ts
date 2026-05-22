/**
 * astuce.svelte.ts — Store réactif qui gère les animations d'astuce.
 *
 * Cycle :
 *   1. game.loadLevel(c, l) appelle astuce.startForLevel(`${c}-${l}`)
 *   2. Le store cherche l'astuce dans la table, résout les rects DOM
 *      (avec un léger retard pour laisser Svelte rendre les éléments).
 *   3. Une boucle 3s relance l'animation (cf. legacy).
 *   4. La main reste affichée jusqu'à ce que le joueur AGISSE : démarrage d'un
 *      drag (cf. drag.svelte.ts) ou coup réussi (cf. game.applyState). Un simple
 *      tap (énoncé, vide, UI) ne l'éteint pas.
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
    // L'arrêt est déclenché par une vraie action (drag start / coup réussi),
    // pas par un simple tap (cf. drag.svelte.ts et game.applyState).
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
    this.state = null;
  }
}

export const astuce = new AstuceStore();
