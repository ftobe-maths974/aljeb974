/**
 * drag.svelte.ts — état réactif du drag courant + actions Svelte pour brancher
 * une fraction OU une carte draggable, avec gestion des conflits parent/enfant.
 *
 * Deux niveaux de drag coexistent :
 *  - `draggable`     : sur une Fraction.svelte (déplacement entier du terme,
 *                       annulation d'opposés, cross-side, drop depuis pioche…)
 *  - `draggableCard` : sur une Card.svelte située dans le dénominateur d'une
 *                       fraction (et plus tard num/dén avec multPower). Sert à
 *                       simplifier p/p en 1 (drag carte sur sa contrepartie).
 *
 * Pour éviter que démarrer un drag de carte déclenche aussi le drag de la
 * fraction parente, `draggableCard` appelle e.stopPropagation() sur son
 * pointerdown — la fraction ne reçoit jamais l'événement.
 *
 * Cycle des deux actions identique :
 *   pointerdown sur l'élément → seuil de 6 px de mouvement → start
 *   pointermove               → update position
 *   pointerup / pointercancel → fin, pick de la cible via elementFromPoint
 */

import { astuce } from "./astuce.svelte.ts";

export interface FractionDragState {
  kind: "fraction";
  fractionId: string;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export interface CardDragState {
  kind: "card";
  cardId: string;
  parentFractionId: string;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

class DragStore {
  /** État du drag courant (soit fraction soit carte). Un seul à la fois. */
  state = $state<FractionDragState | CardDragState | null>(null);
  /** Fraction survolée (highlight pendant un drag de fraction). */
  hoverFractionId = $state<string | null>(null);
  /** Carte survolée (highlight pendant un drag de carte). */
  hoverCardId = $state<string | null>(null);
  /** Trou « _ » survolé pendant un drag de fraction de pioche. */
  hoverHoleCardId = $state<string | null>(null);
  /** True quand le pointeur est dans la zone « sous l'équation » (division). */
  hoverDivideZone = $state(false);
  /** True quand le pointeur est dans la zone « au-dessus de l'équation » (multiplication). */
  hoverMultiplyZone = $state(false);
  /** Côté survolé. */
  hoverSide = $state<"lhs" | "rhs" | null>(null);

  isDragging() {
    return this.state !== null;
  }
  isCardDrag() {
    return this.state?.kind === "card";
  }
}

/**
 * Avale le 1ᵉʳ click synthétique post-pointerup (sinon le browser le dispatche
 * sur l'élément cible et fait monter le compteur de coups via onclick).
 * Listener document-level en CAPTURE phase one-shot, auto-nettoyé après 80 ms.
 */
function suppressNextClick() {
  const handler = (e: Event) => {
    e.stopImmediatePropagation();
    e.preventDefault();
    document.removeEventListener("click", handler, true);
  };
  document.addEventListener("click", handler, true);
  setTimeout(() => document.removeEventListener("click", handler, true), 80);
}


export const drag = new DragStore();

/* ─── Action : drag d'une Fraction ────────────────────────────────────────── */

export interface DropTarget {
  fractionId?: string;
  side?: "lhs" | "rhs";
  /** Carte « _ » (trou) survolée — utilisée pour le drop dans dén/num (dropdenPower / dropnumPower). */
  holeCardId?: string;
  /** True si le pointeur est dans la zone « sous l'équation » → division. */
  divideZone?: boolean;
  /** True si le pointeur est dans la zone « au-dessus de l'équation » → multiplication. */
  multiplyZone?: boolean;
  /** Région survolée : « numerator » ou « denominator » d'une fraction (dropnumPower / dropdenPower). */
  region?: "numerator" | "denominator";
}

export interface DraggableParams {
  fractionId: string;
  onDrop: (target: DropTarget) => void;
}

export function draggable(node: HTMLElement, params: DraggableParams) {
  let current = params;
  let cleanup: (() => void) | null = null;

  function start(e: PointerEvent) {
    // Si un drag de carte est déjà en cours (depuis un enfant) — ne pas démarrer.
    if (drag.isCardDrag()) return;
    cleanup?.();
    cleanup = beginDrag(
      e,
      () => ({
        kind: "fraction",
        fractionId: current.fractionId,
        x: e.clientX,
        y: e.clientY,
        offsetX: 0,
        offsetY: 0,
        width: 0,
        height: 0,
      }),
      node,
      (clientX, clientY) => updateHoverForFraction(clientX, clientY, current.fractionId),
      (clientX, clientY) => {
        const target = pickFractionTarget(clientX, clientY, current.fractionId);
        if (target) current.onDrop(target);
      },
    );
  }

  node.addEventListener("pointerdown", start);
  node.style.touchAction = "none";

  return {
    update(next: DraggableParams) {
      current = next;
    },
    destroy() {
      node.removeEventListener("pointerdown", start);
      cleanup?.();
    },
  };
}

/* ─── Action : drag d'une Card (carte individuelle) ───────────────────────── */

export interface DraggableCardParams {
  cardId: string;
  parentFractionId: string;
  onDrop: (targetCardId: string | null) => void;
}

/**
 * Action « draggable » pour une carte individuelle. Acceptée avec `null`
 * → l'action est attachée mais inactive (cas du cartes non-draggables :
 * num en chap. 1-3, pioche, etc.). Permet d'appeler `use:draggableCard`
 * de façon conditionnelle sans dupliquer le markup du bouton.
 */
export function draggableCard(node: HTMLElement, params: DraggableCardParams | null) {
  let current = params;
  let cleanup: (() => void) | null = null;

  function start(e: PointerEvent) {
    if (!current) return; // inactif
    // CLÉ : on stoppe ici la propagation pour empêcher le `pointerdown` listener
    // de la Fraction parente de démarrer son propre drag. Cf. pattern « ninja ».
    e.stopPropagation();
    const params = current;
    cleanup?.();
    cleanup = beginDrag(
      e,
      () => ({
        kind: "card",
        cardId: params.cardId,
        parentFractionId: params.parentFractionId,
        x: e.clientX,
        y: e.clientY,
        offsetX: 0,
        offsetY: 0,
        width: 0,
        height: 0,
      }),
      node,
      (clientX, clientY) => updateHoverForCard(clientX, clientY, params.cardId, params.parentFractionId),
      (clientX, clientY) => {
        const target = pickCardTarget(clientX, clientY, params.cardId, params.parentFractionId);
        params.onDrop(target);
      },
    );
  }

  function syncTouchAction() {
    node.style.touchAction = current ? "none" : "";
  }

  node.addEventListener("pointerdown", start);
  syncTouchAction();

  return {
    update(next: DraggableCardParams | null) {
      current = next;
      syncTouchAction();
    },
    destroy() {
      node.removeEventListener("pointerdown", start);
      cleanup?.();
    },
  };
}

/* ─── Helpers internes ────────────────────────────────────────────────────── */

/**
 * Logique commune aux deux actions : seuil de 6 px, capture du pointer,
 * suivi de position, et appel des callbacks de hover/drop à la fin.
 */
function beginDrag(
  e: PointerEvent,
  buildState: () => FractionDragState | CardDragState,
  node: HTMLElement,
  onHover: (x: number, y: number) => void,
  onEnd: (x: number, y: number) => void,
): () => void {
  const rect = node.getBoundingClientRect();
  const startX = e.clientX;
  const startY = e.clientY;
  let started = false;

  function onMove(ev: PointerEvent) {
    if (!started) {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 6) return;
      started = true;
      // Démarrer un drag (carte ou terme) éteint la main d'astuce.
      astuce.stop();
      try { node.setPointerCapture(ev.pointerId); } catch {}
      const initial = buildState();
      drag.state = {
        ...initial,
        x: ev.clientX,
        y: ev.clientY,
        offsetX: startX - rect.left,
        offsetY: startY - rect.top,
        width: rect.width,
        height: rect.height,
      };
    }
    if (drag.state) {
      drag.state = { ...drag.state, x: ev.clientX, y: ev.clientY };
      onHover(ev.clientX, ev.clientY);
    }
  }

  function onUp(ev: PointerEvent) {
    cleanup();
    if (started) {
      drag.state = null;
      drag.hoverFractionId = null;
      drag.hoverCardId = null;
      drag.hoverHoleCardId = null;
      drag.hoverDivideZone = false;
      drag.hoverMultiplyZone = false;
      drag.hoverSide = null;
      // Le browser dispatche un click synthétique après pointerup. Sans
      // protection, le click se propage au composant qui appelle alors
      // handleCardClick → recordShot, qui DOUBLE le coût du drag. On l'avale
      // via un listener document-level en CAPTURE phase one-shot.
      suppressNextClick();
      onEnd(ev.clientX, ev.clientY);
    }
  }

  function cleanup() {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  return cleanup;
}

/* ─── Détection des cibles ────────────────────────────────────────────────── */

function updateHoverForFraction(x: number, y: number, sourceFractionId: string) {
  const t = pickFractionTarget(x, y, sourceFractionId);
  drag.hoverFractionId = t?.fractionId ?? null;
  drag.hoverSide = t?.side ?? null;
  drag.hoverHoleCardId = t?.holeCardId ?? null;
  drag.hoverDivideZone = t?.divideZone ?? false;
  drag.hoverMultiplyZone = t?.multiplyZone ?? false;
  drag.hoverCardId = null;
}

function pickFractionTarget(
  x: number,
  y: number,
  sourceFractionId: string,
): DropTarget | null {
  const elements = document.elementsFromPoint(x, y);
  let fractionId: string | undefined;
  let side: "lhs" | "rhs" | undefined;
  let holeCardId: string | undefined;
  let region: "numerator" | "denominator" | undefined;
  let divideZone = false;
  let multiplyZone = false;
  for (const el of elements) {
    if (!(el instanceof HTMLElement)) continue;
    if (!holeCardId) {
      const holeEl = el.closest<HTMLElement>('[data-card-value="_"]');
      const id = holeEl?.dataset.cardId;
      if (id) holeCardId = id;
    }
    if (!region) {
      const r = el.closest<HTMLElement>("[data-region]")?.dataset.region;
      if (r === "numerator" || r === "denominator") region = r;
    }
    if (!fractionId) {
      const fid = el.closest<HTMLElement>("[data-fraction-id]")?.dataset.fractionId;
      if (fid && fid !== sourceFractionId) fractionId = fid;
    }
    if (!side) {
      const s = el.closest<HTMLElement>("[data-side]")?.dataset.side;
      if (s === "lhs" || s === "rhs") side = s;
    }
    // closest pour matcher l'élément ET ses descendants (.sign, .hint…).
    if (!divideZone && el.closest<HTMLElement>("[data-divide-zone]")) {
      divideZone = true;
    }
    if (!multiplyZone && el.closest<HTMLElement>("[data-multiply-zone]")) {
      multiplyZone = true;
    }
    if (holeCardId && fractionId && side && region && divideZone && multiplyZone) break;
  }
  // Zone géométrique BORNÉE sous (÷) / au-dessus (×) de l'équation. Généreuse
  // mais limitée : relâcher hors de cette bande (et hors des .side) ⇒ rien
  // (pas de division/multiplication accidentelle).
  if (!divideZone && !multiplyZone && !side && !fractionId && !holeCardId && !region) {
    const rects = (["lhs", "rhs"] as const)
      .map((s) => document.querySelector<HTMLElement>(`[data-side="${s}"]`)?.getBoundingClientRect())
      .filter((r): r is DOMRect => !!r);
    if (rects.length) {
      const ZONE_H = 140; // hauteur de la bande (px)
      const X_MARGIN = 100; // débordement horizontal autorisé
      const bottom = Math.max(...rects.map((r) => r.bottom));
      const top = Math.min(...rects.map((r) => r.top));
      const left = Math.min(...rects.map((r) => r.left)) - X_MARGIN;
      const right = Math.max(...rects.map((r) => r.right)) + X_MARGIN;
      const inX = x >= left && x <= right;
      if (inX && y > bottom && y <= bottom + ZONE_H) divideZone = true;
      else if (inX && y < top && y >= top - ZONE_H) multiplyZone = true;
    }
  }
  if (!fractionId && !side && !holeCardId && !divideZone && !multiplyZone && !region) return null;
  return { fractionId, side, holeCardId, divideZone, multiplyZone, region };
}

function updateHoverForCard(x: number, y: number, sourceCardId: string, parentFractionId: string) {
  const t = pickCardTarget(x, y, sourceCardId, parentFractionId);
  drag.hoverCardId = t;
  drag.hoverFractionId = null;
  drag.hoverSide = null;
}

/** Cible valide : une autre carte située dans la MÊME fraction parente. */
function pickCardTarget(
  x: number,
  y: number,
  sourceCardId: string,
  parentFractionId: string,
): string | null {
  const elements = document.elementsFromPoint(x, y);
  for (const el of elements) {
    if (!(el instanceof HTMLElement)) continue;
    const cardEl = el.closest<HTMLElement>("[data-card-id]");
    if (!cardEl) continue;
    const cardId = cardEl.dataset.cardId;
    if (!cardId || cardId === sourceCardId) continue;
    // Doit appartenir à la même fraction parente
    const parent = cardEl.closest<HTMLElement>("[data-fraction-id]");
    if (parent?.dataset.fractionId === parentFractionId) {
      return cardId;
    }
  }
  return null;
}
