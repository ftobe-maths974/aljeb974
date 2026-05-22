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
  applyNegOne,
  canAddLiterals,
  canApplyNegOne,
  canDivideAll,
  canMultiplyAllNum,
  multiplyAllNum,
  canFactorize,
  canFillHole,
  canMultiplyInFraction,
  canReverseInPioche,
  canSimplifyFraction,
  capabilitiesFor,
  completePiocheDrop,
  factorize,
  divideAll,
  fillHole,
  multiplyInFraction,
  deleteOne,
  deleteZero,
  initialState,
  isSolved,
  locateFraction,
  makeIdSource,
  moveAcross,
  reverseInPioche,
  revealClosure,
  serializeAtom,
  simplifyFraction,
  stars,
  startPiocheDrop,
  type Atom,
  type Capabilities,
  type FractionInstance,
  type GameState,
  type RevealItem,
} from "../lib/engine/index.ts";
import levelsData from "../../migration/levels.json";
import { bonusChapter, isSandbox, SANDBOX_CHAPTER, SANDBOX_LEVEL } from "../data/bonus.ts";
import { sandbox } from "./sandbox.svelte.ts";
import { astuce } from "./astuce.svelte.ts";
import { fx } from "./fx.svelte.ts";
import { t } from "../i18n/store.svelte.ts";

// ─── Lookup helper ──────────────────────────────────────────────────────────

