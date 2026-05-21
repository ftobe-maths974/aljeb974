<script lang="ts">
  /**
   * Balance — visualisation minimaliste de la balance algébrique.
   *
   * Apparaît dès qu'un rhs est présent (niveau 1-5+).
   * Deux plateaux horizontaux arrondis + un petit triangle (pivot) sous le =.
   *
   * Quand le moteur est en `pending` (carte posée d'un seul côté), la balance
   * penche : le plateau qui a reçu la carte descend, l'autre monte. La
   * transition utilise une courbe d'overshoot pour un effet ressort.
   */
  import { onMount } from "svelte";
  import { game } from "../state/game.svelte.ts";

  let lhsRect = $state<DOMRect | null>(null);
  let rhsRect = $state<DOMRect | null>(null);
  let equalsRect = $state<DOMRect | null>(null);

  /**
   * Décalage vertical de chaque plateau pour simuler la bascule.
   * - Côté qui a déjà reçu la carte (absent de remainingTargets) → +TILT (descend)
   * - Côté qui attend encore la carte (dans remainingTargets)     → -TILT (monte)
   * - Pas de pending                                              →   0
   */
  const TILT = 16;
  const tilt = $derived.by(() => {
    const p = game.state?.pending;
    if (!p) return { lhs: 0, rhs: 0 };
    const lhsHeavy = !p.remainingTargets.includes("lhs");
    const rhsHeavy = !p.remainingTargets.includes("rhs");
    return {
      lhs: lhsHeavy ? TILT : rhsHeavy ? -TILT : 0,
      rhs: rhsHeavy ? TILT : lhsHeavy ? -TILT : 0,
    };
  });

  function measure() {
    const lhs = document.querySelector<HTMLElement>('[data-side="lhs"]');
    const rhs = document.querySelector<HTMLElement>('[data-side="rhs"]');
    const eq = document.querySelector<HTMLElement>(".equals");
    lhsRect = lhs?.getBoundingClientRect() ?? null;
    rhsRect = rhs?.getBoundingClientRect() ?? null;
    equalsRect = eq?.getBoundingClientRect() ?? null;
  }

  onMount(() => {
    measure();
    const ro = new ResizeObserver(measure);
    const observe = (el: Element | null) => el && ro.observe(el);
    observe(document.querySelector('[data-side="lhs"]'));
    observe(document.querySelector('[data-side="rhs"]'));
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  });

  $effect(() => {
    void game.state;
    requestAnimationFrame(measure);
  });
</script>

{#if lhsRect && rhsRect && equalsRect}
  <!-- Plateau gauche -->
  <div
    class="platter"
    style="
      left: {lhsRect.left}px;
      top: {lhsRect.bottom + 6}px;
      width: {lhsRect.width}px;
      transform: translateY({tilt.lhs}px);
    "
    aria-hidden="true"
  ></div>
  <!-- Plateau droit -->
  <div
    class="platter"
    style="
      left: {rhsRect.left}px;
      top: {rhsRect.bottom + 6}px;
      width: {rhsRect.width}px;
      transform: translateY({tilt.rhs}px);
    "
    aria-hidden="true"
  ></div>
  <!-- Pivot triangulaire sous le = (fixe, ne penche pas) -->
  <div
    class="pivot"
    style="
      left: {equalsRect.left + equalsRect.width / 2}px;
      top: {equalsRect.bottom + 6}px;
    "
    aria-hidden="true"
  ></div>
{/if}

<style>
  .platter {
    position: fixed;
    height: 8px;
    background: rgba(241, 245, 249, 0.55);
    border-radius: 999px;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
    pointer-events: none;
    z-index: 0;
    /* Courbe d'overshoot pour l'effet ressort de la bascule */
    transition: transform 650ms cubic-bezier(0.34, 1.56, 0.64, 1);
    will-change: transform;
  }
  .pivot {
    position: fixed;
    width: 0;
    height: 0;
    border-left: 14px solid transparent;
    border-right: 14px solid transparent;
    border-bottom: 18px solid rgba(241, 245, 249, 0.55);
    transform: translateX(-50%);
    filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.4));
    pointer-events: none;
    z-index: 0;
  }
</style>
