<script lang="ts">
  /**
   * Balance — visualisation minimaliste de la balance algébrique.
   * Apparaît dès qu'il y a un rhs (niveau 1-5+).
   *
   * Deux plateaux horizontaux arrondis aux extrémités + un petit triangle (pivot)
   * sous le signe =. Le composant se positionne via les rects DOM des éléments
   * `[data-side="lhs"]`, `[data-side="rhs"]` et `.equals`.
   *
   * Il se re-mesure :
   *   - au montage
   *   - sur resize de la fenêtre
   *   - via ResizeObserver sur les sides (responsive)
   *   - sur changement de game.state (cartes ajoutées/retirées)
   */
  import { onMount } from "svelte";
  import { game } from "../state/game.svelte.ts";

  let lhsRect = $state<DOMRect | null>(null);
  let rhsRect = $state<DOMRect | null>(null);
  let equalsRect = $state<DOMRect | null>(null);

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

  // Remesure quand l'état du jeu change (cartes ajoutées/retirées).
  $effect(() => {
    void game.state;
    // léger délai pour laisser le DOM se mettre à jour
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
    "
    aria-hidden="true"
  ></div>
  <!-- Pivot triangulaire sous le signe = -->
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
