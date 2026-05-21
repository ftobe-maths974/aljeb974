/**
 * drag.svelte.ts — état réactif du drag courant + action Svelte pour brancher
 * une fraction draggable. Utilise les pointer events natifs (compatible touch
 * et souris sans dépendance externe).
 *
 * Cycle :
 *   pointerdown sur une fraction → start (capture du pointer)
 *   pointermove                  → update position du ghost
 *   pointerup / pointercancel    → fin : déduire la cible via elementFromPoint
 *                                  et appeler le callback `onDrop`.
 */

interface DragState {
  fractionId: string;
  /** Position courante du pointeur (page coords). */
  x: number;
  y: number;
  /** Décalage entre le pointeur et le coin haut-gauche de l'élément à l'origine. */
  offsetX: number;
  offsetY: number;
  /** Largeur/hauteur de l'élément origine (pour dimensionner le ghost). */
  width: number;
  height: number;
}

class DragStore {
  state = $state<DragState | null>(null);
  /** Id de la fraction survolée (pour highlight visuel). */
  hoverFractionId = $state<string | null>(null);
  /** Côté survolé pour drop sur un membre vide. */
  hoverSide = $state<"lhs" | "rhs" | null>(null);

  isDragging() {
    return this.state !== null;
  }
}

export const drag = new DragStore();

/**
 * Action Svelte 5 à appliquer sur un élément draggable.
 *
 *   <div use:draggable={{ fractionId: f.id, onDrop }}>
 *
 * `onDrop` reçoit `{ fractionId, side }` extraits de l'élément sur lequel
 * le pointeur a été relâché (`data-fraction-id` ou `data-side`).
 */
export interface DraggableParams {
  fractionId: string;
  onDrop: (target: { fractionId?: string; side?: "lhs" | "rhs" }) => void;
}

export function draggable(node: HTMLElement, params: DraggableParams) {
  let current = params;

  function start(e: PointerEvent) {
    // Ne pas démarrer un drag si l'utilisateur clique sur un bouton (carte cliquable)
    // — pour ne pas voler le clic « supprimer un 0 ». On lance le drag uniquement
    // après un déplacement significatif (~ 6 px).
    const rect = node.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    let started = false;

    function onMove(ev: PointerEvent) {
      if (!started) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (Math.hypot(dx, dy) < 6) return;
        // Déclencher le drag
        started = true;
        node.setPointerCapture(ev.pointerId);
        drag.state = {
          fractionId: current.fractionId,
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
        updateHover(ev.clientX, ev.clientY);
      }
    }

    function onEnd(ev: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      if (started) {
        const target = pickTarget(ev.clientX, ev.clientY, current.fractionId);
        drag.state = null;
        drag.hoverFractionId = null;
        drag.hoverSide = null;
        if (target) current.onDrop(target);
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  }

  function updateHover(x: number, y: number) {
    const t = pickTarget(x, y, current.fractionId);
    drag.hoverFractionId = t?.fractionId ?? null;
    drag.hoverSide = t?.side ?? null;
  }

  node.addEventListener("pointerdown", start);
  node.style.touchAction = "none"; // empêche scroll/zoom pendant le drag

  return {
    update(next: DraggableParams) {
      current = next;
    },
    destroy() {
      node.removeEventListener("pointerdown", start);
    },
  };
}

/**
 * Identifie la cible sous le pointeur. On regarde d'abord la fraction la plus
 * proche (autre que la source), puis à défaut le côté (lhs/rhs).
 */
function pickTarget(
  x: number,
  y: number,
  sourceFractionId: string,
): { fractionId?: string; side?: "lhs" | "rhs" } | null {
  const elements = document.elementsFromPoint(x, y);
  let fractionId: string | undefined;
  let side: "lhs" | "rhs" | undefined;
  for (const el of elements) {
    if (!(el instanceof HTMLElement)) continue;
    if (!fractionId) {
      const fid = el.closest<HTMLElement>("[data-fraction-id]")?.dataset.fractionId;
      if (fid && fid !== sourceFractionId) fractionId = fid;
    }
    if (!side) {
      const s = el.closest<HTMLElement>("[data-side]")?.dataset.side;
      if (s === "lhs" || s === "rhs") side = s;
    }
    if (fractionId && side) break;
  }
  if (!fractionId && !side) return null;
  return { fractionId, side };
}
