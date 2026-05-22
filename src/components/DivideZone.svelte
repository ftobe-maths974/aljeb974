<script lang="ts">
  /**
   * DivideZone — zone discrète juste SOUS la balance. Si l'élève relâche ici
   * une carte de la pioche, tous les termes des deux membres sont divisés par
   * cette carte.
   *
   * Positionnée en `position: absolute` à l'intérieur du `.balance-group` :
   * - Horizontalement centrée sur la balance complète.
   * - Verticalement collée sous le bord bas du groupe (qui correspond au bas
   *   des deux .side puisque `align-items: stretch`).
   */
  import { drag } from "../state/drag.svelte.ts";
  import { game } from "../state/game.svelte.ts";

  const active = $derived(
    drag.state?.kind === "fraction" && game.caps.dropdenPower,
  );
  const hovered = $derived(drag.hoverDivideZone);
</script>

{#if active}
  <div
    class="divide-zone"
    class:hovered
    data-divide-zone="true"
    aria-hidden="true"
  >
    <span class="sign">÷</span>
    <span class="hint">Dépose ici pour diviser les deux côtés</span>
  </div>
{/if}

<style>
  .divide-zone {
    position: absolute;
    left: 50%;
    /* -0.25rem compense le padding-bottom de 1rem du .balance-group :
       l'écart visuel par rapport au bas des .side est donc ~1.25rem,
       symétrique du gap multiplyZone. */
    bottom: -0.25rem;
    transform: translate(-50%, 100%);
    display: inline-flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.7rem 1.6rem;
    border-radius: 999px;
    border: 2px dashed rgba(255, 255, 255, 0.4);
    background: rgba(15, 23, 34, 0.85);
    color: rgba(255, 255, 255, 0.85);
    font-size: 1rem;
    pointer-events: none;
    z-index: 50;
    white-space: nowrap;
    transition: background 120ms, border-color 120ms, color 120ms, transform 200ms;
    animation: divide-in 250ms ease-out;
  }
  @keyframes divide-in {
    from { opacity: 0; transform: translate(-50%, calc(100% - 8px)); }
    to   { opacity: 1; transform: translate(-50%, 100%); }
  }
  .divide-zone .sign {
    font-family: Georgia, "Times New Roman", serif;
    font-style: italic;
    font-weight: 900;
    font-size: 1.9rem;
    line-height: 1;
  }
  .divide-zone.hovered {
    background: rgba(245, 158, 11, 0.18);
    border-color: var(--accent);
    color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent), 0 0 18px rgba(245, 158, 11, 0.5);
    transform: translate(-50%, 100%) scale(1.05);
  }
</style>
