<script lang="ts">
  /**
   * MultiplyZone — zone discrète juste AU-DESSUS de la balance. Si l'élève
   * relâche ici une carte de la pioche, tous les termes des deux membres
   * sont multipliés par cette carte (ajout au numérateur).
   *
   * Positionnée en `position: absolute` à l'intérieur du `.balance-group` :
   * - Horizontalement centrée sur la balance complète.
   * - Verticalement collée au-dessus du bord haut du groupe.
   *
   * Activée uniquement quand `dropnumPower` est débloqué (niveau 3-7+).
   */
  import { drag } from "../state/drag.svelte.ts";
  import { game } from "../state/game.svelte.ts";

  const active = $derived(
    drag.state?.kind === "fraction" && game.caps.dropnumPower,
  );
  const hovered = $derived(drag.hoverMultiplyZone);
</script>

{#if active}
  <div
    class="multiply-zone"
    class:hovered
    data-multiply-zone="true"
    aria-hidden="true"
  >
    <span class="sign">×</span>
    <span class="hint">Dépose ici pour multiplier les deux côtés</span>
  </div>
{/if}

<style>
  .multiply-zone {
    position: absolute;
    left: 50%;
    top: -1.25rem;
    transform: translate(-50%, -100%);
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.4rem 1rem;
    border-radius: 999px;
    border: 2px dashed rgba(255, 255, 255, 0.4);
    background: rgba(15, 23, 34, 0.85);
    color: rgba(255, 255, 255, 0.78);
    font-size: 0.85rem;
    pointer-events: none;
    z-index: 50;
    white-space: nowrap;
    transition: background 120ms, border-color 120ms, color 120ms, transform 200ms;
    animation: mul-in 250ms ease-out;
  }
  @keyframes mul-in {
    from { opacity: 0; transform: translate(-50%, calc(-100% + 8px)); }
    to   { opacity: 1; transform: translate(-50%, -100%); }
  }
  .multiply-zone .sign {
    font-family: Georgia, "Times New Roman", serif;
    font-style: italic;
    font-weight: 900;
    font-size: 1.5rem;
    line-height: 1;
  }
  .multiply-zone.hovered {
    background: rgba(245, 158, 11, 0.18);
    border-color: var(--accent);
    color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent), 0 0 18px rgba(245, 158, 11, 0.5);
    transform: translate(-50%, -100%) scale(1.05);
  }
</style>