function findLevel(chapter: number, level: number) {
  // Chapitre bonus (sandbox) défini en code, hors levels.json.
  const chap =
    chapter === bonusChapter.index
      ? bonusChapter
      : levelsData.chapters.find((c) => c.index === chapter);
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

  caps = $derived<Capabilities>(
    isSandbox(this.chapter, this.level)
      ? sandbox.powers
      : capabilitiesFor(this.chapter, this.level),
  );
  /**
   * Ensemble des symboles « révélés » (affichés en texte) au niveau courant,
   * opposés inclus. Pilote l'affichage texte vs sprite des cartes
   * (cf. shouldRevealAsText + feature card-form). Reproduit l'évolution
   * pédagogique du `reveal` legacy.
   */
  revealSet = $derived<ReadonlySet<string>>(
    revealClosure(
      findLevel(this.chapter, this.level).reveal as RevealItem[] | undefined,
    ),
  );
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

  /** Charge une équation personnalisée dans le bac à sable (depuis le prompt). */
  loadSandbox(level: Parameters<typeof initialState>[0]) {
    this.chapter = SANDBOX_CHAPTER;
    this.level = SANDBOX_LEVEL;
    this.loadCounter += 1;
    this.state = initialState(level, `${SANDBOX_CHAPTER}-${SANDBOX_LEVEL}`);
    if (this.victoryTimer) {
      clearTimeout(this.victoryTimer);
      this.victoryTimer = null;
    }
    this.victoryReady = false;
    astuce.stop();
  }

  /**
   * Sandbox : ajoute/retire une carte (atome unique) dans la banque (pioche).
   * Unique par valeur sérialisée ; re-clic = retrait.
   */
  togglePiocheItem(atom: Atom) {
    if (!this.state) return;
    const val = serializeAtom(atom);
    const same = (f: FractionInstance) =>
      !f.denominator &&
      f.numerator.length === 1 &&
      serializeAtom(f.numerator[0]!.atom) === val;
    let pioche: FractionInstance[];
    if (this.state.pioche.some(same)) {
      pioche = this.state.pioche.filter((f) => !same(f));
    } else {
      const ids = makeIdSource(`sb${this.loadCounter}_${this.state.pioche.length}_`);
      pioche = [
        ...this.state.pioche,
        { id: ids.next(), numerator: [{ id: ids.next(), atom: { ...atom } }] },
      ];
    }
    this.state = { ...this.state, pioche };
  }

  /** Sandbox : la valeur sérialisée est-elle déjà dans la banque ? */
  piocheHas(atom: Atom): boolean {
    if (!this.state) return false;
    const val = serializeAtom(atom);
    return this.state.pioche.some(
      (f) =>
        !f.denominator &&
        f.numerator.length === 1 &&
        serializeAtom(f.numerator[0]!.atom) === val,
    );
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
    // Un coup réussi éteint la main d'astuce (couvre les astuces de type tap ;
    // les drags l'éteignent dès leur démarrage, cf. drag.svelte.ts).
    astuce.stop();
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
  tryDrop(sourceFractionId: string, target: { fractionId?: string; side?: "lhs" | "rhs"; holeCardId?: string; divideZone?: boolean; multiplyZone?: boolean }) {
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
    // -2. Source de la pioche + zone « au-dessus de l'équation » → multiplie
    //     les deux membres par la carte (ajoute au numérateur de toute fraction).
    if (
      src.side === "pioche" &&
      target.multiplyZone &&
      this.caps.dropnumPower &&
      canMultiplyAllNum(this.state, sourceFractionId)
    ) {
      this.applyState(
        multiplyAllNum(this.state, sourceFractionId, { dropOnce: this.caps.dropOnce }),
      );
      requestAnimationFrame(() => {
        const lhs = document.querySelector<HTMLElement>('[data-side="lhs"]')?.getBoundingClientRect();
        const rhs = document.querySelector<HTMLElement>('[data-side="rhs"]')?.getBoundingClientRect();
        if (lhs && rhs) {
          const cx = (lhs.left + rhs.right) / 2;
          const cy = Math.min(lhs.top, rhs.top) - 16;
          fx.spawnPuff(cx, cy, t().fx.multiplyAll, cy - 40);
        }
      });
      return true;
    }
    // -1. Source de la pioche + zone « sous l'équation » → divise les deux
    //     membres par la carte (ajoute au dénominateur de toute fraction).
    if (
      src.side === "pioche" &&
      target.divideZone &&
      this.caps.dropdenPower &&
      canDivideAll(this.state, sourceFractionId)
    ) {
      this.applyState(
        divideAll(this.state, sourceFractionId, { dropOnce: this.caps.dropOnce }),
      );
      requestAnimationFrame(() => {
        // Pouf au centre de la zone divisée (sous l'équation, centré).
        const lhs = document.querySelector<HTMLElement>('[data-side="lhs"]')?.getBoundingClientRect();
        const rhs = document.querySelector<HTMLElement>('[data-side="rhs"]')?.getBoundingClientRect();
        if (lhs && rhs) {
          const cx = (lhs.left + rhs.right) / 2;
          const cy = Math.max(lhs.bottom, rhs.bottom) + 16;
          fx.spawnPuff(cx, cy, t().fx.divideAll, cy - 40);
        }
      });
      return true;
    }
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
    // 1. Simplification : num et dén ont la même valeur → cible devient 1.
    if (canSimplifyFraction(this.state, sourceCardId, targetCardId)) {
      fx.spawnPuffOnCard(targetCardId, t().fx.simplifyFraction);
      this.applyState(simplifyFraction(this.state, sourceCardId, targetCardId));
      return true;
    }
    // 2. Drag d'un « −1 » sur une carte de même région (negPower, chap. 5+) :
    //    prend l'opposé. Doit être vérifié AVANT multiplyInFraction (qui
    //    accepte deux littéraux et donnerait juste le produit).
    if (
      this.caps.negPower &&
      canApplyNegOne(this.state, sourceCardId, targetCardId)
    ) {
      const tId = targetCardId;
      this.applyState(applyNegOne(this.state, sourceCardId, targetCardId));
      // Le -1 supprimé fait reflower la rangée — on attend une frame pour
      // que le pouf soit à la position FINALE de la carte qui a changé de signe.
      requestAnimationFrame(() => fx.spawnPuffOnCard(tId, t().fx.negOne));
      return true;
    }
    // 3. Multiplication intra-fraction (multPower) : deux littéraux dans la
    //    même région → cible devient le produit, source disparaît.
    if (
      this.caps.multPower &&
      canMultiplyInFraction(this.state, sourceCardId, targetCardId)
    ) {
      fx.spawnPuffOnCard(targetCardId, t().fx.multiply);
      this.applyState(multiplyInFraction(this.state, sourceCardId, targetCardId));
      return true;
    }
    return false;
  }

  /**
   * Double-clic sur un littéral → décomposition en facteurs premiers.
   * Gated uniquement par `primeFactorPower` : la même règle s'applique
   * aux positifs (> 3) et aux négatifs (|v| > 1, avec un -1 séparé).
   */
  tryFactorize(cardId: string): boolean {
    if (!this.state) return false;
    if (!this.caps.primeFactorPower) return false;
    if (!canFactorize(this.state, cardId)) return false;
    fx.spawnPuffOnCard(cardId, t().fx.factorize);
    this.applyState(factorize(this.state, cardId));
    return true;
  }
}

export const game = new GameStore();
