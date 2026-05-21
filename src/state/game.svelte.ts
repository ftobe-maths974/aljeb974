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
  cancelPending,
  canCancelOpposites,
  canMoveAcross,
  canReverseInPioche,
  capabilitiesFor,
  completePiocheDrop,
  deleteOne,
  deleteZero,
  initialState,
  isSolved,
  locateFraction,
  moveAcross,
  reverseInPioche,
  stars,
  startPiocheDrop,
  type Capabilities,
  type GameState,
} from "../lib/engine/index.ts";
import levelsData from "../../migration/levels.json";
import { astuce } from "./astuce.svelte.ts";
import { fx } from "./fx.svelte.ts";

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
  /** True quand un drop de pioche est en cours et attend le 2ᵉ geste. */
  isPending = $derived(this.state?.pending != null);

  /**
   * Décalage entre la résolution effective et l'affichage du Victory overlay,
   * pour laisser les animations (vapeur, etc.) se terminer avant d'arrêter le jeu.
   */
  victoryReady = $state(false);
  private victoryTimer: ReturnType<typeof setTimeout> | null = null;
  /** Délai (ms) entre `solved=true` et `victoryReady=true`. */
  private static VICTORY_DELAY_MS = 1500;

  /**
   * Flash alert : id de la fraction qui doit être déposée (= la pioche).
   * Set quand l'élève fait une action interdite en block mode.
   */
  flashTargetId = $state<string | null>(null);
  private flashTimer: ReturnType<typeof setTimeout> | null = null;

  /** Déclenche le « ! » au-dessus de la carte pioche pour 1.2 s. */
  flashAlert() {
    if (!this.state?.pending) return;
    this.flashTargetId = this.state.pending.piocheFractionId;
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => {
      this.flashTargetId = null;
    }, 1200);
  }

  loadLevel(chapter: number, level: number) {
    this.chapter = chapter;
    this.level = level;
    const lvl = findLevel(chapter, level);
    this.state = initialState(lvl, `${chapter}-${level}`);
    if (this.victoryTimer) {
      clearTimeout(this.victoryTimer);
      this.victoryTimer = null;
    }
    this.victoryReady = false;
    astuce.startForLevel(`${chapter}-${level}`);
  }

  /**
   * Met à jour l'état et déclenche le compte à rebours d'affichage de la
   * victoire si l'opération vient de résoudre le niveau. Toutes les mutations
   * de `this.state` passent par ici.
   */
  private applyState(newState: GameState) {
    const wasSolved = this.state ? isSolved(this.state) : false;
    this.state = newState;
    if (!wasSolved && isSolved(newState)) {
      if (this.victoryTimer) clearTimeout(this.victoryTimer);
      this.victoryReady = false;
      this.victoryTimer = setTimeout(() => {
        this.victoryReady = true;
      }, GameStore.VICTORY_DELAY_MS);
    }
  }

  /** Re-lance le niveau courant. */
  restart() {
    this.loadLevel(this.chapter, this.level);
  }

  deleteZero(cardId: string) {
    if (!this.state) return;
    if (this.state.pending) {
      this.flashAlert();
      return;
    }
    this.applyState(deleteZero(this.state, cardId));
  }

  deleteOne(cardId: string) {
    if (!this.state) return;
    if (this.state.pending) {
      this.flashAlert();
      return;
    }
    this.applyState(deleteOne(this.state, cardId));
  }

  /** Annule un drop partiel et restaure l'état précédent. */
  cancelPending() {
    if (!this.state) return;
    this.applyState(cancelPending(this.state));
  }

  reverseInPioche(cardId: string) {
    if (!this.state) return;
    if (this.state.pending) {
      this.flashAlert();
      return;
    }
    if (!canReverseInPioche(this.state, cardId)) return;
    this.applyState(reverseInPioche(this.state, cardId));
  }

  /**
   * Tente une action drag-drop fraction → fraction (annulation d'opposés, etc.)
   * ou fraction → côté (cross-side). Retourne true si une opération a été appliquée.
   */
  tryDrop(sourceFractionId: string, target: { fractionId?: string; side?: "lhs" | "rhs" }) {
    if (!this.state) return false;
    const src = locateFraction(this.state, sourceFractionId);
    if (!src) return false;

    // ─── Block mode : on n'accepte QUE le drop de la pioche-en-attente sur
    //                 un côté encore en `remainingTargets`. Toute autre tentative
    //                 déclenche le flash alert.
    if (this.state.pending) {
      if (
        sourceFractionId === this.state.pending.piocheFractionId &&
        target.side &&
        this.state.pending.remainingTargets.includes(target.side)
      ) {
        this.applyState(completePiocheDrop(this.state, target.side, {
          dropOnce: this.caps.dropOnce,
        }));
        return true;
      }
      // Drop interdit : on lève une alerte
      this.flashAlert();
      return false;
    }

    // ─── Mode normal ────────────────────────────────────────────────────────
    // 1. Source de la pioche + cible un côté → première étape du drop équivalence
    if (src.side === "pioche" && (target.side === "lhs" || target.side === "rhs")) {
      this.applyState(startPiocheDrop(this.state, sourceFractionId, target.side));
      return true;
    }

    // 2. Cible une fraction du même membre + atomes opposés → cancelOpposites
    if (target.fractionId) {
      const tgt = locateFraction(this.state, target.fractionId);
      if (
        tgt &&
        src.side === tgt.side &&
        canCancelOpposites(this.state, sourceFractionId, target.fractionId)
      ) {
        // Le 0 va apparaître à la place de la cible (l'id de la fraction est
        // préservé), mais le layout flex se réaligne après la suppression du
        // dragué. On attend donc une frame pour spawn le pouf à la position
        // finale du 0, pas à sa position pré-réalignement.
        const targetFractionId = target.fractionId;
        this.applyState(cancelOpposites(this.state, sourceFractionId, target.fractionId));
        requestAnimationFrame(() => fx.spawnPuffOnFraction(targetFractionId));
        return true;
      }
    }

    // 3. Cible l'autre membre (et crossPower actif) → moveAcross
    if (
      this.caps.crossPower &&
      (target.side === "lhs" || target.side === "rhs") &&
      (src.side === "lhs" || src.side === "rhs") &&
      src.side !== target.side &&
      canMoveAcross(this.state, sourceFractionId)
    ) {
      this.applyState(moveAcross(this.state, sourceFractionId));
      return true;
    }

    return false;
  }
}

export const game = new GameStore();
