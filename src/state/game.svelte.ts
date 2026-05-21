/**
 * game.svelte.ts — store réactif Svelte 5 qui enveloppe le moteur pur.
 *
 * Le moteur (src/lib/engine/) reste 100% testable et déterministe.
 * Ce store gère :
 *   - l'état courant (via $state)
 *   - les actions disponibles (chargement de niveau, clics, drops)
 *   - les dérivés (isSolved, stars) via $derived
 *
 * Usage côté composant :
 *   import { game } from "../state/game.svelte.ts";
 *   game.loadLevel(chapter, level);
 *   game.deleteZero(cardId);
 */

import {
  cancelOpposites,
  canCancelOpposites,
  canMoveAcross,
  capabilitiesFor,
  deleteOne,
  deleteZero,
  dropFromPioche,
  initialState,
  isSolved,
  locateFraction,
  moveAcross,
  stars,
  type Capabilities,
  type GameState,
} from "../lib/engine/index.ts";
import levelsData from "../../migration/levels.json";

// ─── Lookup helper ──────────────────────────────────────────────────────────

function findLevel(chapter: number, level: number) {
  const chap = levelsData.chapters.find((c) => c.index === chapter);
  if (!chap) throw new Error(`Chapitre ${chapter} introuvable`);
  const lvl = (chap.levels as Record<string, unknown>)[level.toString()];
  if (!lvl) throw new Error(`Niveau ${chapter}-${level} introuvable`);
  // Le JSON valide le schéma Zod au moment de la génération ; on caste ici.
  return lvl as Parameters<typeof initialState>[0];
}

// ─── Store ──────────────────────────────────────────────────────────────────

class GameStore {
  state = $state<GameState | null>(null);
  chapter = $state(1);
  level = $state(1);

  caps = $derived<Capabilities>(capabilitiesFor(this.chapter, this.level));
  solved = $derived(this.state ? isSolved(this.state) : false);
  starsEarned = $derived(this.state ? stars(this.state) : 0);

  loadLevel(chapter: number, level: number) {
    this.chapter = chapter;
    this.level = level;
    const lvl = findLevel(chapter, level);
    this.state = initialState(lvl, `${chapter}-${level}`);
  }

  /** Re-lance le niveau courant. */
  restart() {
    this.loadLevel(this.chapter, this.level);
  }

  deleteZero(cardId: string) {
    if (!this.state) return;
    this.state = deleteZero(this.state, cardId);
  }

  deleteOne(cardId: string) {
    if (!this.state) return;
    this.state = deleteOne(this.state, cardId);
  }

  /**
   * Tente une action drag-drop fraction → fraction (annulation d'opposés, etc.)
   * ou fraction → côté (cross-side). Retourne true si une opération a été appliquée.
   */
  tryDrop(sourceFractionId: string, target: { fractionId?: string; side?: "lhs" | "rhs" }) {
    if (!this.state) return false;
    const src = locateFraction(this.state, sourceFractionId);
    if (!src) return false;

    // 1. Si la source vient de la pioche et la cible est un côté → dropFromPioche
    if (src.side === "pioche" && (target.side === "lhs" || target.side === "rhs")) {
      this.state = dropFromPioche(this.state, sourceFractionId, target.side, {
        dropOnce: this.caps.dropOnce,
      });
      return true;
    }

    // 2. Si la cible est une fraction et que les deux sont au même membre :
    //    tenter l'annulation d'opposés.
    if (target.fractionId) {
      const tgt = locateFraction(this.state, target.fractionId);
      if (
        tgt &&
        src.side === tgt.side &&
        canCancelOpposites(this.state, sourceFractionId, target.fractionId)
      ) {
        this.state = cancelOpposites(this.state, sourceFractionId, target.fractionId);
        return true;
      }
    }

    // 3. Si la cible est l'autre membre (et crossPower actif) → moveAcross.
    if (
      this.caps.crossPower &&
      (target.side === "lhs" || target.side === "rhs") &&
      (src.side === "lhs" || src.side === "rhs") &&
      src.side !== target.side &&
      canMoveAcross(this.state, sourceFractionId)
    ) {
      this.state = moveAcross(this.state, sourceFractionId);
      return true;
    }

    return false;
  }
}

export const game = new GameStore();
