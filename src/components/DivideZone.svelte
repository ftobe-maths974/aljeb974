<script lang="ts">
  /**
   * DivideZone — zone discrète qui apparaît sous le balance-group quand
   * l'élève drague une carte de la pioche. Si la carte est relâchée ici,
   * tous les termes des deux membres sont divisés par cette carte.
   *
   * Le drag store détecte l'entrée du pointeur via `data-divide-zone="true"`
   * et `drag.hoverDivideZone`.
   */
  import { drag } from "../state/drag.svelte.ts";

  // Visible seulement pendant un drag de fraction issue de la pioche.
  const active = $derived(
    drag.state?.kind === "fraction",
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
    bottom: 0.75rem;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.4rem 1rem;
    border-radius: 999px;
    border: 2px dashed rgba(255, 255, 255, 0.35);
    background: rgba(15, 23, 34, 0.45);
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
    pointer-events: none;
    z-index: 5;
    transition: background 120ms, border-color 120ms, color 120ms, transform 200ms;
    animation: divide-in 250ms ease-out;
  }
  @keyframes divide-in {
    from { opacity: 0; transform: translate(-50%, 12px); }
    to   { opacity: 1; transform: translateX(-50%); }
  }
  .divide-zone .sign {
    font-family: Georgia, "Times New Roman", serif;
    font-style: italic;
    font-weight: 900;
    font-size: 1.5rem;
    line-height: 1;
  }
  .divide-zone.hovered {
    background: rgba(245, 158, 11, 0.18);
    border-color: var(--accent);
    color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent), 0 0 18px rgba(245, 158, 11, 0.5);
    transform: translateX(-50%) scale(1.05);
  }
</style>
