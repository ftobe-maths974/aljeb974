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
  addLiterals,
  canAddLiterals,
  canFillHole,
  canReverseInPioche,
  canSimplifyFraction,
  capabilitiesFor,
  completePiocheDrop,
  fillHole,
  deleteOne,
  deleteZero,
  initialState,
  isSolved,
  locateCard,
  locateFraction,
  moveAcross,
  reverseInPioche,
  simplifyFraction,
  stars,
  startPiocheDrop,
  type Capabilities,
  type GameState,
} from "../lib/engine/index.ts";
import levelsData from "../../migration/levels.json";
import { astuce } from "./astuce.svelte.ts";
import { fx } from "./fx.svelte.ts";
import { t } from "../i18n/store.svelte.ts";

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

  /**
   * Compteur incrémenté à chaque appel de loadLevel(), même si chapter/level
   * sont identiques. Permet aux $effect (LevelIntro, astuces…) de se redéclencher
   * sur un restart au niveau identique.
   */
  loadCounter = $state(0);

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
    this.loadCounter += 1;
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
   * Met à jour l'état et gère la transition vers la victoire :
   *  - Niveaux sans rhs (1-1 à 1-4)   : victoire auto après le délai vapeur.
   *  - Niveaux avec rhs (1-5 et +)    : on affiche d'abord « x = … » et on
   *                                      attend la validation explicite de
   *                                      l'élève (game.confirmVictory()).
   */
  private applyState(newState: GameState) {
    const wasSolved = this.state ? isSolved(this.state) : false;
    this.state = newState;
    if (!wasSolved && isSolved(newState)) {
      if (this.victoryTimer) clearTimeout(this.victoryTimer);
      this.victoryReady = false;
      if (newState.rhs.length === 0) {
        this.victoryTimer = setTimeout(() => {
          this.victoryReady = true;
        }, GameStore.VICTORY_DELAY_MS);
      }
      // Sinon : on n'arme pas de timer ; l'UI affiche la solution + bouton Valider.
    }
  }

  /** Appelé par l'UI pour passer de l'écran « x = … » à l'overlay de récompenses. */
  confirmVictory() {
    this.victoryReady = true;
  }

  /**
   * Incrémente le compteur de coups. À appeler par l'UI à chaque interaction
   * (clic ou drop), qu'elle réussisse ou non — c'est le contrat utilisateur :
   * « chaque clic est un coup, chaque drag&drop aussi ».
   */
  recordShot() {
    if (!this.state) return;
    this.state = { ...this.state, shots: this.state.shots + 1 };
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
  tryDrop(sourceFractionId: string, target: { fractionId?: string; side?: "lhs" | "rhs"; holeCardId?: string }) {
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
        // L'opération va-t-elle clore le pending (dernier côté à servir) ?
        const willBalance = this.state.pending.remainingTargets.length === 1;
        const targetSide = target.side;
        this.applyState(completePiocheDrop(this.state, target.side, {
          dropOnce: this.caps.dropOnce,
        }));
        if (willBalance) {
          // Le pouf doit apparaître sur la carte qui vient d'être posée
          // (= la dernière fraction du côté cible), pas au centre du membre.
          // Petit délai pour laisser la balance revenir à l'équilibre.
          setTimeout(() => {
            const after = this.state;
            if (!after) return;
            const arr = after[targetSide];
            const newFrac = arr[arr.length - 1];
            if (!newFrac) return;
            fx.spawnPuffOnFraction(newFrac.id, t().fx.balanceRestored);
          }, 250);
        }
        return true;
      }
      // Drop interdit : on lève une alerte
      this.flashAlert();
      return false;
    }

    // ─── Mode normal ────────────────────────────────────────────────────────
    // 0. Source de la pioche + cible un trou « _ » → fillHole (dropdenPower / dropnumPower).
    //    Doit être vérifié AVANT le drop sur côté (le _ est inclus dans un Side).
    if (
      src.side === "pioche" &&
      target.holeCardId &&
      canFillHole(this.state, sourceFractionId, target.holeCardId)
    ) {
      // Capture la position du trou ET du Side parent AVANT le remplacement
      // (l'élément DOM disparaît après applyState).
      const holeEl = document.querySelector<HTMLElement>(
        `[data-card-id="${target.holeCardId}"]`,
      );
      const holeRect = holeEl?.getBoundingClientRect() ?? null;
      const sideTop = holeEl
        ?.closest<HTMLElement>("[data-side]")
        ?.getBoundingClientRect().top;
      this.applyState(
        fillHole(this.state, sourceFractionId, target.holeCardId, {
          dropOnce: this.caps.dropOnce,
        }),
      );
      if (holeRect) {
        fx.spawnPuff(
          holeRect.left + holeRect.width / 2,
          holeRect.top + holeRect.height / 2,
          t().fx.fillHole,
          sideTop !== undefined ? sideTop - 14 : undefined,
        );
      }
      return true;
    }

    // 1. Source de la pioche + cible un côté → première étape du drop équivalence
    if (src.side === "pioche" && (target.side === "lhs" || target.side === "rhs")) {
      this.applyState(startPiocheDrop(this.state, sourceFractionId, target.side));
      return true;
    }

    // 2. Cible une fraction du même membre :
    //    - atomes opposés       → cancelOpposites
    //    - deux littéraux + add → addLiterals (chap. 4+)
    if (target.fractionId) {
      const tgt = locateFraction(this.state, target.fractionId);
      if (tgt && src.side === tgt.side) {
        if (canCancelOpposites(this.state, sourceFractionId, target.fractionId)) {
          const targetFractionId = target.fractionId;
          this.applyState(cancelOpposites(this.state, sourceFractionId, target.fractionId));
          requestAnimationFrame(() =>
            fx.spawnPuffOnFraction(targetFractionId, t().fx.oppositesCancel),
          );
          return true;
        }
        if (
          this.caps.addPower &&
          canAddLiterals(this.state, sourceFractionId, target.fractionId)
        ) {
          const targetFractionId = target.fractionId;
          this.applyState(addLiterals(this.state, sourceFractionId, target.fractionId));
          requestAnimationFrame(() =>
            fx.spawnPuffOnFraction(targetFractionId, t().fx.addLiterals),
          );
          return true;
        }
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
      const targetSide = target.side;
      this.applyState(moveAcross(this.state, sourceFractionId));
      // Pouf + slogan sur la carte qui vient de traverser (dernière du côté).
      requestAnimationFrame(() => {
        const after = this.state;
        if (!after) return;
        const arr = after[targetSide];
        const newFrac = arr[arr.length - 1];
        if (!newFrac) return;
        fx.spawnPuffOnFraction(newFrac.id, t().fx.crossSign);
      });
      return true;
    }

    return false;
  }

  /**
   * Drag carte → carte : simplification num/dén équivalents au sein d'une
   * même fraction. Le numérateur cible devient 1, la carte de dénominateur
   * disparaît. Pouf + slogan.
   */
  tryCardDrop(sourceCardId: string, targetCardId: string | null): boolean {
    if (!this.state) return false;
    if (this.state.pending) {
      this.flashAlert();
      return false;
    }
    if (!targetCardId) return false;
    if (!canSimplifyFraction(this.state, sourceCardId, targetCardId)) return false;
    // Pouf à l'endroit de la carte cible (qui devient « 1 »).
    fx.spawnPuffOnCard(targetCardId, t().fx.simplifyFraction);
    this.applyState(simplifyFraction(this.state, sourceCardId, targetCardId));
    return true;
  }
}

export const game = new GameStore();
